import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { toPublicUser } from "./auth.controller.js";

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  grade: z.string().optional(),
  studentNumber: z.string().optional(),
  phone: z.string().optional(),
});

export async function listUsers(req: Request, res: Response) {
  const { role } = req.query as { role?: string };
  const users = await prisma.user.findMany({
    // The owner account never appears in this list, for anyone, under any filter.
    where: { isOwner: false, ...(role ? { role } : {}) },
    orderBy: { createdAt: "desc" },
  });
  res.json({ users: users.map(toPublicUser) });
}

export async function updateUser(req: Request, res: Response) {
  const data = updateUserSchema.parse(req.body);
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target || target.isOwner) throw new AppError("المستخدم غير موجود", 404);

  const user = await prisma.user.update({ where: { id: req.params.id }, data });
  res.json({ user: toPublicUser(user) });
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  if (id === req.auth!.userId) {
    throw new AppError("لا يمكنك حذف حسابك الخاص", 400);
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.isOwner) throw new AppError("المستخدم غير موجود", 404);

  if (target.role === "TEACHER" || target.role === "ADMIN") {
    const [opportunities, decisions, attendanceMarks, hoursApproved] = await Promise.all([
      prisma.opportunity.count({ where: { createdById: id } }),
      prisma.application.count({ where: { decidedById: id } }),
      prisma.attendance.count({ where: { markedById: id } }),
      prisma.hoursCredit.count({ where: { approvedById: id } }),
    ]);
    if (opportunities + decisions + attendanceMarks + hoursApproved > 0) {
      throw new AppError("لا يمكن حذف هذا الحساب لأنه مرتبط بفرص أو إجراءات سابقة في النظام", 409);
    }
  }

  // Student-owned records (applications/attendance/hours/notifications) cascade via the schema.
  await prisma.user.delete({ where: { id } });
  res.status(204).send();
}
