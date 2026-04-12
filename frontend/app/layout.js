import './globals.css';

export const metadata = {
  title: 'OQ Career',
  description: 'Frontend foundation for candidate and employer flows',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
