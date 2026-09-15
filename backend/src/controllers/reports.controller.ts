import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  buildOpportunityRosterWorkbook,
  streamOpportunityRosterPdf,
  streamStudentCertificatePdf,
} from "../services/export.service.js";

async function loadRoster(opportunityId: string, requesterId: string, requesterRole: string) {
  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) throw new AppError("الفرصة التطوعية غير موجودة", 404);
  if (requesterRole !== "ADMIN" && opportunity.createdById !== requesterId) {
    throw new AppError("لا تملك صلاحية تصدير بيانات هذه الفرصة", 403);
  }

  const applications = await prisma.application.findMany({
    where: { opportunityId },
    include: { student: true, attendance: true },
  });
  const credits = await prisma.hoursCredit.findMany({ where: { opportunityId } });
  const creditByStudent = new Map(credits.map((c) => [c.studentId, c.hours]));

  const rows = applications.map((a) => ({
    studentName: a.student.name,
    studentNumber: a.student.studentNumber,
    grade: a.student.grade,
    skills: a.skills,
    applicationStatus: a.status,
    present: a.attendance?.present ?? null,
    hoursCredited: creditByStudent.get(a.studentId) ?? null,
  }));

  return { opportunity, rows };
}

export async function exportOpportunityRosterXlsx(req: Request, res: Response) {
  const { opportunity, rows } = await loadRoster(req.params.id, req.auth!.userId, req.auth!.role);
  const workbook = await buildOpportunityRosterWorkbook(opportunity, rows);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="roster-${opportunity.id}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}

export async function exportOpportunityRosterPdf(req: Request, res: Response) {
  const { opportunity, rows } = await loadRoster(req.params.id, req.auth!.userId, req.auth!.role);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="roster-${opportunity.id}.pdf"`);
  streamOpportunityRosterPdf(res, opportunity, rows);
}

async function loadCertificateData(studentId: string) {
  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student) throw new AppError("الطالب غير موجود", 404);

  const credits = await prisma.hoursCredit.findMany({
    where: { studentId },
    include: { opportunity: { select: { title: true } } },
    orderBy: { approvedAt: "desc" },
  });

  const totalHours = credits.reduce((sum, c) => sum + c.hours, 0);
  const history = credits.map((c) => ({ opportunityTitle: c.opportunity.title, hours: c.hours, approvedAt: c.approvedAt }));
  return { student, totalHours, history };
}

export async function exportStudentCertificatePdf(req: Request, res: Response) {
  const studentId = req.params.studentId ?? req.auth!.userId;
  if (req.auth!.role === "STUDENT" && studentId !== req.auth!.userId) {
    throw new AppError("لا تملك صلاحية عرض بيانات طالب آخر", 403);
  }
  const { student, totalHours, history } = await loadCertificateData(studentId);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="volunteering-certificate-${student.id}.pdf"`);
  streamStudentCertificatePdf(res, student, totalHours, history);
}
