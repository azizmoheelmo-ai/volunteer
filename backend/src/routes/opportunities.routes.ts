import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as opportunitiesController from "../controllers/opportunities.controller.js";
import { applicationsRouter } from "./applications.routes.js";
import { attendanceRouter } from "./attendance.routes.js";

export const opportunitiesRouter = Router();

opportunitiesRouter.use(requireAuth);

opportunitiesRouter.get("/student-feed", requireRole("STUDENT"), asyncHandler(opportunitiesController.listStudentFeed));
opportunitiesRouter.get("/", asyncHandler(opportunitiesController.listOpportunities));
opportunitiesRouter.post("/", requireRole("TEACHER", "ADMIN"), asyncHandler(opportunitiesController.createOpportunity));
opportunitiesRouter.get("/:id", asyncHandler(opportunitiesController.getOpportunity));
opportunitiesRouter.patch("/:id", requireRole("TEACHER", "ADMIN"), asyncHandler(opportunitiesController.updateOpportunity));
opportunitiesRouter.delete("/:id", requireRole("TEACHER", "ADMIN"), asyncHandler(opportunitiesController.deleteOpportunity));

// Nested resources scoped to an opportunity
opportunitiesRouter.use("/:opportunityId/applications", applicationsRouter);
opportunitiesRouter.use("/:opportunityId/attendance", attendanceRouter);
