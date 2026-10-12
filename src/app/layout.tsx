import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "DentistApp · Prototipo", description: "Demo clínica con datos ficticios", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
