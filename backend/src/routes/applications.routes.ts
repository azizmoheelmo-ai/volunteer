import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as applicationsController from "../controllers/applications.controller.js";

// Nested under /api/opportunities/:opportunityId/applications
export const applicationsRouter = Router({ mergeParams: true });

applicationsRouter.post("/", requireRole("STUDENT"), asyncHandler(applicationsController.apply));
applicationsRouter.get("/", requireRole("TEACHER", "ADMIN"), asyncHandler(applicationsController.listApplications));

// Top-level: /api/applications/:applicationId/decision
export const applicationDecisionsRouter = Router();

applicationDecisionsRouter.use(requireAuth);
applicationDecisionsRouter.patch(
  "/:applicationId/decision",
  requireRole("TEACHER", "ADMIN"),
  asyncHandler(applicationsController.decideApplication),
);
