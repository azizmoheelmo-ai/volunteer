import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as publicController from "../controllers/public.controller.js";

export const publicRouter = Router();

publicRouter.get("/opportunities/:slug", asyncHandler(publicController.getPublicOpportunity));
