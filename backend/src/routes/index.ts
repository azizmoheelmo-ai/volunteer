import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { opportunitiesRouter } from "./opportunities.routes.js";
import { applicationDecisionsRouter } from "./applications.routes.js";
import { studentsRouter } from "./students.routes.js";
import { reportsRouter } from "./reports.routes.js";
import { publicRouter } from "./public.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/opportunities", opportunitiesRouter);
apiRouter.use("/applications", applicationDecisionsRouter);
apiRouter.use("/students", studentsRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/public", publicRouter);
