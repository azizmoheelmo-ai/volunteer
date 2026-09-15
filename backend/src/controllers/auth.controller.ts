import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { AppError } from "../middleware/errorHandler.js";

// Public self-registration is for students only — teacher/admin accounts are
// provisioned separately (seed data or the admin panel), never by request body.
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  studentNumber: z.string().optional(),
  grade: z.string().min(1),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  studentNumber: string | null;
  grade: string | null;
  phone: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    studentNumber: user.studentNumber,
    grade: user.grade,
    phone: user.phone,
  };
}

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError("البريد الإلكتروني مستخدم مسبقاً", 409);
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      role: "STUDENT",
      studentNumber: data.studentNumber,
      grade: data.grade,
      phone: data.phone,
    },
  });

  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({ token, user: toPublicUser(user) });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !(await comparePassword(data.password, user.passwordHash))) {
    throw new AppError("البريد الإلكتروني أو كلمة المرور غير صحيحة", 401);
  }

  const token = signToken({ userId: user.id, role: user.role });
  res.json({ token, user: toPublicUser(user) });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth!.userId } });
  res.json({ user: toPublicUser(user) });
}
