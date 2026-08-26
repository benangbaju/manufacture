import type { Metadata, Viewport } from "next";
import Sidebar from "@/components/ui/Sidebar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manufaktur & Cash Flow App",
  description: "Aplikasi internal untuk cash flow, manufaktur & inventory tracking",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Manufaktur",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0f17",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('manufaktur_theme') || 'dark';
                document.documentElement.setAttribute('data-theme', t);
                document.documentElement.classList.add(t);
              } catch (e) {}
            `,
          }}
        />
      </head>

      <body suppressHydrationWarning>
        <ThemeProvider>
          <div className="flex flex-col min-h-screen md:flex-row">
            <Sidebar />
            <main className="flex-1 p-4 pb-24 md:ml-64 md:p-6 md:pb-6 bg-base">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

