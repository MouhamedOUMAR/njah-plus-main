import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeProvider from "@/components/shared/ThemeProvider";
import { LanguageProvider } from "@/components/shared/LanguageProvider";
import { APP_DESCRIPTION, APP_ICON_32, APP_ICON_192, APP_ICON_512, APPLE_ICON, APP_NAME } from "@/constants";

export const viewport: Viewport = {
  themeColor: '#0E7490',
}

export const metadata: Metadata = {
  title:           APP_NAME,
  applicationName: APP_NAME,
  description:     APP_DESCRIPTION,
  appleWebApp: {
    capable:        true,
    title:          APP_NAME,
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: APP_ICON_32, sizes: '32x32', type: 'image/png' },
      { url: APP_ICON_192, sizes: '192x192', type: 'image/png' },
      { url: APP_ICON_512, sizes: '512x512', type: 'image/png' },
    ],
    shortcut: APP_ICON_32,
    apple: APPLE_ICON,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <head>
        {/* Hard fallback for iOS Safari — do not remove */}
        <link rel="apple-touch-icon" href={APPLE_ICON} />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="application-name" content={APP_NAME} />
        <link rel="manifest" href="/manifest.webmanifest" />
        {/* Blocking script: apply saved theme before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('bac-theme') || 'system';
                  var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (dark) document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
        {/* Blocking script: apply saved language before first paint to avoid RTL flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var lang = localStorage.getItem('app-language') || 'fr';
                  document.documentElement.lang = lang;
                  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
