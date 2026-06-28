"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { getUsersForExport } from "@/app/actions/users";
import { toast } from "sonner";
import { IconDownload, IconCheck, IconX, IconFileSpreadsheet } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function BulkExportDialog() {
    const [open, setOpen] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (open) {
            fetchUsers();
        } else {
            setUsers([]);
            setSelectedIds(new Set());
        }
    }, [open]);

    const fetchUsers = async () => {
        setIsFetching(true);
        try {
            const result = await getUsersForExport();
            if (result.success && result.users) {
                setUsers(result.users);
                // Select all by default
                setSelectedIds(new Set(result.users.map((u: any) => u.id)));
            } else {
                toast.error(result.error || "Failed to fetch users");
            }
        } catch (error) {
            toast.error("Error loading users");
        } finally {
            setIsFetching(false);
        }
    };

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(users.map(u => u.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleExport = () => {
        if (selectedIds.size === 0) {
            toast.error("No users selected");
            return;
        }

        setIsLoading(true);
        try {
            const selectedUsers = users.filter(u => selectedIds.has(u.id));
            
            const exportData = selectedUsers.map(u => ({
                "User ID": u.id,
                "Name": u.name,
                "Email": u.email,
                "Role": u.role,
                "Joined Date": u.createdAt ? format(new Date(u.createdAt), "yyyy-MM-dd HH:mm:ss") : "N/A",
                "Email Verified": u.emailVerified ? "Yes" : "No"
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Users");
            
            const fileName = `examsphere_users_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            toast.success(`Exported ${selectedUsers.length} users successfully`);
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <IconDownload className="h-4 w-4 mr-2" />
                    Bulk Export
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Bulk Export Users</DialogTitle>
                    <DialogDescription>
                        Select the users you want to export to an Excel file.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="border rounded-md">
                        <div className="p-2 border-b bg-muted/20 flex justify-between items-center">
                            <span className="text-sm font-medium">
                                {isFetching ? "Loading..." : `${users.length} Users Found`}
                            </span>
                            <Badge variant="secondary">
                                {selectedIds.size} Selected
                            </Badge>
                        </div>
                        <ScrollArea className="h-[300px]">
                            {isFetching ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Loading users...
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox 
                                                    checked={users.length > 0 && selectedIds.size === users.length}
                                                    onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                                                />
                                            </TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Joined</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((u) => (
                                            <TableRow key={u.id} className={selectedIds.has(u.id) ? "bg-muted/30" : ""}>
                                                <TableCell>
                                                    <Checkbox 
                                                        checked={selectedIds.has(u.id)}
                                                        onCheckedChange={() => toggleSelection(u.id)}
                                                    />
                                                </TableCell>
                                                <TableCell>{u.name}</TableCell>
                                                <TableCell>{u.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{u.role}</Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleExport} disabled={isLoading || selectedIds.size === 0}>
                        {isLoading ? "Exporting..." : `Export ${selectedIds.size} Users`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
