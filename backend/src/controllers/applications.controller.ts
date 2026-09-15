import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { notify } from "../services/notifications.service.js";

const applySchema = z.object({
  skills: z.string().optional(),
});

const decideSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export async function apply(req: Request, res: Response) {
  const opportunityId = req.params.opportunityId;
  const data = applySchema.parse(req.body);

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { _count: { select: { applications: { where: { status: { not: "REJECTED" } } } } } },
  });
  if (!opportunity) throw new AppError("الفرصة التطوعية غير موجودة", 404);
  if (opportunity.status !== "PUBLISHED") throw new AppError("هذه الفرصة غير متاحة للتقديم حالياً", 409);
  if (opportunity._count.applications >= opportunity.maxVolunteers) {
    throw new AppError("اكتمل العدد المطلوب من المتطوعين لهذه الفرصة", 409);
  }

  const existing = await prisma.application.findUnique({
    where: { opportunityId_studentId: { opportunityId, studentId: req.auth!.userId } },
  });
  if (existing) throw new AppError("لقد تقدمت لهذه الفرصة مسبقاً", 409);

  const application = await prisma.application.create({
    data: { opportunityId, studentId: req.auth!.userId, skills: data.skills },
  });

  res.status(201).json({ application });
}

export async function listApplications(req: Request, res: Response) {
  const opportunityId = req.params.opportunityId;
  const { grade, status, skills } = req.query as { grade?: string; status?: string; skills?: string };

  const applications = await prisma.application.findMany({
    where: {
      opportunityId,
      status: status || undefined,
      student: {
        grade: grade || undefined,
      },
      ...(skills ? { skills: { contains: skills } } : {}),
    },
    include: {
      student: { select: { id: true, name: true, studentNumber: true, grade: true, phone: true } },
      attendance: true,
    },
    orderBy: { appliedAt: "asc" },
  });

  res.json({ applications });
}

export async function decideApplication(req: Request, res: Response) {
  const { applicationId } = req.params;
  const data = decideSchema.parse(req.body);

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { opportunity: true },
  });
  if (!application) throw new AppError("الطلب غير موجود", 404);
  if (req.auth!.role !== "ADMIN" && application.opportunity.createdById !== req.auth!.userId) {
    throw new AppError("لا تملك صلاحية إدارة طلبات هذه الفرصة", 403);
  }
  if (application.status !== "PENDING") throw new AppError("تم البت في هذا الطلب مسبقاً", 409);

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { status: data.status, decidedAt: new Date(), decidedById: req.auth!.userId },
  });

  if (data.status === "ACCEPTED") {
    await prisma.attendance.create({
      data: {
        opportunityId: application.opportunityId,
        studentId: application.studentId,
        applicationId: application.id,
      },
    });
  }

  await notify({
    userId: application.studentId,
    title: data.status === "ACCEPTED" ? "تم قبول طلب التطوع" : "تم رفض طلب التطوع",
    message:
      data.status === "ACCEPTED"
        ? `تم قبولك في مبادرة "${application.opportunity.title}"`
        : `لم يتم قبولك في مبادرة "${application.opportunity.title}"`,
    type: data.status === "ACCEPTED" ? "APPLICATION_ACCEPTED" : "APPLICATION_REJECTED",
    relatedOpportunityId: application.opportunityId,
  });

  res.json({ application: updated });
}

export async function myApplications(req: Request, res: Response) {
  const applications = await prisma.application.findMany({
    where: { studentId: req.auth!.userId },
    include: { opportunity: true, attendance: true },
    orderBy: { appliedAt: "desc" },
  });
  res.json({ applications });
}
