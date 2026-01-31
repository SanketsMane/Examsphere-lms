"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Layers, Plus, ListTree } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CategoryHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Managing Course Categories
          </DialogTitle>
          <DialogDescription>
            Learn how to organize your courses using a hierarchical category system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <section className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <ListTree className="h-4 w-4 text-primary" />
              Category Hierarchy
            </h3>
            <p className="text-sm text-muted-foreground">
              Categories are organized into two levels:
            </p>
            <ul className="grid gap-3">
                <li className="flex gap-3 text-sm p-3 border rounded-lg">
                    <div className="mt-1"><Badge className="bg-primary uppercase text-[10px]">Primary</Badge></div>
                    <div>
                        <p className="font-medium">Top-Level Categories</p>
                        <p className="text-muted-foreground text-xs">Broad subjects like "Programming" or "Design". These appear as main headings.</p>
                    </div>
                </li>
                <li className="flex gap-3 text-sm p-3 border rounded-lg bg-muted/30">
                    <div className="mt-1 ml-4"><span className="text-muted-foreground">↳</span> <Badge variant="outline" className="text-[10px] uppercase">Sub</Badge></div>
                    <div>
                        <p className="font-medium">Sub-Categories</p>
                        <p className="text-muted-foreground text-xs">Specialized niches like "Web Development" under "Programming". Indented in the list.</p>
                    </div>
                </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Quick Creation
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                When adding a <strong>New Category</strong>, you can use the <strong>"Quick Add Sub-categories"</strong> 
                section to create multiple children at once.
              </p>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg text-xs leading-relaxed">
                <strong>Pro Tip:</strong> Setting a "Parent Category" in the dropdown while using Quick Add will create 
                a 3-level deep structure. Generally, we recommend a 2-level structure for the best user experience.
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold text-sm">Visual Indicators</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">Icon/Emoji:</span>
                <p>Add a Lucide icon name or a simple emoji to make the category stand out in the nav.</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">Slugs:</span>
                <p>Slugs are automatically generated from names (e.g., "Web Dev" becomes "web-dev").</p>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
