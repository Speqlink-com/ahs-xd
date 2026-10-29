"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import Investor, { DEFAULT_INVESTOR_STATUSES } from "@/models/Investor";
import InvestorPipeline from "@/models/InvestorPipeline";
import User from "@/models/User";

const VIEW_ROLES = ["superadmin", "admin", "ops"];
const EDIT_ROLES = ["superadmin", "ops"];
const PAGE_SIZE = 20;
type Result = { success: boolean; message: string; id?: string };
type Filters = { q?: string; status?: string; wave?: string; manager?: string; priority?: string; sort?: string; page?: string };
export type InvestorView = { _id: string; name: string; organization: string; wave: string; status: string; priority: string; manager?: { _id: string; name: string; email?: string } | null; contactEmail: string; contactPhone: string; investmentFocus: string; notes: string; nextAction: string; nextFollowUp: string | null; lastContacted: string | null; lastUpdatedByName: string; updatedAt: string; events: { _id?: string; kind: string; at: string; actorName: string; previousStatus?: string; newStatus?: string; remarks?: string; outcome?: string; scheduledFor?: string; meetingStage?: string }[] };
export type InvestorOptions = { statuses: string[]; waves: string[]; managers: { _id: string; name: string }[] };
export type InvestorDirectoryData = { investors: InvestorView[]; total: number; page: number; pageCount: number; pageSize: number; options: InvestorOptions; summary: { total: number; engaged: number; meetings: number; followups: number; rate: number; statuses: { _id: string; count: number }[]; waves: { _id: string; count: number }[]; activity: { _id: string; count: number }[] }; attention: InvestorView[] };

async function requireInvestorAccess(write = false) {
  const session = await getSession();
  if (!session || !(write ? EDIT_ROLES : VIEW_ROLES).includes(session.role)) throw new Error("Unauthorized");
  await connectDB();
  const user = await User.findById(session.userId).select("isActive role name").lean();
  if (!user?.isActive || user.role !== session.role) throw new Error("Unauthorized");
  return session;
}

const clean = (value: FormDataEntryValue | null, max = 2000) => String(value ?? "").trim().slice(0, max);
const dateOrNull = (value: FormDataEntryValue | null) => {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
  return date;
};
const objectIdOrNull = (value: string) => value && mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const serialize = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export async function getInvestorOptions(): Promise<InvestorOptions> {
  await requireInvestorAccess();
  const [pipeline, statusesInUse, wavesInUse, managers] = await Promise.all([
    InvestorPipeline.findOne({ key: "default" }).lean(),
    Investor.distinct("status"), Investor.distinct("wave"),
    User.find({ isActive: true, role: { $in: ["ops", "superadmin"] } }).select("name role").sort({ name: 1 }).lean(),
  ]);
  return serialize({
    statuses: [...new Set([...(pipeline?.statuses ?? DEFAULT_INVESTOR_STATUSES), ...statusesInUse])],
    waves: [...new Set([...(pipeline?.waves ?? ["First wave", "Second wave", "Impact"]), ...wavesInUse])],
    managers,
  }) as unknown as InvestorOptions;
}

