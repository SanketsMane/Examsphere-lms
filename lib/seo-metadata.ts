import type { Metadata } from "next";

/**
 * Gives a page complete social tags from its own metadata. A page-level `openGraph` replaces the
 * root one entirely (including the default image), so every field is set here: og:url matches the
 * canonical, title/description are the page's own, and the default /opengraph-image is attached.
 */
export function withSocial(meta: Metadata): Metadata {
  const url = typeof meta.alternates?.canonical === "string" ? meta.alternates.canonical : undefined;
  const title = typeof meta.title === "string" ? meta.title : undefined;
  const description = meta.description ?? undefined;

  return {
    ...meta,
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: "ExamSphere",
      ...(url ? { url } : {}),
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      images: ["/opengraph-image"],
      ...meta.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      images: ["/opengraph-image"],
      ...meta.twitter,
    },
  };
}
