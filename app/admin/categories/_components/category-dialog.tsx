"use client";

import { useEffect, useState } from "react";
// import { useActionState } from "react"; // Removed as we handle state manually for image
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, X } from "lucide-react";
import { createCategory, updateCategory } from "@/app/actions/categories";
import { toast } from "sonner";
import { Category } from "@prisma/client";
import { FileUpload } from "@/components/ui/file-upload";
import { useRouter } from "next/navigation";

interface CategoryDialogProps {
    category?: Category;
    parentCategories?: Category[]; // For selecting parent
    trigger?: React.ReactNode;
}

export function CategoryDialog({ category, parentCategories = [], trigger }: CategoryDialogProps) {
    const [open, setOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState(category?.image || "");
    const [loading, setLoading] = useState(false);
    const [subCategories, setSubCategories] = useState<string[]>([""]);
    const router = useRouter();

    const addSubCategory = () => setSubCategories([...subCategories, ""]);
    const removeSubCategory = (index: number) => {
        const newSubs = [...subCategories];
        newSubs.splice(index, 1);
        setSubCategories(newSubs);
    };
    const updateSubCategory = (index: number, value: string) => {
        const newSubs = [...subCategories];
        newSubs[index] = value;
        setSubCategories(newSubs);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        // Append image URL if it exists
        if (imageUrl) {
            formData.set("image", imageUrl);
        }

        try {
            const action = category ? updateCategory : createCategory;
            const result = await action({}, formData);

            if (result.success) {
                setOpen(false);
                toast.success(category ? "Category updated" : "Category created");
                setImageUrl(""); // Reset
                setSubCategories([""]); // Reset
                router.refresh();
            } else if (result.error) {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // Reset image when dialog opens/closes or category changes
    useEffect(() => {
        if (category) {
            setImageUrl(category.image || "");
        } else {
            setImageUrl("");
        }
    }, [category, open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant={category ? "ghost" : "default"} size={category ? "icon" : "default"}>
                        {category ? <Edit className="h-4 w-4" /> : <><Plus className="mr-2 h-4 w-4" /> Add Category</>}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{category ? "Edit Category" : "Add New Category"}</DialogTitle>
                    <DialogDescription>
                        {category ? "Update category details." : "Create a new category for courses."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {category && <input type="hidden" name="id" value={category.id} />}

                    <div className="space-y-2">
                        <Label>Category Image</Label>
                        <FileUpload
                            value={imageUrl}
                            onChange={setImageUrl}
                            label="Upload Category Image"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" defaultValue={category?.name} required placeholder="e.g. Web Development" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea id="description" name="description" defaultValue={category?.description || ""} placeholder="Short description..." />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="icon">Icon (Optional)</Label>
                        <Input id="icon" name="icon" defaultValue={category?.icon || ""} placeholder="Lucide icon name or emoji" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="parentId">Parent Category (Optional)</Label>
                        <Select name="parentId" defaultValue={category?.parentId || ""}>
                            <SelectTrigger>
                                <SelectValue placeholder="None (Top Level)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="null">None (Top Level)</SelectItem>
                                {parentCategories
                                    .filter(c => c.id !== category?.id) // Prevent self-parenting
                                    .map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {!category && (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Quick Add Sub-categories</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addSubCategory}>
                                    <Plus className="h-4 w-4 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {subCategories.map((sub, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input 
                                            name="subCategoryNames"
                                            placeholder={`Sub-category ${index + 1} name`}
                                            value={sub}
                                            onChange={(e) => updateSubCategory(index, e.target.value)}
                                        />
                                        {subCategories.length > 1 && (
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => removeSubCategory(index)}
                                                className="text-destructive"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                These will be created as children of the category above.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : (category ? "Update" : "Create")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
