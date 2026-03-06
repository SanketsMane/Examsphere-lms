"use client";

import { FileIcon, Trash2, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteResource } from "@/app/actions/resources";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { constructS3Url } from "@/lib/s3-helper";

interface Resource {
    id: string;
    title: string;
    description: string | null;
    fileUrl: string;
    fileType: string | null;
    createdAt: Date;
    course?: {
        title: string;
    } | null;
}

interface ResourceListProps {
    resources: Resource[];
}

export function ResourceList({ resources }: ResourceListProps) {
    const router = useRouter();

    const handleDelete = async (id: string) => {
        try {
            const result = await deleteResource(id);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success("Resource deleted");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete resource");
        }
    };

    if (resources.length === 0) {
        return (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
                <FileIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                <h3 className="text-lg font-medium">No resources yet</h3>
                <p className="text-muted-foreground mb-4">Upload documents to share with your students.</p>
            </div>
        );
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {resources.map((resource) => (
                        <TableRow key={resource.id}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{resource.title}</span>
                                    {resource.description && (
                                        <span className="text-xs text-muted-foreground">{resource.description}</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="uppercase text-xs">
                                    {resource.fileType || 'FILE'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {resource.course ? (
                                    <span className="text-sm">{resource.course.title}</span>
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">General</span>
                                )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {new Date(resource.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" asChild>
                                        <a href={constructS3Url(resource.fileUrl)} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(resource.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
