import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import ToastContainer from '@/components/ui/Toast';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: {
    default: 'ARAE LMS',
    template: '%s - ARAE LMS',
  },
  description: 'Platform for all of your education.',
  icons: [
    {
      rel: 'icon',
      url: '/icon.svg',
      type: 'image/svg+xml',
    },
  ],
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
              (function() {
                try {
                  var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`} suppressHydrationWarning>
        <div suppressHydrationWarning>
          <Providers>
            {children}
            <div suppressHydrationWarning>
              <ToastContainer />
            </div>
          </Providers>
        </div>
      </body>
    </html>
  );
}
