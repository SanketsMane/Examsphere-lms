import { getSessionWithRole } from "../data/auth/require-roles";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSessionWithRole();
  
  if (session) {
    if ((session.user as any).role === "admin") {
      redirect("/admin");
    }
    if ((session.user as any).role === "teacher") {
      redirect("/teacher");
    }
    if ((session.user as any).role === null || (session.user as any).role === undefined) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to EXAMSPHERE
        </h1>
        <p className="text-lg text-center text-gray-600">
          Transform Your Future with Learning
        </p>
      </div>
    </div>
  );
}