"use client";

import React from "react";

/**
 * Certificate Template for PDF generation
 * Author: Sanket
 */

interface CertificateTemplateProps {
    studentName: string;
    courseName: string;
    completedAt: string;
    certificateId: string;
}

export const CertificateTemplate = React.forwardRef<HTMLDivElement, CertificateTemplateProps>(
    ({ studentName, courseName, completedAt, certificateId }, ref) => {
        return (
            <div 
                ref={ref}
                className="w-[842px] h-[595px] bg-white border-[20px] border-primary p-12 flex flex-col items-center justify-between text-center font-serif relative overflow-hidden"
                style={{ position: 'absolute', left: '-9999px', top: '0' }} // Hidden from view but renderable
            >
                {/* Decorative border */}
                <div className="absolute inset-4 border-2 border-primary/20 pointer-events-none" />
                
                <div className="space-y-4">
                    <h2 className="text-primary text-4xl font-bold tracking-widest uppercase">Kidokool LMS</h2>
                    <div className="h-1 w-32 bg-primary mx-auto" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-slate-800 uppercase tracking-tight">Certificate of Completion</h1>
                    <p className="text-slate-500 text-xl italic">This is to certify that</p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-4xl font-bold text-slate-900 underline decoration-primary underline-offset-8">{studentName}</h3>
                    <div className="pt-4">
                        <p className="text-slate-600 text-lg">has successfully completed the course</p>
                        <h4 className="text-2xl font-bold text-slate-800 mt-1">{courseName}</h4>
                    </div>
                </div>

                <div className="w-full flex justify-between items-end px-12 pb-4">
                    <div className="text-left">
                        <p className="text-xs text-slate-400 uppercase tracking-tighter">Certificate ID</p>
                        <p className="font-mono text-sm text-slate-600">{certificateId}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase tracking-tighter">Issue Date</p>
                        <p className="text-lg font-bold text-slate-800">{completedAt}</p>
                    </div>
                </div>

                {/* Sub-decorative elements */}
                <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 bg-primary/10 rounded-full" />
                <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-primary/5 rounded-full" />
            </div>
        );
    }
);

CertificateTemplate.displayName = "CertificateTemplate";
