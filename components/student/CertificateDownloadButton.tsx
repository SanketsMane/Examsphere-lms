"use client";

import { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileCheck } from "lucide-react";
import { CertificateTemplate } from "./CertificateTemplate";
import { toast } from "sonner";

/**
 * Certificate Download Button Component
 * Author: Sanket
 */

interface CertificateDownloadButtonProps {
    studentName: string;
    courseName: string;
    completedAt: string;
    certificateId: string;
}

export function CertificateDownloadButton({ 
    studentName, 
    courseName, 
    completedAt, 
    certificateId 
}: CertificateDownloadButtonProps) {
    const certificateRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);

    const handleDownload = async () => {
        if (!certificateRef.current) return;
        
        setGenerating(true);
        try {
            const canvas = await html2canvas(certificateRef.current, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                backgroundColor: "#ffffff"
            });
            
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "px",
                format: [canvas.width / 2, canvas.height / 2]
            });
            
            pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`certificate-${certificateId}.pdf`);
            
            toast.success("Certificate downloaded successfully!");
        } catch (error) {
            console.error("Certificate generation error:", error);
            toast.error("Failed to generate certificate.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <>
            <div className="relative overflow-hidden">
                <CertificateTemplate 
                    ref={certificateRef}
                    studentName={studentName}
                    courseName={courseName}
                    completedAt={completedAt}
                    certificateId={certificateId}
                />
            </div>
            
            <Button 
                onClick={handleDownload} 
                disabled={generating}
                variant="outline"
                size="sm"
                className="gap-2"
            >
                {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <FileCheck className="h-4 w-4" />
                )}
                {generating ? "Generating..." : "Download Certificate"}
            </Button>
        </>
    );
}
