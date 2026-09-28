import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  GraduationCap,
  Award,
  User
} from "lucide-react";
import { requireTeacher } from "@/app/data/auth/require-roles";
import { getVerificationStatus } from "@/app/actions/teacher-verification";
import { BankDetailsForm } from "./bank-details-form";
import { DocumentUpload } from "./_components/DocumentUpload";
import { SubmitVerificationButton } from "./_components/submit-verification-button";

export const dynamic = "force-dynamic";

export default async function TeacherVerificationPage() {
  await requireTeacher();

  const statusData = await getVerificationStatus();
  const verification = statusData?.verification;
  const isApproved = statusData?.isApproved || false;
  const isVerified = isApproved || statusData?.isVerified || false;
  const status = verification?.status;
  const isSubmitted = !!verification?.submittedAt;
  const isRejected = status === "Rejected";
  const isAwaitingReview = !isApproved && isSubmitted && (status === "Pending" || status === "UnderReview");
  // While an application is under review the documents are frozen; changing one clears the submission.
  const lockDocuments = isApproved || isAwaitingReview;

  // Helper to determine section status
  const getSectionStatus = (docUrl: string | undefined | null, verifiedAt: Date | undefined | null) => {
    if (verifiedAt || isApproved) return 'approved';
    if (isRejected) return 'rejected';
    if (docUrl && docUrl.length > 0) return 'pending'; // Array or string
    return 'not_submitted';
  };

  const identityStatus = getSectionStatus(verification?.identityDocumentUrl, verification?.identityVerifiedAt);
  // Arrays
  const qualificationStatus = (verification?.qualificationsVerifiedAt || (isApproved && (verification?.qualificationDocuments as string[] | undefined)?.length)) ? 'approved' : (verification?.qualificationDocuments && (verification.qualificationDocuments as string[]).length > 0 ? 'pending' : 'not_submitted');
  const experienceStatus = (verification?.experienceVerifiedAt || (isApproved && (verification?.experienceDocuments as string[] | undefined)?.length)) ? 'approved' : (verification?.experienceDocuments && (verification.experienceDocuments as string[]).length > 0 ? 'pending' : 'not_submitted');
  const backgroundStatus = verification?.backgroundCheckStatus === 'completed' ? 'approved' : (verification?.backgroundCheckStatus === 'pending' ? 'pending' : 'not_submitted');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-700"><Clock className="h-3 w-3 mr-1" />Uploaded</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><AlertCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">Not Submitted</Badge>
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile Verification</h1>
        <p className="text-muted-foreground">
          Complete your profile verification to start teaching and receiving payouts
        </p>
      </div>

      {/* Overall Status */}
      {isVerified ? (
        <Card className="border-2 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-green-800 dark:text-green-300">Verification Complete</CardTitle>
                  <CardDescription>Your profile is approved. You can now create courses, teach and request payouts.</CardDescription>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700">
                <Shield className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            </div>
          </CardHeader>
        </Card>
      ) : isRejected ? (
        <Card className="border-2 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-red-800 dark:text-red-300">Application Rejected</CardTitle>
                <CardDescription>
                  {verification?.rejectionReason
                    ? <>Reason: {verification.rejectionReason}</>
                    : "Your application was not approved."}
                  {" "}Update your documents below and submit again.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      ) : isAwaitingReview ? (
        <Card className="border-2 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-100">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-blue-800 dark:text-blue-300">Your application is awaiting admin approval</CardTitle>
                <CardDescription>
                  Submitted on {verification!.submittedAt!.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.
                  We&apos;ll notify you once an admin has reviewed your documents. Course creation unlocks after approval.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <Card className="border-2 border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-orange-100">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-orange-800 dark:text-orange-300">Verification Not Submitted</CardTitle>
                <CardDescription>
                  Upload your ID and qualification documents, add bank details, then submit your application for admin review.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Bank Details Section (New) */}
      <BankDetailsForm initialData={verification} />

      {/* Verification Steps */}
      <div className="grid gap-6">
        {/* Identity Verification */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Identity Verification</CardTitle>
                  <CardDescription>
                    Upload a government-issued photo ID: Aadhaar, PAN card or Passport (PDF or photo)
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(identityStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <DocumentUpload
              label="Identity Document"
              type="identity"
              existingUrls={verification?.identityDocumentUrl}
              disabled={lockDocuments}
            />
          </CardContent>
        </Card>

        {/* Qualification Verification */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-full">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Educational Qualifications</CardTitle>
                  <CardDescription>
                    Upload your degrees, diplomas, or certificates
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(qualificationStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <DocumentUpload
              label="Qualification Documents"
              type="qualification"
              existingUrls={verification?.qualificationDocuments as string[] | undefined}
              disabled={lockDocuments}
            />
          </CardContent>
        </Card>

        {/* Experience Verification */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-full">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle>Experience Certificates</CardTitle>
                  <CardDescription>
                    Upload proof of past teaching experience
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(experienceStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <DocumentUpload
              label="Experience Documents"
              type="experience"
              existingUrls={verification?.experienceDocuments as string[] | undefined}
              disabled={lockDocuments}
            />
          </CardContent>
        </Card>

        {!isApproved && (
          <div className="flex justify-end pt-4 pb-12">
            {isAwaitingReview ? (
              <p className="text-sm text-muted-foreground">Application submitted. Awaiting admin approval.</p>
            ) : (
              <SubmitVerificationButton hasIdentityDocument={!!verification?.identityDocumentUrl} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
