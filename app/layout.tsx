import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Adlan Madjied Ridho | Website Profil & Portofolio",
  description:
    "Website resmi Adlan Madjied Ridho, mahasiswa Universitas Annuqayah & pengurus perpustakaan Lubangsa yang fokus pada teknologi website dan karya tulis literasi.",
  applicationName: "Adlan Madjied Ridho",

  // Kode verifikasi Google Search Console
  verification: {
    google: "lIZSil0X5Oo0RGTU3tl_Sd8WFLyDLcJ3txPTWAay57g",
  },

  // PWA & favicon
  manifest: "/icon/site.webmanifest",
  icons: {
    icon: [
      { url: "/icon/favicon.ico", sizes: "48x48" },
      { url: "/icon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/icon/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Adlan",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a6cf0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Menyisipkan CDN Font Awesome v6 secara global */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}