import { AdminCourseType } from "@/app/data/admin/admin-get-courses";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useConstructUrl } from "@/hooks/use-construct-url";
import {
    ArrowRight,
    Eye,
    MoreVertical,
    Pencil,
    School,
    TimerIcon,
    Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket
import { useState, useEffect } from "react";

interface iAppProps {
    data: AdminCourseType;
}

export function TeacherCourseCard({ data }: iAppProps) {
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

    const thumbnailUrl = useConstructUrl(data.fileKey ?? "");
    return (
        <Card className="group relative py-0 gap-0">
            {/* absolute dropdrown */}
            <div className="absolute top-2 right-2 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon">
                            <MoreVertical className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                            <Link href={`/teacher/courses/${data.id}/edit`}>
                                <Pencil className="size-4 mr-2" />
                                Edit Course
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/courses/${data.slug}`}>
                                <Eye className="size-4 mr-2" />
                                Preview
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {data.fileKey ? (
                <Image
                    src={thumbnailUrl}
                    alt={data.title}
                    width={600}
                    height={400}
                    className="w-full rounded-t-lg aspect-video h-full object-cover"
                />
            ) : (
                <div className="w-full rounded-t-lg aspect-video h-full object-cover bg-muted flex items-center justify-center">
                    <School className="size-10 text-muted-foreground" />
                </div>
            )}

            <CardContent className="p-4">
                <Link
                    href={`/teacher/courses/${data.id}/edit`}
                    className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
                >
                    {data.title}
                </Link>

                <p className="line-clamp-2 text-sm text-muted-foreground leading-tight mt-2">
                    {data.smallDescription}
                </p>

                <div className="mt-4 flex items-center gap-x-5">
                    <div className="flex items-center gap-x-2">
                        <TimerIcon className="size-6 p-1 rounded-md text-primary bg-primary/10" />
                        <p className="text-sm text-muted-foreground">{data.duration}h</p>
                    </div>
                    <div className="flex items-center gap-x-2">
                        <School className="size-6 p-1 rounded-md text-primary bg-primary/10" />
                        <p className="text-sm text-muted-foreground">{data.level}</p>
                    </div>
                </div>
                <div className="mt-2 text-lg font-semibold text-primary">
                    {formatPriceSimple(data.price || 0, userCountry)}
                </div>

                <Link
                    className={buttonVariants({
                        className: "w-full mt-4",
                    })}
                    href={`/teacher/courses/${data.id}/edit`}
                >
                    Edit Course <ArrowRight className="size-4" />
                </Link>
            </CardContent>
        </Card>
    );
}
