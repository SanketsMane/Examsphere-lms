import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Calendar,
  GraduationCap,
  Award,
  FileText,
  Shield
} from "lucide-react";
import { requireAdmin } from "@/app/data/auth/require-roles";
import { pendingTeacherWhere } from "@/app/admin/_lib/teacher-approval";
import { prisma } from "@/lib/db";
import { TeacherApprovalActions } from "./_components/TeacherApprovalActions";
import { constructS3Url } from "@/lib/s3-utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfileVerificationPage() {
  await requireAdmin();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [pendingProfiles, approvedCount, rejectedCount] = await Promise.all([
    prisma.teacherProfile.findMany({
      where: pendingTeacherWhere,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        verification: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teacherVerification.count({ where: { status: 'Approved', approvedAt: { gte: startOfToday } } }),
    prisma.teacherVerification.count({ where: { status: 'Rejected', rejectedAt: { gte: startOfToday } } })
  ]);

  const pendingCount = pendingProfiles.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile Verification</h1>
        <p className="text-muted-foreground">
          Review and verify teacher profiles, qualifications, and documents
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
          </CardContent>
        </Card>

      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Verifications</CardTitle>
              <CardDescription>
                Teacher profiles awaiting verification review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingProfiles.length > 0 ? pendingProfiles.map((profile) => {
                  const verification = profile.verification;
                  const qualificationDocs = (verification?.qualificationDocuments as string[] | null) ?? [];
                  const experienceDocs = (verification?.experienceDocuments as string[] | null) ?? [];
                  return (
                  <Card key={profile.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={constructS3Url(profile.user.image || "")} />
                            <AvatarFallback>
                              {profile.user.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{profile.user.name || 'Unknown'}</h3>
                            <p className="text-sm text-muted-foreground">{profile.user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="capitalize">
                                {verification ? "Verification Request" : "No documents submitted"}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {verification?.submittedAt
                                  ? `Submitted ${new Date(verification.submittedAt).toLocaleDateString("en-IN")}`
                                  : `Joined ${new Date(profile.createdAt).toLocaleDateString("en-IN")}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/teachers/${profile.userId}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Link>
                          </Button>
                        </div>
                      </div>



                      {/* Document Section */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 p-4 bg-muted/30 rounded-lg">
                        <div>
                          <h4 className="flex items-center gap-2 font-medium mb-3 text-sm">
                            <Shield className="h-4 w-4 text-blue-500" /> Identity
                          </h4>
                          {verification?.identityDocumentUrl ? (
                            <DocumentLink url={verification.identityDocumentUrl} />
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No document</span>
                          )}
                        </div>

                        <div>
                          <h4 className="flex items-center gap-2 font-medium mb-3 text-sm">
                            <GraduationCap className="h-4 w-4 text-purple-500" /> Qualifications
                          </h4>
                          {qualificationDocs.length > 0 ? (
                            <div className="space-y-2">
                              {qualificationDocs.map((doc, i) => (
                                <DocumentLink key={i} url={doc} index={i + 1} />
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No documents</span>
                          )}
                        </div>

                        <div>
                          <h4 className="flex items-center gap-2 font-medium mb-3 text-sm">
                            <Award className="h-4 w-4 text-amber-500" /> Experience
                          </h4>
                          {experienceDocs.length > 0 ? (
                            <div className="space-y-2">
                              {experienceDocs.map((doc, i) => (
                                <DocumentLink key={i} url={doc} index={i + 1} />
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No documents</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <TeacherApprovalActions profileId={profile.id} />
                      </div>
                    </CardContent>
                  </Card>
                  );
                }) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending verifications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Profiles</CardTitle>
              <CardDescription>
                Successfully verified teacher profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Approved profiles will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Profiles</CardTitle>
              <CardDescription>
                Profiles that did not meet verification requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Rejected profiles will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  );
}



function DocumentLink({ url, index }: { url: string; index?: number }) {
  // Simple check for mock/production URL logic if needed, or just link
  const isMock = url.startsWith("mock-upload");
  const isUrl = url.startsWith('http');

  // If mock, we don't have a real URL.
  const fullUrl = isUrl
    ? url
    : isMock
      ? "#"
      : constructS3Url(url);

  const label = isUrl ? url.split('/').pop() : url;

  if (isMock) {
    return (
      <span
        title="Mock upload (simulation). File is not actually stored on the server."
        className="flex items-center gap-2 text-xs p-2 bg-amber-50 border border-amber-200 rounded truncate max-w-full w-full"
      >
        <FileText className="h-3 w-3 shrink-0 text-amber-500" />
        <span className="truncate text-amber-700">{index ? `Doc ${index} (Mock)` : `Mock File`}</span>
      </span>
    );
  }

  return (
    <a
      href={fullUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-xs p-2 bg-white border rounded hover:bg-gray-50 transition-colors truncate max-w-full"
    >
      <FileText className="h-3 w-3 shrink-0 text-gray-500" />
      <span className="truncate">{index ? `Doc ${index}` : label}</span>
      <Download className="h-3 w-3 shrink-0 ml-auto opacity-50" />
    </a>
  );
}