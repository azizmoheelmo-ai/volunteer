import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { Response } from "express";

type RosterRow = {
  studentName: string;
  studentNumber: string | null;
  grade: string | null;
  skills: string | null;
  applicationStatus: string;
  present: boolean | null;
  hoursCredited: number | null;
};

type RosterOpportunity = {
  title: string;
  field: string;
  startAt: Date;
  endAt: Date;
  hours: number;
};

const STATUS_LABELS_AR: Record<string, string> = {
  PENDING: "قيد المراجعة",
  ACCEPTED: "مقبول",
  REJECTED: "مرفوض",
};

/** Builds an .xlsx workbook formatted for handover to the national volunteering platform / MoE. */
export async function buildOpportunityRosterWorkbook(
  opportunity: RosterOpportunity,
  rows: RosterRow[],
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "بيان - التطوع المدرسي الذكي";
  const sheet = workbook.addWorksheet("كشف المتطوعين", { views: [{ rightToLeft: true }] });

  sheet.columns = [
    { header: "اسم الطالب", key: "studentName", width: 28 },
    { header: "رقم الطالب", key: "studentNumber", width: 16 },
    { header: "الصف", key: "grade", width: 12 },
    { header: "المهارات", key: "skills", width: 24 },
    { header: "حالة الطلب", key: "applicationStatus", width: 14 },
    { header: "الحضور", key: "present", width: 10 },
    { header: "الساعات المعتمدة", key: "hoursCredited", width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow({
      studentName: row.studentName,
      studentNumber: row.studentNumber ?? "-",
      grade: row.grade ?? "-",
      skills: row.skills ?? "-",
      applicationStatus: STATUS_LABELS_AR[row.applicationStatus] ?? row.applicationStatus,
      present: row.present === null ? "-" : row.present ? "حاضر" : "غائب",
      hoursCredited: row.hoursCredited ?? "-",
    });
  }

  const infoSheet = workbook.addWorksheet("بيانات المبادرة", { views: [{ rightToLeft: true }] });
  infoSheet.columns = [
    { header: "الحقل", key: "label", width: 20 },
    { header: "القيمة", key: "value", width: 40 },
  ];
  infoSheet.getRow(1).font = { bold: true };
  infoSheet.addRows([
    { label: "اسم المبادرة", value: opportunity.title },
    { label: "المجال", value: opportunity.field },
    { label: "تاريخ البداية", value: opportunity.startAt.toISOString() },
    { label: "تاريخ النهاية", value: opportunity.endAt.toISOString() },
    { label: "عدد الساعات لكل متطوع", value: opportunity.hours },
  ]);

  return workbook;
}

export function streamOpportunityRosterPdf(res: Response, opportunity: RosterOpportunity, rows: RosterRow[]) {
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(18).text(`كشف المتطوعين - ${opportunity.title}`, { align: "right" });
  doc.moveDown(0.5);
  doc.fontSize(11).text(`المجال: ${opportunity.field}`, { align: "right" });
  doc.text(`عدد الساعات لكل متطوع: ${opportunity.hours}`, { align: "right" });
  doc.text(
    `الفترة: ${opportunity.startAt.toLocaleDateString("ar-SA")} - ${opportunity.endAt.toLocaleDateString("ar-SA")}`,
    { align: "right" },
  );
  doc.moveDown();

  rows.forEach((row, index) => {
    const status = STATUS_LABELS_AR[row.applicationStatus] ?? row.applicationStatus;
    const attendance = row.present === null ? "-" : row.present ? "حاضر" : "غائب";
    doc
      .fontSize(10)
      .text(
        `${index + 1}. ${row.studentName} | ${row.studentNumber ?? "-"} | ${row.grade ?? "-"} | ${status} | ${attendance} | ${
          row.hoursCredited ?? "-"
        } ساعة`,
        { align: "right" },
      );
  });

  doc.end();
}

export function streamStudentCertificatePdf(
  res: Response,
  student: { name: string; studentNumber: string | null; grade: string | null },
  totalHours: number,
  history: { opportunityTitle: string; hours: number; approvedAt: Date }[],
) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text("شهادة سجل التطوع المدرسي", { align: "center" });
  doc.moveDown();
  doc.fontSize(13).text(`تُمنح هذه الشهادة للطالب/ة: ${student.name}`, { align: "right" });
  if (student.studentNumber) doc.text(`رقم الطالب: ${student.studentNumber}`, { align: "right" });
  if (student.grade) doc.text(`الصف: ${student.grade}`, { align: "right" });
  doc.moveDown();
  doc.fontSize(15).text(`إجمالي الساعات التطوعية المعتمدة: ${totalHours} ساعة`, { align: "right" });
  doc.moveDown();

  doc.fontSize(13).text("سجل المبادرات:", { align: "right" });
  doc.moveDown(0.5);
  history.forEach((h, index) => {
    doc
      .fontSize(11)
      .text(`${index + 1}. ${h.opportunityTitle} — ${h.hours} ساعة — ${h.approvedAt.toLocaleDateString("ar-SA")}`, {
        align: "right",
      });
  });

  doc.moveDown(2);
  doc.fontSize(10).fillColor("gray").text("صادرة آلياً عبر منصة بيان - التطوع المدرسي الذكي", { align: "center" });

  doc.end();
}
