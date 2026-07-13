import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  Clock,
  MessageSquare,
  User,
  Sparkles,
  CalendarClock,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/auth/require-roles";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_STYLES } from "../constants";
import { StatusSelect } from "../_components/status-select";
import { NotesEditor } from "../_components/notes-editor";
import { DeleteInquiry } from "../_components/delete-inquiry";

export const dynamic = "force-dynamic";

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const inquiry = await prisma.chatInquiry.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!inquiry) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/inquiries"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to inquiries
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
            {inquiry.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight">{inquiry.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={cn("capitalize border", STATUS_STYLES[inquiry.status])}>
                {inquiry.status}
              </Badge>
              <span className="text-xs text-muted-foreground capitalize">via {inquiry.source}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusSelect id={inquiry.id} value={inquiry.status} />
          <DeleteInquiry id={inquiry.id} redirectTo="/admin/inquiries" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Transcript */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Conversation
            <span className="text-xs font-normal text-muted-foreground">({inquiry.messageCount} messages)</span>
          </h2>

          {inquiry.messages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              This visitor submitted their contact details but hasn&apos;t sent a message yet.
            </p>
          ) : (
            <div className="space-y-4">
              {inquiry.messages.map((m) => (
                <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                      m.role === "user" ? "bg-muted text-foreground" : "bg-navy-900 text-white"
                    )}
                  >
                    {m.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>
                  <div className={cn("max-w-[80%]", m.role === "user" ? "text-right" : "text-left")}>
                    <div
                      className={cn(
                        "inline-block rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap text-left",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted rounded-tl-sm"
                      )}
                    >
                      {m.content}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {format(m.createdAt, "dd MMM, HH:mm")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Sidebar: contact + notes + meta */}
        <div className="space-y-6">
          <Card className="p-5 space-y-3">
            <h2 className="font-semibold">Contact details</h2>
            <ContactRow icon={<Mail className="h-4 w-4" />} label="Email">
              <a href={`mailto:${inquiry.email}`} className="text-primary hover:underline break-all">
                {inquiry.email}
              </a>
            </ContactRow>
            <ContactRow icon={<Phone className="h-4 w-4" />} label="Mobile">
              <a href={`tel:${inquiry.phone}`} className="text-primary hover:underline">
                {inquiry.phone}
              </a>
            </ContactRow>
            <div className="flex gap-2 pt-1">
              <a
                href={`mailto:${inquiry.email}`}
                className="flex-1 text-center text-xs font-medium rounded-md border border-border py-2 hover:bg-muted transition-colors"
              >
                Email
              </a>
              <a
                href={`tel:${inquiry.phone}`}
                className="flex-1 text-center text-xs font-medium rounded-md border border-border py-2 hover:bg-muted transition-colors"
              >
                Call
              </a>
              <a
                href={`https://wa.me/${inquiry.phone.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-xs font-medium rounded-md border border-border py-2 hover:bg-muted transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </Card>

          <Card className="p-5 space-y-2 text-sm">
            <h2 className="font-semibold mb-1">Details</h2>
            <MetaRow icon={<CalendarClock className="h-4 w-4" />} label="Received">
              {format(inquiry.createdAt, "dd MMM yyyy, HH:mm")}
            </MetaRow>
            <MetaRow icon={<Clock className="h-4 w-4" />} label="Last activity">
              {inquiry.lastMessageAt
                ? formatDistanceToNow(inquiry.lastMessageAt, { addSuffix: true })
                : "No messages"}
            </MetaRow>
            <MetaRow icon={<Globe className="h-4 w-4" />} label="IP address">
              {inquiry.ipAddress || "—"}
            </MetaRow>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold mb-3">Internal notes</h2>
            <NotesEditor id={inquiry.id} initial={inquiry.notes || ""} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function MetaRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon} {label}
      </span>
      <span className="text-right">{children}</span>
    </div>
  );
}
