import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  MapPin,
  Phone,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { constructS3Url } from "@/lib/s3-utils";

const defaultFooterLinks = {
  learn: [
    { name: "Find Tutors", href: "/find-teacher" },
    { name: "Online Courses", href: "/courses" },
    { name: "Group Classes", href: "/live-sessions" },
  ],
  teach: [
    { name: "Become a Tutor", href: "/register/teacher" },
    { name: "Teacher Rules", href: "/terms" },
    { name: "Success Stories", href: "/testimonials-demo" },
    { name: "Teacher Verification", href: "/teacher/verification" },
  ],
  support: [
    { name: "Help Center", href: "/help" },
    { name: "Contact Us", href: "/contact" },
    { name: "FAQs", href: "/faq" },
    { name: "Report Issue", href: "/report" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Careers", href: "/careers" },
    { name: "Blog", href: "/blog" },
    { name: "Privacy Policy", href: "/privacy" },
  ],
};

import { getSiteSettings } from "@/app/data/settings/get-site-settings";

// ... existing imports ...

export async function Footer() {
  const settings = await getSiteSettings();
  const footerLinks = settings?.footerLinks ? (settings.footerLinks as any) : defaultFooterLinks;
  
  // Construct proper logo URL from S3 key if needed
  const logoSrc = settings?.logo && settings.logo.trim() !== ""
    ? (settings.logo.startsWith('http') ? settings.logo : constructS3Url(settings.logo))
    : "/logo.png";

  return (
    <footer className="bg-[#0b1120] text-slate-300 border-t border-slate-800/50 font-sans">


      {/* Main Links Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                  <Image 
                    src={logoSrc} 
                    alt={settings?.siteName || "KIDOKOOL"} 
                    fill 
                    className="object-contain" 
                  />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">{settings?.siteName || "KIDOKOOL"}</span>
            </Link>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              The world's leading online learning platform. Join millions of learners and instructors gathering to master new skills.
            </p>

            <div className="flex items-center gap-4 text-sm text-slate-400 pt-4">
              {settings?.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{settings.contactPhone}</span>
                </div>
              )}
              {settings?.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>{settings.contactEmail}</span>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-2">
              {settings?.facebook && (
                <Link href={settings.facebook} target="_blank" className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all cursor-pointer">
                  <Facebook className="h-5 w-5" />
                </Link>
              )}
              {settings?.twitter && (
                <Link href={settings.twitter} target="_blank" className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all cursor-pointer">
                  <Twitter className="h-5 w-5" />
                </Link>
              )}
              {settings?.instagram && (
                <Link href={settings.instagram} target="_blank" className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all cursor-pointer">
                  <Instagram className="h-5 w-5" />
                </Link>
              )}
              {settings?.youtube && (
                <Link href={settings.youtube} target="_blank" className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all cursor-pointer">
                  <Youtube className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-white font-bold mb-6">Learn</h4>
              <ul className="space-y-3 text-sm">
                {footerLinks.learn.map((link: any) => (
                  <li key={link.name}>
                    <Link href={link.href} className="hover:text-primary transition-colors block py-1">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Teach</h4>
              <ul className="space-y-3 text-sm">
                {footerLinks.teach.map((link: any) => (
                  <li key={link.name}>
                    <Link href={link.href} className="hover:text-primary transition-colors block py-1">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-3 text-sm">
                {footerLinks.company.map((link: any) => (
                  <li key={link.name}>
                    <Link href={link.href} className="hover:text-primary transition-colors block py-1">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800 bg-[#060a15]">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} KidoKool. All rights reserved. <span className="ml-2 text-slate-600">v1.0.1</span></p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}