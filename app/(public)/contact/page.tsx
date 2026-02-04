import { redirect } from "next/navigation";

export default function ContactPage() {
    // Redirect to help page for now, or we can create a simple contact form.
    // The user mentioned 404 errors, so a redirect is a quick fix to avoid the error.
    redirect("/dashboard/help");
}
