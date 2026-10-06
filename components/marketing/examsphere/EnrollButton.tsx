"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { withCallbackUrl } from "@/lib/callback-url";

interface EnrollButtonProps {
  /** Course category to open Browse Courses on; omit to show every course. */
  category?: string;
  className?: string;
  withArrow?: boolean;
  label?: string;
}

/**
 * Enroll → (login / sign up if needed) → Browse Courses, where the student enrolls.
 * Logged-out visitors go to /login carrying the courses page as `callbackUrl`, and the login and
 * signup pages send them back there afterwards (BUG-0001).
 */
export function EnrollButton({ category, className, withArrow = false, label = "Enroll Now" }: EnrollButtonProps) {
  const { data: session } = authClient.useSession();
  const coursesUrl = category ? `/courses?category=${encodeURIComponent(category)}` : "/courses";
  const href = session ? coursesUrl : withCallbackUrl("/login", coursesUrl);

  return (
    <Link href={href} className={className}>
      {label}
      {withArrow && <ArrowRight className="h-4 w-4" />}
    </Link>
  );
}
