import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireRole } from "../middleware/auth.js";
import * as attendanceController from "../controllers/attendance.controller.js";

// Nested under /api/opportunities/:opportunityId/attendance
export const attendanceRouter = Router({ mergeParams: true });

attendanceRouter.use(requireRole("TEACHER", "ADMIN"));
attendanceRouter.get("/", asyncHandler(attendanceController.listAttendance));
attendanceRouter.patch("/bulk", asyncHandler(attendanceController.bulkMarkAttendance));
attendanceRouter.patch("/:attendanceId", asyncHandler(attendanceController.markAttendance));
attendanceRouter.post("/approve-hours", asyncHandler(attendanceController.approveHours));
