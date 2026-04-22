import { Outfit } from 'next/font/google';
import './globals.css';
import './design-presets.css';
import ThemeProvider from '@/components/ThemeProvider';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata = {
  title: 'Careers by OneQik',
  description: 'Candidate-first career discovery with protected candidate and employer workflows.',
};

export default function RootLayout({ children }) {
  return (
    <html className={outfit.variable} lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
