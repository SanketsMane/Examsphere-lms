import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

import Link from "next/link";
import { ReactNode } from "react";
import Logo from "@/public/logo.png";

// Login, OTP and password pages have nothing to rank for, and ?callbackUrl= links multiply them
// into duplicates. Keep them out of the index but let crawlers follow their links.
export const metadata: Metadata = {
  title: "Log in | ExamSphere",
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-svh">
      <Link
        href="/"
        className={buttonVariants({
          variant: "outline",
          className: "absolute top-4 left-4 z-50",
        })}
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
