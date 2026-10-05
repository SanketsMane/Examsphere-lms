"use client";

import { PublicCourseType } from "@/app/data/course/get-all-courses";
import { Badge } from "@/components/ui/badge";
import { buttonVariants, Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { TimerIcon, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket
import { useCurrency } from "@/components/providers/CurrencyProvider";

interface iAppProps {
  data: PublicCourseType;
  userCountry?: string | null; // Added for localization - Author: Sanket
  /**
   * When set, enrolled courses link to `${hrefBase}/${slug}` — the student portal uses
   * "/dashboard" so enrolled students land in their course player. Courses the student hasn't
   * bought still open the public course page, where the price and Enroll button are.
   */
  hrefBase?: string;
}

import { motion } from "framer-motion";

export function PublicCourseCard({ data, userCountry, hrefBase }: iAppProps) {
  const { rates } = useCurrency();
  const thumbnailUrl = useConstructUrl(data.fileKey || "");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isBestSeller = (data as any).totalStudents > 1000;
  const continueHref =
    data.isEnrolled && data.firstChapterId
      ? `/courses/${data.slug}/chapters/${data.firstChapterId}`
      : null;
  const courseHref =
    hrefBase && data.isEnrolled ? `${hrefBase}/${data.slug}` : continueHref ?? `/courses/${data.slug}`;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94]
          }
        }
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      className="bg-white dark:bg-card rounded-[2rem] p-4 shadow-md border-2 border-gray-200 dark:border-gray-800 hover:shadow-2xl hover:border-primary/20 transition-all duration-300 h-full flex flex-col group"
    >
      {/* Thumbnail Section */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.5rem] mb-4">
        <Image
          src={thumbnailUrl}
          alt={data.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {isBestSeller && (
            <Badge className="bg-yellow-400 text-yellow-950 hover:bg-yellow-500 font-bold shadow-sm border-0">
              Bestseller
            </Badge>
          )}
        </div>

        {/* Hover Overlay Actions */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-20">
          {continueHref ? (
            <Link href={courseHref}>
              <Button variant="default" size="sm" className="font-bold shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-emerald-600 hover:bg-emerald-700">
                <Play className="w-4 h-4 mr-2" />
                Continue
              </Button>
            </Link>
          ) : (
            <Link href={courseHref}>
              <Button variant="secondary" size="sm" className="font-bold shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                View Details
              </Button>
            </Link>
          )}
        </div>

        {/* Level Badge */}
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="secondary" className="bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm font-semibold">
            {data.level}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col flex-1 px-1 gap-2">
        <div className="flex items-center text-xs font-medium mb-1">
          <Badge variant="outline" className="border-gray-200 text-gray-500 font-normal">
            {data.category}
          </Badge>
        </div>

        {/* Title */}
        <Link
          href={courseHref}
          className="font-bold text-[#011E21] dark:text-white text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors"
        >
          {data.title}
        </Link>

        {!!data.duration && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium mt-1">
            <div className="flex items-center gap-1.5">
              <TimerIcon className="w-4 h-4" />
              <span>{data.duration}h</span>
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-end">
          <span className="text-xl font-bold text-[#011E21] dark:text-white">
            {data.isEnrolled ? (
              <span className="text-emerald-600 text-sm">Owned</span>
            ) : (
              formatPriceSimple(data.price || 0, userCountry, rates)
            )}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function PublicCourseCardSkeleton() {
  return (
    <Card className="group relative py-0 gap-0">
      <div className="absolute top-2 right-2 z-10 flex items-center ">
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="w-full relative h-fit">
        <Skeleton className="w-full rounded-t-xl aspect-video" />
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>

        <div className="mt-4 flex items-center gap-x-5">
          <div className="flex items-center gap-x-2">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex items-center gap-x-2">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>

        <Skeleton className="mt-4 w-full h-10 rounded-md" />
      </CardContent>
    </Card>
  );
}
