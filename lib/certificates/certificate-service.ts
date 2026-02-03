import { jsPDF } from "jspdf";
import { format } from "date-fns";

/**
 * Server-side Certificate Generation Service
 * Author: Sanket
 */

export async function generateCertificatePDF(data: {
    studentName: string;
    courseName: string;
    completedAt: Date;
    certificateId: string;
}) {
    // Create landscape A4 document
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
    });

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // 1. Draw Border
    doc.setDrawColor(20, 184, 166); // primary teal
    doc.setLineWidth(20);
    doc.rect(10, 10, width - 20, height - 20, 'S');

    doc.setDrawColor(20, 184, 166);
    doc.setLineWidth(2);
    doc.rect(20, 20, width - 40, height - 40, 'S');

    // 2. Kidokool Header
    doc.setTextColor(20, 184, 166);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.text("KIDOKOOL LMS", width / 2, 100, { align: "center" });

    // Decorative line
    doc.setDrawColor(20, 184, 166);
    doc.setLineWidth(2);
    doc.line(width / 2 - 40, 110, width / 2 + 40, 110);

    // 3. Title
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFontSize(45);
    doc.text("CERTIFICATE OF COMPLETION", width / 2, 180, { align: "center" });

    // 4. Content
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont("helvetica", "italic");
    doc.setFontSize(22);
    doc.text("This is to certify that", width / 2, 230, { align: "center" });

    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.setFontSize(35);
    doc.text(data.studentName.toUpperCase(), width / 2, 290, { align: "center" });

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(18);
    doc.text("has successfully completed the course", width / 2, 330, { align: "center" });

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text(data.courseName, width / 2, 370, { align: "center" });

    // 5. Footer Details
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFontSize(12);
    doc.text("CERTIFICATE ID", 80, height - 80);
    doc.text("ISSUE DATE", width - 80, height - 80, { align: "right" });

    doc.setTextColor(71, 85, 105); // slate-600
    doc.setFontSize(14);
    doc.setFont("courier", "normal");
    doc.text(data.certificateId, 80, height - 60);

    doc.setFont("helvetica", "bold");
    doc.text(format(data.completedAt, "MMMM dd, yyyy"), width - 80, height - 60, { align: "right" });

    // 6. Return as ArrayBuffer
    return doc.output("arraybuffer");
}
