import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { notify } from "../services/notifications.service.js";

const markSchema = z.object({ present: z.boolean() });
const bulkMarkSchema = z.object({
  entries: z.array(z.object({ attendanceId: z.string(), present: z.boolean() })),
});
const approveHoursSchema = z.object({ note: z.string().optional() });

async function assertOwnerOrAdmin(req: Request, opportunityId: string) {
  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) throw new AppError("الفرصة التطوعية غير موجودة", 404);
  if (req.auth!.role !== "ADMIN" && opportunity.createdById !== req.auth!.userId) {
    throw new AppError("لا تملك صلاحية إدارة هذه الفرصة", 403);
  }
  return opportunity;
}

/** Digital attendance roster: one row per accepted (and therefore trackable) applicant. */
export async function listAttendance(req: Request, res: Response) {
  const opportunityId = req.params.opportunityId;
  const attendance = await prisma.attendance.findMany({
    where: { opportunityId },
    include: { student: { select: { id: true, name: true, studentNumber: true, grade: true } } },
    orderBy: { student: { name: "asc" } },
  });
  res.json({ attendance });
}

export async function markAttendance(req: Request, res: Response) {
  await assertOwnerOrAdmin(req, req.params.opportunityId);
  const data = markSchema.parse(req.body);

  const attendance = await prisma.attendance.update({
    where: { id: req.params.attendanceId },
    data: { present: data.present, markedAt: new Date(), markedById: req.auth!.userId },
  });

  res.json({ attendance });
}

export async function bulkMarkAttendance(req: Request, res: Response) {
  await assertOwnerOrAdmin(req, req.params.opportunityId);
  const data = bulkMarkSchema.parse(req.body);

  await prisma.$transaction(
    data.entries.map((entry) =>
      prisma.attendance.update({
        where: { id: entry.attendanceId },
        data: { present: entry.present, markedAt: new Date(), markedById: req.auth!.userId },
      }),
    ),
  );

  res.json({ ok: true });
}

/** "اعتماد ورصد الساعات": credits volunteering hours to every present student's digital wallet. */
export async function approveHours(req: Request, res: Response) {
  const opportunityId = req.params.opportunityId;
  const opportunity = await assertOwnerOrAdmin(req, opportunityId);
  const data = approveHoursSchema.parse(req.body);

  const presentAttendance = await prisma.attendance.findMany({
    where: { opportunityId, present: true },
  });
  if (presentAttendance.length === 0) {
    throw new AppError("لا يوجد طلاب مسجل حضورهم لاعتماد ساعاتهم", 409);
  }

  const alreadyCredited = await prisma.hoursCredit.findMany({
    where: { opportunityId },
    select: { studentId: true },
  });
  const alreadyCreditedIds = new Set(alreadyCredited.map((c) => c.studentId));
  const toCredit = presentAttendance.filter((a) => !alreadyCreditedIds.has(a.studentId));

  if (toCredit.length === 0) {
    throw new AppError("تم اعتماد ساعات هذه الفرصة مسبقاً لجميع الحاضرين", 409);
  }

  await prisma.$transaction(
    toCredit.map((a) =>
      prisma.hoursCredit.create({
        data: {
          opportunityId,
          studentId: a.studentId,
          hours: opportunity.hours,
          note: data.note,
          approvedById: req.auth!.userId,
        },
      }),
    ),
  );

  await prisma.opportunity.update({ where: { id: opportunityId }, data: { status: "COMPLETED" } });

  await Promise.all(
    toCredit.map((a) =>
      notify({
        userId: a.studentId,
        title: "تم اعتماد ساعات تطوعية",
        message: `تم اعتماد ${opportunity.hours} ساعة تطوعية لمبادرة "${opportunity.title}" في محفظتك الرقمية`,
        type: "HOURS_APPROVED",
        relatedOpportunityId: opportunityId,
      }),
    ),
  );

  res.json({ creditedCount: toCredit.length, hoursEach: opportunity.hours });
}
