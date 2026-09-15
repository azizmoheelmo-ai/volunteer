import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@bayan.edu.sa" },
    update: {},
    create: {
      name: "أ. منى العتيبي",
      email: "teacher@bayan.edu.sa",
      passwordHash: password,
      role: "TEACHER",
    },
  });

  const students = await Promise.all(
    [
      { name: "سارة أحمد", email: "sara@bayan.edu.sa", studentNumber: "1001", grade: "2-1" },
      { name: "نورة خالد", email: "noura@bayan.edu.sa", studentNumber: "1002", grade: "2-1" },
      { name: "ريم سالم", email: "reem@bayan.edu.sa", studentNumber: "1003", grade: "2-2" },
    ].map((s) =>
      prisma.user.upsert({
        where: { email: s.email },
        update: {},
        create: { ...s, passwordHash: password, role: "STUDENT" },
      }),
    ),
  );

  const opportunity = await prisma.opportunity.upsert({
    where: { uniqueSlug: "demo-tatawwu-1" },
    update: {},
    create: {
      title: "حملة تشجير المدرسة",
      description: "مبادرة بيئية لزراعة الأشجار وتجميل ساحة المدرسة بمشاركة الطالبات",
      field: "بيئي",
      startAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      hours: 3,
      maxVolunteers: 20,
      targetGrades: "2-1,2-2",
      status: "PUBLISHED",
      uniqueSlug: "demo-tatawwu-1",
      createdById: teacher.id,
    },
  });

  console.log("Seeded:", { teacher: teacher.email, students: students.map((s) => s.email), opportunity: opportunity.title });
  console.log("Default password for all demo accounts: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
