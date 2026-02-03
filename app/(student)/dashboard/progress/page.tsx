import { ProgressDashboard } from "@/components/student/ProgressDashboard";

/**
 * Student Progress Page
 * Author: Sanket
 */

export default function ProgressPage() {
    return (
        <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Your Learning Progress</h1>
                <p className="text-muted-foreground">Monitor your growth, track your goals, and celebrate achievements.</p>
            </div>
            
            <ProgressDashboard />
        </div>
    );
}
