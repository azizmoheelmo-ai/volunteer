import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Keyed by role, not email: the owner may have changed their email via
  // account settings, so an email-keyed upsert would create a stray duplicate
  // admin account instead of finding the real one. We only ever flag isOwner
  // here — never touch an existing admin's email/password.
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const admin = existingAdmin
    ? await prisma.user.update({ where: { id: existingAdmin.id }, data: { isOwner: true } })
    : await prisma.user.create({
        data: {
          name: "مسؤول النظام",
          email: "admin@bayan.edu.sa",
          passwordHash: await bcrypt.hash("password123", 10),
          role: "ADMIN",
          isOwner: true,
        },
      });

  console.log(
    existingAdmin
      ? `Owner flag confirmed on existing admin: ${admin.email}`
      : `Created default admin ${admin.email} / password123 — change this immediately from "حسابي".`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
