import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

/** Public, unauthenticated landing view for the shared link / QR code. */
export async function getPublicOpportunity(req: Request, res: Response) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { uniqueSlug: req.params.slug },
    include: { createdBy: { select: { name: true } }, _count: { select: { applications: true } } },
  });
  if (!opportunity || opportunity.status !== "PUBLISHED") {
    throw new AppError("الفرصة التطوعية غير متاحة", 404);
  }

  res.json({
    opportunity: {
      id: opportunity.id,
      title: opportunity.title,
      description: opportunity.description,
      field: opportunity.field,
      startAt: opportunity.startAt,
      endAt: opportunity.endAt,
      hours: opportunity.hours,
      maxVolunteers: opportunity.maxVolunteers,
      targetGrades: opportunity.targetGrades ? opportunity.targetGrades.split(",").filter(Boolean) : [],
      spotsLeft: opportunity.maxVolunteers - opportunity._count.applications,
      organizer: opportunity.createdBy.name,
    },
  });
}
