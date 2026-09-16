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

const updateMeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newEmail: z.string().email().optional(),
    newPassword: z.string().min(6).optional(),
  })
  .refine((d) => d.newEmail || d.newPassword, {
    message: "يجب إدخال بريد إلكتروني جديد أو كلمة مرور جديدة",
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

export async function updateMe(req: Request, res: Response) {
  const data = updateMeSchema.parse(req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth!.userId } });

  if (!(await comparePassword(data.currentPassword, user.passwordHash))) {
    throw new AppError("كلمة المرور الحالية غير صحيحة", 401);
  }

  if (data.newEmail && data.newEmail !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.newEmail } });
    if (existing) throw new AppError("البريد الإلكتروني مستخدم مسبقاً", 409);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      email: data.newEmail,
      passwordHash: data.newPassword ? await hashPassword(data.newPassword) : undefined,
    },
  });

  res.json({ user: toPublicUser(updated) });
}
