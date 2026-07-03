import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "M Tech | Manutenções e Instalações Elétricas",
  description: "M Tech Manutenções Elétricas em Sorocaba. Instalações residenciais, comerciais e industriais de alta performance sob as normas NBR 5410 e NR 10.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${outfit.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
