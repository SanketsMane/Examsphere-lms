import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { generateCertificatePDF } from "@/lib/certificates/certificate-service";

export const dynamic = "force-dynamic";

/**
 * Certificate Download API (PDF)
 * Author: Sanket
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSessionWithRole();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        // Fetch certificate and verify ownership
        const certificate = await prisma.certificate.findUnique({
            where: { id }
        });

        if (!certificate) {
            return new NextResponse("Certificate not found", { status: 404 });
        }

        // Verify ownership
        if (certificate.userId !== session.user.id) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Generate PDF
        const pdfBuffer = await generateCertificatePDF({
            studentName: certificate.studentName,
            courseName: certificate.courseName,
            completedAt: certificate.completionDate,
            certificateId: certificate.certificateNumber
        });

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="certificate-${certificate.id}.pdf"`,
            },
        });

    } catch (error) {
        console.error("Certificate download error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
