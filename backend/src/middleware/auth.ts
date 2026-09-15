import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler.js";
import { verifyToken } from "../utils/jwt.js";
import type { Role } from "../constants.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError("يجب تسجيل الدخول للوصول إلى هذا المورد", 401);
  }
  try {
    req.auth = verifyToken(header.slice("Bearer ".length));
  } catch {
    throw new AppError("جلسة الدخول غير صالحة أو منتهية", 401);
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role as Role)) {
      throw new AppError("لا تملك الصلاحية للقيام بهذا الإجراء", 403);
    }
    next();
  };
}
