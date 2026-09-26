import { getSiteSettings } from "./get-site-settings";

export type SocialNetwork = "instagram" | "linkedin" | "x" | "facebook" | "youtube";

/**
 * ExamSphere's public contact details, from Admin → Settings.
 *
 * Anything not filled in is left out rather than replaced with a placeholder: the site used to
 * show "+91 00000 00000" and social icons linking to "#" (BUG-0002). The email falls back to
 * CONTACT_EMAIL, the inbox contact-form enquiries are delivered to.
 */
export async function getContactDetails() {
  const settings = await getSiteSettings();
  const clean = (v: string | null | undefined) => {
    const t = v?.trim();
    return t && t !== "#" ? t : null;
  };

  const socials = (
    [
      { network: "instagram", name: "Instagram", href: clean(settings?.instagram) },
      { network: "linkedin", name: "LinkedIn", href: clean(settings?.linkedin) },
      { network: "x", name: "X", href: clean(settings?.twitter) },
      { network: "facebook", name: "Facebook", href: clean(settings?.facebook) },
      { network: "youtube", name: "YouTube", href: clean(settings?.youtube) },
    ] as const
  ).filter((s): s is typeof s & { href: string } => !!s.href);

  return {
    phone: clean(settings?.contactPhone),
    email:
      clean(settings?.contactEmail) ??
      clean(process.env.CONTACT_EMAIL) ??
      "support@examsphere.online",
    address: clean(settings?.contactAddress),
    socials,
  };
}
