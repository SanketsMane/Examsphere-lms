"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Link as LinkIcon } from "lucide-react";
import { useState, useEffect } from "react";

interface FooterLink {
    name: string;
    href: string;
}

interface FooterLinks {
    learn: FooterLink[];
    teach: FooterLink[];
    support: FooterLink[];
    company: FooterLink[];
}

const defaultLinks: FooterLinks = {
    learn: [
        { name: "Find Tutors", href: "/find-teacher" },
        { name: "Online Courses", href: "/courses" },
        { name: "Live Sessions", href: "/live-sessions" },
        { name: "Group Classes", href: "/live-sessions" },
    ],
    teach: [
        { name: "Become a Tutor", href: "/register/teacher" },
        { name: "Teacher Rules", href: "/terms" },
        { name: "Success Stories", href: "/testimonials-demo" },
        { name: "Teacher Verification", href: "/teacher/verification" },
    ],
    support: [
        { name: "Help Center", href: "/help" },
        { name: "Contact Us", href: "/contact" },
        { name: "FAQs", href: "/faq" },
        { name: "Report Issue", href: "/report" },
    ],
    company: [
        { name: "About Us", href: "/about" },
        { name: "Careers", href: "/careers" },
        { name: "Blog", href: "/blog" },
        { name: "Privacy Policy", href: "/privacy" },
    ],
};

export function FooterLinksEditor({ initialData }: { initialData?: any }) {
    const [links, setLinks] = useState<FooterLinks>(initialData || defaultLinks);

    // If initialData is null/empty, use defaults
    useEffect(() => {
        if (!initialData || Object.keys(initialData).length === 0) {
            setLinks(defaultLinks);
        } else {
            setLinks(initialData);
        }
    }, [initialData]);

    const updateLink = (section: keyof FooterLinks, index: number, field: keyof FooterLink, value: string) => {
        setLinks(prev => {
            const newSection = [...prev[section]];
            newSection[index] = { ...newSection[index], [field]: value };
            return { ...prev, [section]: newSection };
        });
    };

    const addLink = (section: keyof FooterLinks) => {
        setLinks(prev => ({
            ...prev,
            [section]: [...prev[section], { name: "New Link", href: "/" }]
        }));
    };

    const removeLink = (section: keyof FooterLinks, index: number) => {
        setLinks(prev => ({
            ...prev,
            [section]: prev[section].filter((_, i) => i !== index)
        }));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5" />
                    Footer Links
                </CardTitle>
                <CardDescription>Manage the links displayed in the website footer.</CardDescription>
            </CardHeader>
            <CardContent>
                <input type="hidden" name="footerLinks" value={JSON.stringify(links)} />

                <Tabs defaultValue="company" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="learn">Learn</TabsTrigger>
                        <TabsTrigger value="teach">Teach</TabsTrigger>
                        <TabsTrigger value="company">Company</TabsTrigger>
                        <TabsTrigger value="support">Support</TabsTrigger>
                    </TabsList>

                    {(Object.keys(defaultLinks) as Array<keyof FooterLinks>).map((section) => (
                        <TabsContent key={section} value={section} className="space-y-4 pt-4">
                            {links[section]?.map((link, index) => (
                                <div key={index} className="flex gap-3 items-end">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-xs text-muted-foreground">Label</Label>
                                        <Input
                                            value={link.name}
                                            onChange={(e) => updateLink(section, index, "name", e.target.value)}
                                            placeholder="Link Name"
                                        />
                                    </div>
                                    <div className="flex-[2] space-y-1">
                                        <Label className="text-xs text-muted-foreground">URL</Label>
                                        <Input
                                            value={link.href}
                                            onChange={(e) => updateLink(section, index, "href", e.target.value)}
                                            placeholder="/page-url"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeLink(section, index)}
                                        className="text-destructive hover:text-destructive/90"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addLink(section)}
                                className="w-full border-dashed"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Link
                            </Button>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}
