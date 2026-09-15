import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as studentsController from "../controllers/students.controller.js";
import * as applicationsController from "../controllers/applications.controller.js";

export const studentsRouter = Router();

studentsRouter.use(requireAuth);

studentsRouter.get("/me/wallet", requireRole("STUDENT"), asyncHandler(studentsController.myWallet));
studentsRouter.get("/me/applications", requireRole("STUDENT"), asyncHandler(applicationsController.myApplications));
studentsRouter.get("/me/notifications", asyncHandler(studentsController.myNotifications));
studentsRouter.patch("/me/notifications/:id/read", asyncHandler(studentsController.markNotificationRead));
studentsRouter.get("/:studentId/wallet", requireRole("TEACHER", "ADMIN"), asyncHandler(studentsController.studentWallet));
