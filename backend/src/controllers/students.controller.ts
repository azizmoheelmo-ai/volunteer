import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

async function buildWallet(studentId: string) {
  const [student, credits] = await Promise.all([
    prisma.user.findUnique({ where: { id: studentId } }),
    prisma.hoursCredit.findMany({
      where: { studentId },
      include: { opportunity: { select: { id: true, title: true, field: true, startAt: true, endAt: true } } },
      orderBy: { approvedAt: "desc" },
    }),
  ]);
  if (!student) throw new AppError("الطالب غير موجود", 404);

  const totalHours = credits.reduce((sum, c) => sum + c.hours, 0);
  return {
    student: { id: student.id, name: student.name, studentNumber: student.studentNumber, grade: student.grade },
    totalHours,
    initiativesCount: credits.length,
    history: credits,
  };
}

export async function myWallet(req: Request, res: Response) {
  res.json(await buildWallet(req.auth!.userId));
}

export async function studentWallet(req: Request, res: Response) {
  res.json(await buildWallet(req.params.studentId));
}

export async function myNotifications(req: Request, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.auth!.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({ notifications });
}

export async function markNotificationRead(req: Request, res: Response) {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification || notification.userId !== req.auth!.userId) {
    throw new AppError("الإشعار غير موجود", 404);
  }
  await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  res.json({ ok: true });
}
