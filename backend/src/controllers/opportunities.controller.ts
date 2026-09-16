import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { generateUniqueSlug } from "../utils/slug.js";
import { generateQrCodeDataUrl } from "../lib/qrcode.js";
import { env } from "../config/env.js";
import { OPPORTUNITY_FIELDS, OPPORTUNITY_STATUSES } from "../constants.js";

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  field: z.enum(OPPORTUNITY_FIELDS),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  hours: z.number().positive(),
  maxVolunteers: z.number().int().positive(),
  targetGrades: z.array(z.string()).optional().default([]),
  status: z.enum(OPPORTUNITY_STATUSES).optional().default("PUBLISHED"),
});

const updateSchema = createSchema.partial();

function shareUrlFor(slug: string) {
  return `${env.publicAppUrl}/public/opportunities/${slug}`;
}

function serialize(opportunity: {
  id: string;
  title: string;
  description: string;
  field: string;
  startAt: Date;
  endAt: Date;
  hours: number;
  maxVolunteers: number;
  targetGrades: string;
  status: string;
  uniqueSlug: string;
  createdById: string;
  createdAt: Date;
  createdBy?: { id: string; name: string };
  _count?: { applications: number };
}) {
  return {
    ...opportunity,
    targetGrades: opportunity.targetGrades ? opportunity.targetGrades.split(",").filter(Boolean) : [],
    shareUrl: shareUrlFor(opportunity.uniqueSlug),
    applicantsCount: opportunity._count?.applications ?? undefined,
  };
}

export async function createOpportunity(req: Request, res: Response) {
  const data = createSchema.parse(req.body);
  if (data.endAt <= data.startAt) {
    throw new AppError("يجب أن يكون تاريخ النهاية بعد تاريخ البداية", 422);
  }

  let uniqueSlug = generateUniqueSlug();
  // Vanishingly unlikely to collide, but guard anyway.
  while (await prisma.opportunity.findUnique({ where: { uniqueSlug } })) {
    uniqueSlug = generateUniqueSlug();
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      title: data.title,
      description: data.description,
      field: data.field,
      startAt: data.startAt,
      endAt: data.endAt,
      hours: data.hours,
      maxVolunteers: data.maxVolunteers,
      targetGrades: data.targetGrades.join(","),
      status: data.status,
      uniqueSlug,
      createdById: req.auth!.userId,
    },
  });

  res.status(201).json({ opportunity: serialize(opportunity) });
}

export async function listOpportunities(req: Request, res: Response) {
  const { mine, status, field } = req.query as { mine?: string; status?: string; field?: string };

  const where: Record<string, unknown> = {};
  if (mine === "true") where.createdById = req.auth!.userId;
  if (status) where.status = status;
  if (field) where.field = field;

  const opportunities = await prisma.opportunity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { id: true, name: true } }, _count: { select: { applications: true } } },
  });

  res.json({ opportunities: opportunities.map(serialize) });
}

/** Published opportunities matching the logged-in student's grade, annotated with their application state. */
export async function listStudentFeed(req: Request, res: Response) {
  const student = await prisma.user.findUniqueOrThrow({ where: { id: req.auth!.userId } });

  const opportunities = await prisma.opportunity.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { startAt: "asc" },
    include: {
      applications: { where: { studentId: student.id } },
      _count: { select: { applications: true } },
    },
  });

  const eligible = opportunities.filter((o) => {
    const grades = o.targetGrades ? o.targetGrades.split(",").filter(Boolean) : [];
    return grades.length === 0 || (student.grade ? grades.includes(student.grade) : false);
  });

  res.json({
    opportunities: eligible.map((o) => ({
      ...serialize(o),
      myApplication: o.applications[0]
        ? { id: o.applications[0].id, status: o.applications[0].status }
        : null,
      spotsLeft: o.maxVolunteers - o._count.applications,
    })),
  });
}

export async function getOpportunity(req: Request, res: Response) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: req.params.id },
    include: { createdBy: { select: { id: true, name: true } }, _count: { select: { applications: true } } },
  });
  if (!opportunity) throw new AppError("الفرصة التطوعية غير موجودة", 404);

  const qrCodeDataUrl = await generateQrCodeDataUrl(shareUrlFor(opportunity.uniqueSlug));
  res.json({ opportunity: { ...serialize(opportunity), qrCodeDataUrl } });
}

async function assertOwnerOrAdmin(req: Request, opportunityId: string) {
  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) throw new AppError("الفرصة التطوعية غير موجودة", 404);
  if (req.auth!.role !== "ADMIN" && opportunity.createdById !== req.auth!.userId) {
    throw new AppError("لا تملك صلاحية إدارة هذه الفرصة", 403);
  }
  return opportunity;
}

export async function updateOpportunity(req: Request, res: Response) {
  await assertOwnerOrAdmin(req, req.params.id);
  const data = updateSchema.parse(req.body);

  const opportunity = await prisma.opportunity.update({
    where: { id: req.params.id },
    data: {
      ...data,
      targetGrades: data.targetGrades ? data.targetGrades.join(",") : undefined,
    },
  });

  res.json({ opportunity: serialize(opportunity) });
}

export async function deleteOpportunity(req: Request, res: Response) {
  await assertOwnerOrAdmin(req, req.params.id);
  await prisma.opportunity.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
