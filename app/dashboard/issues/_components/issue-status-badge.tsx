import { Badge } from "@/components/ui/badge";

const STYLES: Record<string, string> = {
    Open: "bg-blue-100 text-blue-800",
    InProgress: "bg-yellow-100 text-yellow-800",
    Resolved: "bg-green-100 text-green-800",
    Closed: "bg-gray-100 text-gray-800",
    Escalated: "bg-red-100 text-red-800",
};

const LABELS: Record<string, string> = {
    InProgress: "In Progress",
};

export function IssueStatusBadge({ status }: { status: string }) {
    return (
        <Badge variant="secondary" className={STYLES[status]}>
            {LABELS[status] ?? status}
        </Badge>
    );
}
