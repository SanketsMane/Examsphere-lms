"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Award } from "lucide-react";
import { CertificateDownloadButton } from "./CertificateDownloadButton";

/**
 * Certificates Section Component
 * Author: Sanket
 */

interface CertificatesSectionProps {
    studentName: string;
    completedCourses: any[];
}

export function CertificatesSection({ studentName, completedCourses }: CertificatesSectionProps) {
    if (completedCourses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
                <Award className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground font-medium">No certificates available yet</p>
                <p className="text-xs text-muted-foreground">Complete full courses to earn official certificates!</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {completedCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:border-primary transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">{course.title}</h4>
                            <p className="text-xs text-muted-foreground">Certified on {new Date(course.updatedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <CertificateDownloadButton 
                        studentName={studentName}
                        courseName={course.title}
                        completedAt={new Date(course.updatedAt).toLocaleDateString()}
                        certificateId={`CERT-${course.id.slice(-8).toUpperCase()}`}
                    />
                </div>
            ))}
        </div>
    );
}
