import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './gallery-design.css';
import './usability.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Zutere — Seleção de fotos para fotógrafos',
  description: 'Galerias elegantes para selecionar, aprovar e entregar fotografias.',
  openGraph: {
    title: 'Zutere — Seleção de fotos para fotógrafos',
    description: 'Seu trabalho merece uma entrega à altura.',
    type: 'website',
    locale: 'pt_BR',
    images: [{ url: '/fotos/zutere-black.png', width: 1260, height: 354, alt: 'Zutere — Seu trabalho merece uma entrega à altura.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zutere — Seleção de fotos para fotógrafos',
    description: 'Seu trabalho merece uma entrega à altura.',
    images: ['/fotos/zutere-black.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
