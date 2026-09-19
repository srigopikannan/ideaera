import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050608" },
    { media: "(prefers-color-scheme: light)", color: "#f8f9fa" },
  ],
};

export const metadata: Metadata = {
  title: "Idea Era — Where Ideas Become Possibilities",
  description:
    "Idea Era is a platform where ideas meet people, possibilities and collaboration.",
  keywords: ["innovation", "hackathons", "collaborators", "startups", "open source", "ideas", "projects", "Idea Era"],
  openGraph: {
    title: "Idea Era — Where Ideas Become Possibilities",
    description: "Idea Era is a platform where ideas meet people, possibilities and collaboration.",
    siteName: "Idea Era",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary`}>
        {children}
      </body>
    </html>
  );
}
