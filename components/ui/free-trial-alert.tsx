import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Gift, Info } from "lucide-react";

/**
 * Free Trial Alert Component
 * Author: Sanket
 * 
 * Shows students when they're eligible for a free trial or have already used it
 */

interface FreeTrialAlertProps {
    isEligible: boolean;
    hasUsedTrial: boolean;
    teacherName: string;
}

export function FreeTrialAlert({ isEligible, hasUsedTrial, teacherName }: FreeTrialAlertProps) {
    if (!isEligible) return null;

    if (hasUsedTrial) {
        return (
            <Alert className="border-muted">
                <Info className="h-4 w-4" />
                <AlertTitle>Free Trial Already Used</AlertTitle>
                <AlertDescription>
                    You've already used your free trial with {teacherName}. Regular pricing applies.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
            <Gift className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-900 dark:text-green-100">
                Free Trial Available!
            </AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-200">
                This is your first session with {teacherName}. Book for <strong>FREE</strong>!
            </AlertDescription>
        </Alert>
    );
}
