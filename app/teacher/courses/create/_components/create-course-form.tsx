"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    courseLevels,
    courseSchema,
    CourseSchemaType,
    courseStatus,
} from "@/lib/zodSchemas";
import { ArrowLeft, Loader2, PlusIcon, SparkleIcon } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import slugify from "slugify";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Uploader } from "@/components/file-uploader/Uploader";
import { useTransition } from "react";
import { tryCatch } from "@/hooks/try-catch";
import { CreateCourse } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useConfetti } from "@/hooks/use-confetti";
import { getCurrencyConfig } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket
import { useState, useEffect } from "react";

interface CreateCourseFormProps {
    categories: {
        id: string;
        name: string;
    }[];
}

export function CreateCourseForm({ categories }: CreateCourseFormProps) {
    const [pending, startTransition] = useTransition();
    const router = useRouter();
    const { triggerConfetti } = useConfetti();
    const [userCountry, setUserCountry] = useState<string>("India");

    useEffect(() => {
        const fetchUser = async () => {
            const { data: session } = await authClient.getSession();
            if (session?.user) {
                setUserCountry((session.user as any).country || "India");
            }
        };
        fetchUser();
    }, []);

    const currencyConfig = getCurrencyConfig(userCountry);

    // 1. Define your form.
    const form = useForm<CourseSchemaType>({
        resolver: zodResolver(courseSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            fileKey: "",
            price: 0,
            duration: 0,
            level: "Beginner",
            category: categories[0]?.name || "",
            status: "Draft",
            slug: "",
            smallDescription: "",
        },
    });

    // 2. Define a submit handler.
    function onSubmit(values: CourseSchemaType) {
        startTransition(async () => {
            const { data: result, error } = await tryCatch(CreateCourse(values));

            if (error) {
                toast.error("An unexpected error occurred. Please try again.");
                return;
            }

            if (result.status === "success") {
                toast.success(result.message);
                triggerConfetti();
                form.reset();
                if (result.data && result.data.id) {
                    router.push(`/teacher/courses/${result.data.id}/edit?tab=course-structure`);
                } else {
                    router.push("/teacher");
                }
            } else if (result.status === "error") {
                toast.error(result.message);
            }
        });
    }
    return (
        <>
            <div className="flex items-center gap-4">
                <Link
                    href="/teacher"
                    className={buttonVariants({
                        variant: "outline",
                        size: "icon",
                    })}
                >
                    <ArrowLeft className="size-4" />
                </Link>
                <h1 className="text-2xl font-bold">Create Courses</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                        Provide basic information about the course
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            className="space-y-6"
                            onSubmit={form.handleSubmit(onSubmit, (errors) => {
                                const invalidFields = Object.keys(errors).join(", ");
                                toast.error(`Please check the following fields: ${invalidFields}`);
                                console.log("Form errors:", errors);
                            })}
                        >

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Course Title" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-4 items-end">
                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Slug</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Slug" {...field} value={field.value as any} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="button"
                                    className="w-fit"
                                    onClick={() => {
                                        const titleValue = form.getValues("title");

                                        const slug = slugify(titleValue);

                                        form.setValue("slug", slug, { shouldValidate: true });
                                    }}
                                >
                                    Generate Slug <SparkleIcon className="ml-1" size={16} />
                                </Button>
                            </div>

                            <FormField
                                control={form.control}
                                name="smallDescription"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Small Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Small Description"
                                                className="min-h-[120px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField<CourseSchemaType>
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <RichTextEditor field={field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField<CourseSchemaType>
                                control={form.control}
                                name="fileKey"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Thumbnail image</FormLabel>
                                        <FormControl>
                                            <Uploader
                                                fileTypeAccepted="image"
                                                onChange={field.onChange}
                                                value={field.value as string}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField<CourseSchemaType>
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Category</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value as string}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.map((category) => (
                                                        <SelectItem key={category.id} value={category.name}>
                                                            {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField<CourseSchemaType>
                                    control={form.control}
                                    name="level"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Level</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value as string}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Value" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {courseLevels.map((category) => (
                                                        <SelectItem key={category} value={category}>
                                                            {category}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField<CourseSchemaType>
                                    control={form.control}
                                    name="duration"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Duration (hours)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Duration"
                                                    type="number"
                                                    {...field}
                                                    value={field.value as any}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField<CourseSchemaType>
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Price ({currencyConfig.code})</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                                                        {currencyConfig.symbol}
                                                    </span>
                                                    <Input 
                                                        placeholder={`Price in ${currencyConfig.code}`} 
                                                        type="number" 
                                                        className="pl-8"
                                                        {...field} 
                                                        value={field.value as any} 
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField<CourseSchemaType>
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Status</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value as string}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select Status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {courseStatus.map((category) => (
                                                    <SelectItem key={category} value={category}>
                                                        {category}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" disabled={pending}>
                                {pending ? (
                                    <>
                                        Creating...
                                        <Loader2 className="animate-spin ml-1" />
                                    </>
                                ) : (
                                    <>
                                        Create Course <PlusIcon className="ml-1" size={16} />
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    );
}
