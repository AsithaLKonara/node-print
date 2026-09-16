import './globals.css';

export const metadata = {
  title: 'Node-Print POS Demo',
  description: 'A Next.js POS UI demonstrating silent ESC/POS printing via node-print',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
