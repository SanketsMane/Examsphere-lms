import type { Metadata } from "next";
import { ReactNode } from "react";

// The signup pages are client components, so their metadata lives here. Not indexed for the
// same reason as the login pages.
export const metadata: Metadata = {
  title: "Create your account | ExamSphere",
  robots: { index: false, follow: true },
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
