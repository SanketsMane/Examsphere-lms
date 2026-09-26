import { redirect } from "next/navigation";

// Certificates & Awards were removed from the Student Portal at the client's request
// (BUG-0005). Old links land on My Courses instead.
export default function CertificatesPage() {
    redirect("/dashboard/courses");
}
