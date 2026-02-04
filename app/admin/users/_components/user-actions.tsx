"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Shield, Trash, Ban, CheckCircle, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { suspendUser, unsuspendUser, deleteUser, updateUserAndTeacherProfile } from "@/app/actions/admin-management";
import { useRouter } from "next/navigation";

interface UserActionsProps {
    user: {
        id: string;
        name: string;
        email: string;
        role: string | null;
        banned: boolean | null;
        bio?: string | null;
        teacherProfile?: {
            id: string;
            bio: string | null;
            expertise: string[];
            languages: string[];
            hourlyRate: number | null;
            experience: number | null;
            isVerified: boolean;
            isApproved: boolean;
        } | null;
    };
}

export function UserActions({ user }: UserActionsProps) {
    const router = useRouter();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [role, setRole] = useState(user.role || "student");
    const [bio, setBio] = useState(user.bio || "");
    
    // Teacher Profile Form State
    const [teacherBio, setTeacherBio] = useState(user.teacherProfile?.bio || "");
    const [expertise, setExpertise] = useState(user.teacherProfile?.expertise.join(", ") || "");
    const [languages, setLanguages] = useState(user.teacherProfile?.languages.join(", ") || "");
    const [hourlyRate, setHourlyRate] = useState(user.teacherProfile?.hourlyRate?.toString() || "");
    const [experience, setExperience] = useState(user.teacherProfile?.experience?.toString() || "");
    const [isVerified, setIsVerified] = useState(user.teacherProfile?.isVerified || false);
    const [isApproved, setIsApproved] = useState(user.teacherProfile?.isApproved || false);

    const handleSuspendToggle = async () => {
        setLoading(true);
        try {
            if (user.banned) {
                await unsuspendUser(user.id);
                toast.success("User unsuspended");
            } else {
                await suspendUser(user.id);
                toast.warning("User suspended");
            }
            router.refresh();
        } catch (error) {
            toast.error("Action failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            await deleteUser(user.id);
            toast.success("User deleted");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete user");
        } finally {
            setLoading(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const data = {
                name,
                email,
                role,
                bio,
                ...(role === "teacher" ? {
                    teacherProfile: {
                        bio: teacherBio,
                        expertise: expertise.split(",").map(s => s.trim()).filter(Boolean),
                        languages: languages.split(",").map(s => s.trim()).filter(Boolean),
                        hourlyRate: hourlyRate ? parseInt(hourlyRate) : null,
                        experience: experience ? parseInt(experience) : null,
                        isVerified,
                        isApproved,
                    }
                } : {})
            };

            await updateUserAndTeacherProfile(user.id, data);
            toast.success("User updated successfully");
            setIsEditDialogOpen(false);
            router.refresh();
        } catch (error) {
            toast.error("Failed to update user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                        Copy User ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit Details
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleSuspendToggle} className={user.banned ? "text-green-600" : "text-amber-600"}>
                        {user.banned ? (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" /> Activate User
                            </>
                        ) : (
                            <>
                                <Ban className="mr-2 h-4 w-4" /> Suspend User
                            </>
                        )}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" /> Delete User
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit User & Profile</DialogTitle>
                        <DialogDescription>Update user details and teacher profile information.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Name</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Email</Label>
                            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Role</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right mt-2">User Bio</Label>
                            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="col-span-3" rows={3} />
                        </div>

                        {role === "teacher" && (
                            <>
                                <div className="border-t my-2 pt-4">
                                    <h4 className="font-semibold text-sm mb-4">Teacher Profile Settings</h4>
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label className="text-right mt-2">Teacher Bio</Label>
                                    <Textarea value={teacherBio} onChange={(e) => setTeacherBio(e.target.value)} className="col-span-3" rows={3} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Expertise</Label>
                                    <Input value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="Math, Physics, Science" className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Languages</Label>
                                    <Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, Hindi, Spanish" className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Hourly Rate ($)</Label>
                                    <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Experience (Yrs)</Label>
                                    <Input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Verification</Label>
                                    <div className="flex items-center gap-6 col-span-3">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="isVerified" checked={isVerified} onCheckedChange={(checked) => setIsVerified(!!checked)} />
                                            <label htmlFor="isVerified" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                Verified
                                            </label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="isApproved" checked={isApproved} onCheckedChange={(checked) => setIsApproved(!!checked)} />
                                            <label htmlFor="isApproved" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                Approved
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate} disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user account
                            and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            {loading ? "Deleting..." : "Delete Account"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
