import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  GraduationCap,
  Award,
  FileText,
  Wallet
} from "lucide-react";
import Link from "next/link";

interface TeacherVerificationStatusProps {
  verificationStatus?: {
    isVerified: boolean;
    completedSteps: number;
    totalSteps: number;
    identityStatus: 'approved' | 'pending' | 'rejected' | 'not_submitted';
    qualificationStatus: 'approved' | 'pending' | 'rejected' | 'not_submitted';
    experienceStatus: 'approved' | 'pending' | 'rejected' | 'not_submitted';
    backgroundStatus: 'approved' | 'pending' | 'rejected' | 'not_submitted';
  }
}

export default function TeacherVerificationStatus({ verificationStatus }: TeacherVerificationStatusProps) {
  // Default mock data if no status provided
  const defaultStatus = {
    isVerified: false,
    completedSteps: 1,
    totalSteps: 4,
    identityStatus: 'pending' as const,
    qualificationStatus: 'approved' as const,
    experienceStatus: 'not_submitted' as const,
    backgroundStatus: 'not_submitted' as const
  };

  const status = verificationStatus || defaultStatus;
  const progressPercentage = (status.completedSteps / status.totalSteps) * 100;

  const getStatusIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  };

  const getStatusText = (stepStatus: string) => {
    switch (stepStatus) {
      case 'approved': return 'Verified'
      case 'pending': return 'Under Review'
      case 'rejected': return 'Rejected'
      default: return 'Not Submitted'
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Profile Verification
            </CardTitle>
            <CardDescription>
              {status.isVerified 
                ? "Your profile is fully verified"
                : `${status.completedSteps} of ${status.totalSteps} steps completed`
              }
            </CardDescription>
          </div>
          {status.isVerified && (
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {!status.isVerified && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Verification Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Verification Steps */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 rounded-lg border">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Identity Verification</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.identityStatus)}
              <span className="text-xs text-muted-foreground">
                {getStatusText(status.identityStatus)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg border">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Qualifications</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.qualificationStatus)}
              <span className="text-xs text-muted-foreground">
                {getStatusText(status.qualificationStatus)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg border">
            <div className="flex items-center gap-3">
              <Award className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Experience</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.experienceStatus)}
              <span className="text-xs text-muted-foreground">
                {getStatusText(status.experienceStatus)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg border">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Background Check</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.backgroundStatus)}
              <span className="text-xs text-muted-foreground">
                {getStatusText(status.backgroundStatus)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" className="flex-1">
            <Link href="/teacher/verification">
              {status.isVerified ? 'View Details' : 'Continue Verification'}
            </Link>
          </Button>
          {status.isVerified && (
            <Button asChild size="sm" variant="outline" className="flex-1">
              <Link href="/teacher/finance">
                <Wallet className="h-3 w-3 mr-1" />
                Request Payout
              </Link>
            </Button>
          )}
        </div>

        {/* Status Message */}
        {!status.isVerified && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              Complete all verification steps to unlock live teaching and payout features.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}