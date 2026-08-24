import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'English Light Verbs',
  description: 'Gere cards de inglês para estudar no Anki.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
