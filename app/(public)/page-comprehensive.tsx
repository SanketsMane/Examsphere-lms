import { getSessionWithRole } from "../data/auth/require-roles";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowRight, BookOpen, Users, TrendingUp, Award, Play, Star, 
  Calendar, Clock, Eye, User, CheckIcon, Globe, Shield, Zap,
  Video, MessageSquare, Trophy, Target, Lightbulb, Headphones,
  FileText, BarChart3, Smartphone, Laptop, Tablet
} from "lucide-react";

const stats = [
  { icon: BookOpen, label: "Total Courses", value: "1000+" },
  { icon: Users, label: "Active Students", value: "50,000+" },
  { icon: Award, label: "Expert Instructors", value: "500+" },
  { icon: TrendingUp, label: "Success Rate", value: "95%" }
];

const features = [
  {
    icon: Video,
    title: "Live Interactive Sessions",
    description: "Join real-time classes with expert instructors, ask questions, and collaborate with peers worldwide."
  },
  {
    icon: BookOpen,
    title: "Comprehensive Course Library",
    description: "Access 1000+ courses across programming, business, design, and more with lifetime access."
  },
  {
    icon: MessageSquare,
    title: "AI-Powered Learning Assistant",
    description: "Get personalized recommendations and instant help with our intelligent tutoring system."
  },
  {
    icon: Trophy,
    title: "Certification & Badges",
    description: "Earn industry-recognized certificates and digital badges to showcase your achievements."
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Track your learning journey with detailed analytics and performance insights."
  },
  {
    icon: Globe,
    title: "Global Community",
    description: "Connect with learners worldwide, join study groups, and participate in coding challenges."
  }
];

