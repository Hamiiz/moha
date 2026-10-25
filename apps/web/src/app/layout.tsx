import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://moha-web.fly.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Moha Driving School – G2 & G Lessons in West Toronto",
    template: "%s | Moha Driving School",
  },
  description:
    "MTO driving instructor in West Toronto. 94% first-attempt pass rate, free door pickup, dual-control car & real DriveTest route practice.",
  keywords: [
    "driving school West Toronto",
    "driving instructor West Toronto",
    "G2 road test West Toronto",
    "G road test lessons Toronto",
    "West Toronto driving lessons",
    "Etobicoke driving lessons",
    "Moha driving school",
    "door to door driving lessons West Toronto",
    "Downsview DriveTest route practice",
    "Etobicoke DriveTest practice",
    "Metro East DriveTest practice",
    "beginner driving lessons GTA",
  ],
  authors: [{ name: "Moha Driving School" }],
  creator: "Moha Driving School",
  publisher: "Moha Driving School",
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Moha Driving School",
    description:
      "MTO driving instructor in West Toronto. 94% pass rate, dual-control car, and real DriveTest route prep.",
    url: SITE_URL,
    siteName: "Moha Driving School",
    locale: "en_CA",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Moha Driving School – West Toronto Driving Lessons",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moha Driving School – Pass Your Road Test First Try",
    description:
      "G2 & G road test prep in West Toronto. 94% first-attempt pass rate and free door-to-door pickup.",
    images: [`${SITE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "geo.region": "CA-ON",
    "geo.placename": "West Toronto",
    "geo.position": "43.6416;-79.4172",
    ICBM: "43.6416, -79.4172",
  },
  icons: {
    icon: "/icon.svg",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["DrivingSchool", "LocalBusiness"],
  name: "Moha Driving School",
  description:
    "Certified MTO driving instructor providing G2 and G road test preparation, beginner lessons, and refresher courses across West Toronto and the GTA.",
  url: SITE_URL,
  telephone: "+1-647-912-7040",
  priceRange: "$$",
  currenciesAccepted: "CAD",
  paymentAccepted: "Cash, e-Transfer",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1002 King Street West",
    addressLocality: "Toronto",
    addressRegion: "ON",
    postalCode: "M6K 1J7",
    addressCountry: "CA",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 43.6416,
    longitude: -79.4172,
  },
  areaServed: [
    { "@type": "City", name: "West Toronto" },
    { "@type": "City", name: "Etobicoke" },
    { "@type": "City", name: "Toronto" },
    { "@type": "City", name: "North York" },
    { "@type": "City", name: "York" },
  ],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "18:00",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "85",
    bestRating: "5",
    worstRating: "1",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Driving Instruction Packages",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "G2 Road Test Preparation",
          description: "Intensive 90-minute road test preparation on real West Toronto and GTA DriveTest routes.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "G Road Test Highway Prep",
          description: "Highway merging, speed management, and mock test scoring for G licence test.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Beginner Driving Lessons",
          description: "Dual-control vehicle foundational driver training for new G1 drivers.",
        },
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
