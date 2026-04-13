import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata = {
  title: 'Careers by OneQik',
  description: 'Candidate-first career discovery with protected candidate and employer workflows.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
