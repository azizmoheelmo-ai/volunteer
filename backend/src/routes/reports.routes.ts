import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as reportsController from "../controllers/reports.controller.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

reportsRouter.get(
  "/opportunities/:id/roster.xlsx",
  requireRole("TEACHER", "ADMIN"),
  asyncHandler(reportsController.exportOpportunityRosterXlsx),
);
reportsRouter.get(
  "/opportunities/:id/roster.pdf",
  requireRole("TEACHER", "ADMIN"),
  asyncHandler(reportsController.exportOpportunityRosterPdf),
);
reportsRouter.get("/students/me/certificate.pdf", asyncHandler(reportsController.exportStudentCertificatePdf));
reportsRouter.get(
  "/students/:studentId/certificate.pdf",
  requireRole("TEACHER", "ADMIN"),
  asyncHandler(reportsController.exportStudentCertificatePdf),
);