const courseCategories = [
  { name: "Programming & Development", icon: "💻", courses: 245, popular: true },
  { name: "Business & Marketing", icon: "📈", courses: 132, popular: false },
  { name: "Design & Creative", icon: "🎨", courses: 98, popular: true },
  { name: "Data Science & AI", icon: "🤖", courses: 87, popular: true },
  { name: "Health & Fitness", icon: "💪", courses: 64, popular: false },
  { name: "Language Learning", icon: "🌍", courses: 156, popular: false },
  { name: "Photography & Video", icon: "📸", courses: 78, popular: false },
  { name: "Music & Arts", icon: "🎵", courses: 89, popular: false }
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Full-Stack Developer",
    image: "👩‍💻",
    rating: 5,
    text: "EXAMSPHERE transformed my career! The interactive coding sessions and real-world projects helped me land my dream job at a tech company."
  },
  {
    name: "Michael Chen",
    role: "Digital Marketing Manager",
    image: "👨‍💼",
    rating: 5,
    text: "The business courses are incredibly practical. I implemented the strategies immediately and saw a 40% increase in our marketing ROI."
  },
  {
    name: "Emma Davis",
    role: "UX Designer",
    image: "👩‍🎨",
    rating: 5,
    text: "The design bootcamp exceeded my expectations. The mentorship program and portfolio reviews were invaluable for my career growth."
  }
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Access to 50+ free courses",
      "Basic progress tracking",
      "Community forum access",
      "Mobile app access"
    ],
    popular: false
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    features: [
      "Access to all 1000+ courses",
      "Live interactive sessions",
      "AI learning assistant",
      "Certificates & badges",
      "Priority support",
      "Offline downloads"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "per month",
    features: [
      "Everything in Pro",
      "Team management tools",
      "Advanced analytics",
      "Custom learning paths",
      "Dedicated account manager",
      "API access"
    ],
    popular: false
  }
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
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem',
        overflow: 'hidden'
      }}>
        {/* Floating Elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '100px',
          height: '100px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: '150px',
          height: '150px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>
        
        <div style={{ maxWidth: '1200px', width: '100%', textAlign: 'center', zIndex: 10 }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '999px',
            padding: '0.75rem 1.5rem',
            fontSize: '0.9rem',
            color: 'white',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)'
          }}>
            🚀 Trusted by 50,000+ learners worldwide
          </div>
          
          <h1 style={{
            fontSize: 'clamp(3rem, 10vw, 6rem)',
            fontWeight: '800',
            color: 'white',
            marginBottom: '1.5rem',
            lineHeight: '1.1',
            textShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            Master Skills That
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #ffeaa7, #fab1a0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Matter</span>
          </h1>
          
          <p style={{
            fontSize: '1.4rem',
            color: 'rgba(255,255,255,0.9)',
            marginBottom: '3rem',
            maxWidth: '700px',
            margin: '0 auto 3rem auto',
            lineHeight: '1.6'
          }}>
            Join EXAMSPHERE, the world's most comprehensive learning platform. Learn from industry experts, 
            get certified, and advance your career with hands-on projects and real-world experience.
          </p>
          
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
            <Link
              href="/register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.2rem 2.5rem',
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#667eea',
                backgroundColor: 'white',
                borderRadius: '50px',
                textDecoration: 'none',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease',
                border: 'none'
              }}
            >
              Start Learning Free
              <ArrowRight style={{ marginLeft: '0.5rem', height: '1.5rem', width: '1.5rem' }} />
            </Link>
            
            <Link
              href="/courses"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.2rem 2.5rem',
                fontSize: '1.2rem',
                fontWeight: '600',
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '50px',
                textDecoration: 'none',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
            >
              <Play style={{ marginRight: '0.5rem', height: '1.2rem', width: '1.2rem' }} />
              Watch Demo
            </Link>
          </div>

          {/* Trust Indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.9rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star style={{ color: '#ffd700', fill: '#ffd700', width: '1rem', height: '1rem' }} />
              <span>4.9/5 Rating</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield style={{ width: '1rem', height: '1rem' }} />
              <span>Certified Courses</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe style={{ width: '1rem', height: '1rem' }} />
              <span>Available Worldwide</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{
        padding: '5rem 2rem',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            textAlign: 'center'
          }}>
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} style={{
                  padding: '2rem',
                  backgroundColor: 'white',
                  borderRadius: '1rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'transform 0.3s ease'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '4rem',
                    height: '4rem',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    borderRadius: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <Icon style={{ height: '2rem', width: '2rem', color: 'white' }} />
                  </div>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    marginBottom: '0.5rem'
                  }}>
                    {stat.value}
                  </div>
                  <div style={{ color: '#6b7280', fontWeight: '500', fontSize: '1.1rem' }}>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '6rem 2rem',
        backgroundColor: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Why Choose EXAMSPHERE?
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#6b7280',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              We're not just another online learning platform. We're your partner in professional growth.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} style={{
                  padding: '2.5rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '1.5rem',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '3.5rem',
                    height: '3.5rem',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    borderRadius: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <Icon style={{ height: '1.8rem', width: '1.8rem', color: 'white' }} />
                  </div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '1rem'
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    color: '#6b7280',
                    lineHeight: '1.6',
                    fontSize: '1rem'
                  }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Course Categories */}
      <section style={{
        padding: '6rem 2rem',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Explore Our Course Categories
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#6b7280',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              From beginner to expert level, we have courses for every skill level and interest.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {courseCategories.map((category, index) => (
              <div key={index} style={{
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '1rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                border: category.popular ? '2px solid #667eea' : '1px solid #e2e8f0',
                position: 'relative',
                transition: 'all 0.3s ease'
              }}>
                {category.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-0.5rem',
                    right: '1rem',
                    backgroundColor: '#667eea',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    POPULAR
                  </div>
                )}
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  {category.icon}
                </div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  {category.name}
                </h3>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.9rem'
                }}>
                  {category.courses} courses available
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link
              href="/courses"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: 'white',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              Browse All Courses
              <ArrowRight style={{ marginLeft: '0.5rem', height: '1.2rem', width: '1.2rem' }} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{
        padding: '6rem 2rem',
        backgroundColor: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              What Our Students Say
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#6b7280',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Join thousands of successful learners who transformed their careers with EXAMSPHERE.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {testimonials.map((testimonial, index) => (
              <div key={index} style={{
                padding: '2.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '1.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  marginBottom: '1rem'
                }}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} style={{ 
                      width: '1.2rem', 
                      height: '1.2rem', 
                      color: '#fbbf24',
                      fill: '#fbbf24'
                    }} />
                  ))}
                </div>
                <p style={{
                  fontSize: '1.1rem',
                  color: '#374151',
                  lineHeight: '1.6',
                  marginBottom: '1.5rem',
                  fontStyle: 'italic'
                }}>
                  "{testimonial.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    fontSize: '2.5rem',
                    width: '3rem',
                    height: '3rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '50%'
                  }}>
                    {testimonial.image}
                  </div>
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '0.25rem'
                    }}>
                      {testimonial.name}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{
        padding: '6rem 2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '1rem'
            }}>
              Choose Your Learning Path
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: 'rgba(255,255,255,0.9)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Start free and upgrade as you grow. No hidden fees, cancel anytime.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            alignItems: 'stretch'
          }}>
            {pricingPlans.map((plan, index) => (
              <div key={index} style={{
                padding: '2.5rem',
                backgroundColor: 'white',
                borderRadius: '1.5rem',
                position: 'relative',
                boxShadow: plan.popular ? '0 20px 40px rgba(0,0,0,0.3)' : '0 10px 25px rgba(0,0,0,0.15)',
                transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                border: plan.popular ? '3px solid #fbbf24' : 'none'
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-1rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#fbbf24',
                    color: 'white',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '999px',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '1rem'
                  }}>
                    {plan.name}
                  </h3>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '3rem',
                      fontWeight: 'bold',
                      color: '#667eea'
                    }}>
                      {plan.price}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '1rem' }}>
                      /{plan.period}
                    </span>
                  </div>
                </div>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  marginBottom: '2rem'
                }}>
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '1rem',
                      color: '#374151'
                    }}>
                      <CheckIcon style={{ 
                        width: '1.2rem', 
                        height: '1.2rem', 
                        color: '#10b981',
                        flexShrink: 0
                      }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    textAlign: 'center',
                    color: plan.popular ? 'white' : '#667eea',
                    backgroundColor: plan.popular ? '#667eea' : 'transparent',
                    border: `2px solid #667eea`,
                    borderRadius: '0.75rem',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '6rem 2rem',
        backgroundColor: '#1f2937',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '1.5rem'
          }}>
            Ready to Transform Your Future?
          </h2>
          <p style={{
            fontSize: '1.3rem',
            color: '#d1d5db',
            marginBottom: '3rem',
            lineHeight: '1.6'
          }}>
            Join EXAMSPHERE today and start your journey towards mastering the skills that matter. 
            With our expert instructors, interactive learning, and supportive community, 
            success is just a click away.
          </p>
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link
              href="/register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.25rem 3rem',
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#1f2937',
                backgroundColor: 'white',
                borderRadius: '50px',
                textDecoration: 'none',
                boxShadow: '0 10px 30px rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease'
              }}
            >
              Start Your Free Trial
              <ArrowRight style={{ marginLeft: '0.75rem', height: '1.5rem', width: '1.5rem' }} />
            </Link>
            <Link
              href="/courses"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.25rem 3rem',
                fontSize: '1.2rem',
                fontWeight: '600',
                color: 'white',
                backgroundColor: 'transparent',
                border: '2px solid white',
                borderRadius: '50px',
                textDecoration: 'none',
                transition: 'all 0.3s ease'
              }}
            >
              Browse Courses
            </Link>
          </div>
          
          <div style={{
            marginTop: '3rem',
            padding: '1.5rem',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '1rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <p style={{
              color: '#d1d5db',
              fontSize: '0.95rem',
              margin: 0
            }}>
              💡 <strong>No risk:</strong> Start with our free plan. Upgrade anytime. Cancel anytime. 
              30-day money-back guarantee on all paid plans.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}