export async function getInvestorDirectory(filters: Filters = {}): Promise<InvestorDirectoryData> {
  await requireInvestorAccess();
  const options = await getInvestorOptions();
  const q = (filters.q ?? "").trim().slice(0, 100);
  const query: Record<string, unknown> = {};
  if (q) query.name = { $regex: escapeRegex(q), $options: "i" };
  if (filters.status && filters.status !== "all") query.status = filters.status;
  if (filters.wave && filters.wave !== "all") query.wave = filters.wave;
  if (filters.priority && filters.priority !== "all" && ["Low", "Medium", "High"].includes(filters.priority)) query.priority = filters.priority;
  if (filters.manager && mongoose.isValidObjectId(filters.manager)) query.manager = new mongoose.Types.ObjectId(filters.manager);
  const requestedPage = Number.parseInt(filters.page ?? "1", 10);
  const [total, summaryRows, waveRows, activityRows] = await Promise.all([
    Investor.countDocuments(query),
    Investor.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Investor.aggregate([{ $group: { _id: "$wave", count: { $sum: 1 } } }]),
    Investor.aggregate([{ $unwind: "$events" }, { $match: { "events.at": { $gte: new Date(Date.now() - 30 * 86400000) } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$events.at" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1), pageCount);
  const now = new Date();
  const [investors, attention] = await Promise.all([
    filters.sort === "followup"
      ? Investor.aggregate([
          { $match: query },
          { $addFields: { followUpSort: { $ifNull: ["$nextFollowUp", new Date("9999-12-31T00:00:00.000Z")] } } },
          { $sort: { followUpSort: 1, _id: 1 } },
          { $skip: (page - 1) * PAGE_SIZE }, { $limit: PAGE_SIZE },
          { $lookup: { from: "users", localField: "manager", foreignField: "_id", as: "managerRecord" } },
          { $project: { name: 1, organization: 1, wave: 1, status: 1, priority: 1, manager: { $arrayElemAt: ["$managerRecord", 0] }, lastContacted: 1, nextFollowUp: 1, updatedAt: 1, events: { $slice: ["$events", -1] } } },
        ])
      : Investor.find(query).select({ name: 1, organization: 1, wave: 1, status: 1, priority: 1, manager: 1, lastContacted: 1, nextFollowUp: 1, updatedAt: 1, events: { $slice: -1 } }).populate("manager", "name").sort("-updatedAt -_id").skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    Investor.find({ $or: [
      { nextFollowUp: { $lt: now, $ne: null } },
      { priority: "High" },
      { status: "Meeting scheduled" },
      { updatedAt: { $lt: new Date(Date.now() - 30 * 86400000) } },
    ] }).select("name status priority nextFollowUp updatedAt").sort({ nextFollowUp: 1, updatedAt: 1 }).limit(12).lean(),
  ]);
  const all = summaryRows.reduce((n, row) => n + row.count, 0);
  const engaged = all - (summaryRows.find((row) => row._id === "Not contacted")?.count ?? 0);
  return serialize({ investors, total, page, pageCount, pageSize: PAGE_SIZE, options,
    summary: { total: all, engaged, meetings: summaryRows.find((row) => row._id === "Meeting scheduled")?.count ?? 0, followups: summaryRows.find((row) => row._id === "Follow-up required")?.count ?? 0, rate: all ? Math.round((engaged / all) * 100) : 0, statuses: options.statuses.map((status) => ({ _id: status, count: summaryRows.find((row) => row._id === status)?.count ?? 0 })), waves: options.waves.map((wave) => ({ _id: wave, count: waveRows.find((row) => row._id === wave)?.count ?? 0 })), activity: activityRows },
    attention,
  }) as unknown as InvestorDirectoryData;
}

export async function getInvestor(id: string): Promise<InvestorView | null> {
  await requireInvestorAccess();
  if (!mongoose.isValidObjectId(id)) return null;
  const investor = await Investor.findById(id).populate("manager", "name email").lean();
  return investor ? serialize(investor) as unknown as InvestorView : null;
}

export async function createInvestor(_previous: Result | undefined, form: FormData): Promise<Result> {
  try {
    const session = await requireInvestorAccess(true);
    const options = await getInvestorOptions();
    const name = clean(form.get("name"), 160), wave = clean(form.get("wave"), 100), status = clean(form.get("status"), 100);
    const priority = clean(form.get("priority"), 10);
    if (!name || !options.waves.includes(wave) || !options.statuses.includes(status) || !["Low", "Medium", "High"].includes(priority)) return { success: false, message: "Check the investor name, wave, status and priority." };
    const manager = objectIdOrNull(clean(form.get("manager"), 30));
    if (manager && !options.managers.some((user) => String(user._id) === String(manager))) return { success: false, message: "Invalid relationship manager." };
    const now = new Date();
    const investor = await Investor.create({ name, wave, status, priority, manager,
      organization: clean(form.get("organization"), 160), contactEmail: clean(form.get("contactEmail"), 200), contactPhone: clean(form.get("contactPhone"), 80), investmentFocus: clean(form.get("investmentFocus")), notes: clean(form.get("notes")), nextAction: clean(form.get("nextAction")), nextFollowUp: dateOrNull(form.get("nextFollowUp")), lastContacted: dateOrNull(form.get("lastContacted")),
      lastUpdatedBy: session.userId, lastUpdatedByName: session.name,
      events: [{ kind: "created", at: now, actor: session.userId, actorName: session.name, newStatus: status, remarks: "Investor added" }],
    });
    revalidatePath("/dashboard/ceo"); revalidatePath("/dashboard/ops");
    return { success: true, message: "Investor added.", id: String(investor._id) };
  } catch (error) { console.error("[createInvestor]", error); return { success: false, message: "Could not add investor." }; }
}

export async function updateInvestor(_previous: Result | undefined, form: FormData): Promise<Result> {
  try {
    const session = await requireInvestorAccess(true);
    const id = clean(form.get("id"), 30);
    if (!mongoose.isValidObjectId(id)) return { success: false, message: "Invalid investor." };
    const options = await getInvestorOptions();
    const name = clean(form.get("name"), 160), wave = clean(form.get("wave"), 100), priority = clean(form.get("priority"), 10);
    if (!name || !options.waves.includes(wave) || !["Low", "Medium", "High"].includes(priority)) return { success: false, message: "Check the investor name, wave and priority." };
    const manager = objectIdOrNull(clean(form.get("manager"), 30));
    if (manager && !options.managers.some((user) => String(user._id) === String(manager))) return { success: false, message: "Invalid relationship manager." };
    const updated = await Investor.findByIdAndUpdate(id, { $set: { name, wave, priority, manager,
      organization: clean(form.get("organization"), 160), contactEmail: clean(form.get("contactEmail"), 200), contactPhone: clean(form.get("contactPhone"), 80), investmentFocus: clean(form.get("investmentFocus")), notes: clean(form.get("notes")), nextAction: clean(form.get("nextAction")), nextFollowUp: dateOrNull(form.get("nextFollowUp")), lastContacted: dateOrNull(form.get("lastContacted")), lastUpdatedBy: session.userId, lastUpdatedByName: session.name },
      $push: { events: { kind: "note", at: new Date(), actor: session.userId, actorName: session.name, remarks: "Investor profile updated" } },
    }, { runValidators: true });
    if (!updated) return { success: false, message: "Investor not found." };
    revalidatePath("/dashboard/ceo"); revalidatePath("/dashboard/ops"); revalidatePath(`/dashboard/investors/${id}`);
    return { success: true, message: "Investor updated.", id };
  } catch (error) { console.error("[updateInvestor]", error); return { success: false, message: "Could not update investor." }; }
}

export async function changeInvestorStatus(id: string, status: string, remarks = ""): Promise<Result> {
  try {
    const session = await requireInvestorAccess(true);
    if (!mongoose.isValidObjectId(id)) return { success: false, message: "Invalid investor." };
    const options = await getInvestorOptions();
    if (!options.statuses.includes(status)) return { success: false, message: "Invalid status." };
    const existing = await Investor.findById(id).select("status").lean();
    if (!existing) return { success: false, message: "Investor not found." };
    if (existing.status === status) return { success: true, message: "Status unchanged." };
    const updated = await Investor.findOneAndUpdate({ _id: id, status: existing.status }, { $set: { status, lastUpdatedBy: session.userId, lastUpdatedByName: session.name }, $push: { events: { kind: "status", at: new Date(), actor: session.userId, actorName: session.name, previousStatus: existing.status, newStatus: status, remarks: remarks.trim().slice(0, 1000) } } }, { runValidators: true });
    if (!updated) return { success: false, message: "Status changed meanwhile. Refresh and try again." };
    revalidatePath("/dashboard/ceo"); revalidatePath("/dashboard/ops"); revalidatePath(`/dashboard/investors/${id}`);
    return { success: true, message: "Status updated." };
  } catch (error) { console.error("[changeInvestorStatus]", error); return { success: false, message: "Could not update status." }; }
}

export async function addInvestorActivity(_previous: Result | undefined, form: FormData): Promise<Result> {
  try {
    const session = await requireInvestorAccess(true);
    const id = clean(form.get("id"), 30), kind = clean(form.get("kind"), 30);
    const allowed = ["call", "correspondence", "meeting", "follow-up", "note", "opportunity"];
    const remarks = clean(form.get("remarks"));
    if (!mongoose.isValidObjectId(id) || !allowed.includes(kind) || !remarks) return { success: false, message: "Select an activity and enter details." };
    const when = dateOrNull(form.get("scheduledFor"));
    const meetingStage = kind === "meeting" ? clean(form.get("meetingStage"), 20) : undefined;
    if (kind === "meeting" && !["scheduled", "completed"].includes(meetingStage ?? "")) return { success: false, message: "Select whether the meeting was scheduled or completed." };
    const update: Record<string, unknown> = { lastUpdatedBy: session.userId, lastUpdatedByName: session.name };
    if (kind === "call" || kind === "correspondence") update.lastContacted = new Date();
    if (kind === "follow-up") update.nextFollowUp = when;
    const investor = await Investor.findByIdAndUpdate(id, { $set: update, $push: { events: { kind, at: new Date(), actor: session.userId, actorName: session.name, remarks, outcome: clean(form.get("outcome")), scheduledFor: when, meetingStage } } }, { runValidators: true });
    if (!investor) return { success: false, message: "Investor not found." };
    revalidatePath("/dashboard/ceo"); revalidatePath("/dashboard/ops"); revalidatePath(`/dashboard/investors/${id}`);
    return { success: true, message: "Activity recorded." };
  } catch (error) { console.error("[addInvestorActivity]", error); return { success: false, message: "Could not record activity." }; }
}

export async function configureInvestorPipeline(_previous: Result | undefined, form: FormData): Promise<Result> {
  try {
    const session = await requireInvestorAccess();
    if (session.role !== "superadmin") return { success: false, message: "Unauthorized." };
    const statuses = clean(form.get("statuses"), 3000).split("\n").map((s) => s.trim()).filter(Boolean);
    const waves = clean(form.get("waves"), 3000).split("\n").map((s) => s.trim()).filter(Boolean);
    if (!statuses.length || !waves.length || statuses.some((s) => s.length > 100) || waves.some((s) => s.length > 100)) return { success: false, message: "Enter valid statuses and waves." };
    await InvestorPipeline.findOneAndUpdate({ key: "default" }, { $set: { statuses: [...new Set(statuses)], waves: [...new Set(waves)] } }, { upsert: true, runValidators: true });
    revalidatePath("/dashboard/ceo"); revalidatePath("/dashboard/ops");
    return { success: true, message: "Pipeline updated." };
  } catch (error) { console.error("[configureInvestorPipeline]", error); return { success: false, message: "Could not update pipeline." }; }
}
