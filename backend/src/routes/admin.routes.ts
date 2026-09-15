import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as adminController from "../controllers/admin.controller.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/users", asyncHandler(adminController.listUsers));
adminRouter.patch("/users/:id", asyncHandler(adminController.updateUser));
adminRouter.delete("/users/:id", asyncHandler(adminController.deleteUser));
