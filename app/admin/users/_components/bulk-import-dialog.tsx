"use client";

import { useState } from "react";
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
import { bulkImportUsers } from "@/app/actions/users";
import { toast } from "sonner";
import { IconUpload, IconFileSpreadsheet, IconDownload, IconX, IconCheck } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import { Checkbox } from "@/components/ui/checkbox";

export function BulkImportDialog() {
    const [open, setOpen] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [importErrors, setImportErrors] = useState<string[]>([]);

    const downloadSample = () => {
        const ws = XLSX.utils.json_to_sheet([
            { name: "John Doe", email: "john@example.com", password: "password123", role: "student" },
            { name: "Jane Teacher", email: "jane@example.com", password: "securepass", role: "teacher" },
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Users");
        XLSX.writeFile(wb, "kidokool_sample_users.xlsx");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawData = XLSX.utils.sheet_to_json(ws);
                
                // Normalize keys
                const data = rawData.map((row: any) => {
                    const newRow: any = {};
                    Object.keys(row).forEach(key => {
                        const normalizedKey = key.trim().toLowerCase();
                        if (normalizedKey === "name" || normalizedKey === "user name") newRow.name = row[key];
                        else if (normalizedKey === "email" || normalizedKey === "email address") newRow.email = row[key];
                        else if (normalizedKey === "role" || normalizedKey === "user role") {
                             let role = String(row[key]).trim().toLowerCase();
                             if (role === 'user') role = 'student'; // Auto-fix common issue
                             newRow.role = role;
                        }
                        else if (normalizedKey === "password") newRow.password = row[key];
                    });
                    return newRow;
                });

                setUsers(data);
                // Select all valid rows by default? Or just all rows.
                // Let's select all rows initially
                setSelectedIndices(new Set(data.map((_, i) => i)));
                validateData(data);
                setImportErrors([]);
            } catch (err) {
                toast.error("Failed to parse file");
                console.error(err);
            }
        };
        reader.readAsBinaryString(file);
    };

    const validateData = (data: any[]) => {
        const errs: string[] = [];
        data.forEach((row, index) => {
            if (!row.name || !row.email || !row.role) {
                errs.push(`Row ${index + 1}: Missing required fields (Name, Email, Role)`);
            }
            if (row.role && !["student", "teacher", "admin"].includes(row.role.toLowerCase())) {
                errs.push(`Row ${index + 1}: Invalid role '${row.role}'`);
            }
        });
        setErrors(errs);
    };

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIndices(new Set(users.map((_, i) => i)));
        } else {
            setSelectedIndices(new Set());
        }
    };

    const toggleSelection = (index: number) => {
        const newSelected = new Set(selectedIndices);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedIndices(newSelected);
    };

    const handleImport = async () => {
        if (selectedIndices.size === 0) {
            toast.error("No users selected to import");
            return;
        }

        // We only care about errors in SELECTED rows
        const selectedUsers = users.filter((_, i) => selectedIndices.has(i));
        
        // Re-validate strictly for selected users
        const activeErrors: string[] = [];
        selectedUsers.forEach((row, i) => {
             if (!row.name || !row.email || !row.role) activeErrors.push(`Selected Row ${i+1}: Missing fields`);
             if (row.role && !["student", "teacher", "admin"].includes(row.role.toLowerCase())) activeErrors.push(`Selected Row ${i+1}: Invalid role`);
        });

        if (activeErrors.length > 0) {
             toast.error("Some selected users have errors. Please deselect them or fix the file.");
             return;
        }

        setIsLoading(true);
        try {
            // Sanitize data to ensure only plain objects are sent to server action
            const sanitizedUsers = selectedUsers.map(user => ({
                name: String(user.name || ""),
                email: String(user.email || ""),
                password: user.password ? String(user.password) : undefined,
                role: String(user.role || "")
            }));

            const result = await bulkImportUsers(sanitizedUsers);
            if (result.success) {
                toast.success(result.message);
                if (result.details && result.details.length > 0) {
                    toast.warning(`Partial success. Issues: ${result.details.slice(0, 3).join(", ")}`);
                }
                setOpen(false);
                setUsers([]);
                setSelectedIndices(new Set());
                setImportErrors([]);
            } else {
                toast.error(result.error);
                if (result.details) setImportErrors(result.details);
            }
        } catch (error) {
            toast.error("Import failed");
        } finally {
            setIsLoading(false);
        }
    };

    const getRowStatus = (u: any) => {
        if (!u.name || !u.email || !u.role) return { error: "Missing fields", color: "text-red-500" };
        if (!["student", "teacher", "admin"].includes(u.role.toLowerCase())) return { error: "Invalid role", color: "text-red-500" };
        return { error: "Ready", color: "text-green-500" };
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <IconUpload className="h-4 w-4 mr-2" />
                    Bulk Import
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px]">
                <DialogHeader>
                    <DialogTitle>Bulk Import Users</DialogTitle>
                    <DialogDescription>
                        Upload an Excel or CSV file. Select users to import. Required columns: Name, Email, Password, Role.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between gap-4 p-4 border rounded-lg border-dashed bg-muted/50">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <IconFileSpreadsheet className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium">Select File</h4>
                                <p className="text-xs text-muted-foreground">Supported format: .xlsx, .xls, .csv</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <Button size="sm" variant="outline" onClick={downloadSample}>
                                <IconDownload className="h-4 w-4 mr-2" />
                                Sample
                             </Button>
                             <div className="relative">
                                <Button size="sm">Upload File</Button>
                                <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileUpload}
                                />
                             </div>
                        </div>
                    </div>

                    {users.length > 0 && (
                        <div className="border rounded-md">
                            <div className="p-2 border-b bg-muted/20 flex justify-between items-center">
                                <span className="text-sm font-medium">Preview ({users.length} found, {selectedIndices.size} selected)</span>
                                {importErrors.length > 0 ? (
                                    <Badge variant="destructive" className="gap-1">
                                         Import Error (See Toast)
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="gap-1">
                                        Review
                                    </Badge>
                                )}
                            </div>
                            <ScrollArea className="h-[300px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox 
                                                    checked={selectedIndices.size === users.length && users.length > 0}
                                                    onCheckedChange={(c) => toggleSelectAll(!!c)}
                                                />
                                            </TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.slice(0, 50).map((u, i) => {
                                            const status = getRowStatus(u);
                                            return (
                                                <TableRow key={i} className={selectedIndices.has(i) ? "bg-muted/30" : "opacity-50 grayscale"}>
                                                    <TableCell>
                                                        <Checkbox 
                                                            checked={selectedIndices.has(i)}
                                                            onCheckedChange={() => toggleSelection(i)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{u.name}</TableCell>
                                                    <TableCell>{u.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{u.role}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`${status.color} text-xs`}>{status.error}</span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleImport} disabled={isLoading || selectedIndices.size === 0}>
                        {isLoading ? "Importing..." : `Import ${selectedIndices.size} Users`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
