import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";
import { CategoryDialog } from "./_components/category-dialog";
import { CategoryHelp } from "./_components/category-help";
import { DeleteCategoryButton } from "./_components/delete-category-button";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getCategories() {
    const categories = await prisma.category.findMany({
        include: {
            parent: true,
            _count: {
                select: { courses: true, children: true }
            }
        },
        orderBy: { name: "asc" }
    });
    return categories;
}

export default async function AdminCategoriesPage() {
    await requireAdmin();

    const categories = await getCategories();

    // Filter top-level categories for the parent selector
    const topLevelCategories = categories.filter(c => !c.parentId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Layers className="h-8 w-8" />
                        Categories
                    </h1>
                    <p className="text-muted-foreground">Manage course categories and hierarchy</p>
                </div>
                <div className="flex items-center gap-2">
                    <CategoryHelp />
                    <CategoryDialog parentCategories={categories} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Categories</CardTitle>
                    <CardDescription>
                        List of all categories in the system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Parent</TableHead>
                                <TableHead>Courses</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No categories found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                // Flat list but indented for hierarchy
                                categories
                                  .filter(c => !c.parentId) // Main categories first
                                  .flatMap(parent => [
                                    parent,
                                    ...categories.filter(c => c.parentId === parent.id)
                                  ])
                                  .map((category) => (
                                    <TableRow key={category.id} className={category.parentId ? "bg-muted/30" : ""}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {category.parentId && <span className="text-muted-foreground ml-4">↳</span>}
                                                {category.icon && <span className="text-lg">{category.icon}</span>}
                                                {category.name}
                                                {category.parentId && <Badge variant="outline" className="text-[10px] py-0 px-1 ml-1 h-4">SUB</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{category.slug}</TableCell>
                                        <TableCell>
                                            {category.parent ? (
                                                <Badge variant="secondary" className="font-normal">{category.parent.name}</Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Primary</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium">{category._count.courses}</span> courses
                                            {!category.parentId && category._count.children > 0 && (
                                                <span className="text-xs text-muted-foreground block">
                                                    {category._count.children} sub-categories
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <CategoryDialog category={category as any} parentCategories={categories as any} />
                                                <DeleteCategoryButton id={category.id} name={category.name} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
