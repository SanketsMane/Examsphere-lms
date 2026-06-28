import { getSessionWithRole } from "../data/auth/require-roles";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, Users, TrendingUp, Award } from "lucide-react";

const stats = [
  { icon: BookOpen, label: "Total Courses", value: "1000+" },
  { icon: Users, label: "Active Students", value: "50,000+" },
  { icon: Award, label: "Expert Instructors", value: "500+" },
  { icon: TrendingUp, label: "Success Rate", value: "95%" }
];

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
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #dbeafe 0%, #c7d2fe 50%, #e0e7ff 100%)',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '1200px', width: '100%', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #3b82f6',
            borderRadius: '999px',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            ✨ Transform Your Future with Learning
          </div>
          
          <h1 style={{
            fontSize: 'clamp(2rem, 8vw, 5rem)',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #2563eb, #4f46e5, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1.5rem',
            lineHeight: '1.1'
          }}>
            Welcome to EXAMSPHERE
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            color: '#4b5563',
            marginBottom: '3rem',
            maxWidth: '600px',
            margin: '0 auto 3rem auto',
            lineHeight: '1.6'
          }}>
            Join thousands of learners worldwide and unlock your potential with our comprehensive courses taught by industry experts.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/courses"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem 2rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'white',
                backgroundColor: '#2563eb',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.3s ease',
                border: 'none'
              }}
            >
              Explore Courses
              <ArrowRight style={{ marginLeft: '0.5rem', height: '1.25rem', width: '1.25rem' }} />
            </Link>
            
            <Link
              href="/register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem 2rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#2563eb',
                backgroundColor: 'white',
                border: '2px solid #3b82f6',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease'
              }}
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{
        padding: '4rem 2rem',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderTop: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            textAlign: 'center'
          }}>
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} style={{ padding: '1.5rem' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '5rem',
                    height: '5rem',
                    background: 'linear-gradient(135deg, #3b82f6, #4f46e5)',
                    borderRadius: '1.5rem',
                    marginBottom: '1rem',
                    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)'
                  }}>
                    <Icon style={{ height: '2.5rem', width: '2.5rem', color: 'white' }} />
                  </div>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: '#111827',
                    marginBottom: '0.5rem'
                  }}>
                    {stat.value}
                  </div>
                  <div style={{ color: '#4b5563', fontWeight: '500', fontSize: '1.1rem' }}>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section style={{
        padding: '5rem 2rem',
        background: 'linear-gradient(135deg, #2563eb, #4f46e5, #7c3aed)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '1.5rem'
          }}>
            Ready to Start Learning?
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '2.5rem',
            lineHeight: '1.6'
          }}>
            Join our community of learners and start your journey today.
          </p>
          <Link
            href="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.25rem 2.5rem',
              fontSize: '1.2rem',
              fontWeight: '600',
              backgroundColor: 'white',
              color: '#2563eb',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
              border: 'none'
            }}
          >
            Get Started Now
            <ArrowRight style={{ marginLeft: '0.5rem', height: '1.5rem', width: '1.5rem' }} />
          </Link>
        </div>
      </section>
    </div>
  );
}