import Link from "next/link";
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { constructS3Url } from "@/lib/s3-utils";
import { getSiteSettings } from "@/app/data/settings/get-site-settings";
import { FooterQueryForm } from "./FooterQueryForm";

// Fallback contact details — replace with the client's real details (or set them in Site Settings).
const FALLBACK = {
  phone: "+91 00000 00000",
  email: "support@examsphere.online",
  address: "India",
  facebook: "#",
  instagram: "#",
  linkedin: "#",
  youtube: "#",
  twitter: "#",
};

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Programs", href: "/programs" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

const legalLinks = [
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms & Conditions", href: "/terms" },
  { name: "Refund Policy", href: "/refund" },
  { name: "Cookie Policy", href: "/cookies" },
];

export async function Footer() {
  const settings = await getSiteSettings();

  const phone = settings?.contactPhone?.trim() || FALLBACK.phone;
  const email = settings?.contactEmail?.trim() || FALLBACK.email;
  const address = settings?.contactAddress?.trim() || FALLBACK.address;

  const socials = [
    { name: "Instagram", href: settings?.instagram?.trim() || FALLBACK.instagram, Icon: Instagram },
    { name: "Facebook", href: settings?.facebook?.trim() || FALLBACK.facebook, Icon: Facebook },
    { name: "LinkedIn", href: settings?.linkedin?.trim() || FALLBACK.linkedin, Icon: Linkedin },
    { name: "YouTube", href: settings?.youtube?.trim() || FALLBACK.youtube, Icon: Youtube },
    { name: "Twitter", href: settings?.twitter?.trim() || FALLBACK.twitter, Icon: Twitter },
  ];

  const logoSrc =
    settings?.logo && settings.logo.trim() !== "" ? constructS3Url(settings.logo) : "/logo.png";
  const siteName = settings?.siteName || "ExamSphere";

  return (
    <footer className="bg-navy-950 text-slate-300">
      <div className="max-w-[1240px] mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.4fr] gap-10 lg:gap-8">
          {/* Brand + Contact */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-9 h-9">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoSrc} alt={siteName} className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-extrabold text-white font-display tracking-tight">
                {siteName}
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Expert guidance, smart strategies and personalized mentorship for JEE, NEET,
              Foundation and MBBS aspirants.
            </p>

            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
                <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-white transition-colors">
                  {phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white transition-colors break-all">
                  {email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
                <span>{address}</span>
              </li>
            </ul>

            <div className="flex gap-2.5 pt-1">
              {socials.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="h-9 w-9 rounded-full bg-white/[0.08] flex items-center justify-center text-white hover:bg-orange-500 hover:-translate-y-0.5 transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-5">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-orange-500 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold mb-5">Legal</h4>
            <ul className="space-y-3 text-sm">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-orange-500 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Query Box */}
          <div>
            <h4 className="text-white font-bold mb-5">Have a Query?</h4>
            <FooterQueryForm />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-[#060a15]">
        <div className="max-w-[1240px] mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>Copyright © 2026 {siteName}. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/refund" className="hover:text-white transition-colors">Refund</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
