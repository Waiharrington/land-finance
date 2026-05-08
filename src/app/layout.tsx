import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Web3Provider } from "@/components/providers/Web3Provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "LAND Finance | Inversión en Tierras",
  description: "La plataforma defi de activos reales respaldada por tierras en Utah.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <Web3Provider>
          <Navbar />
          <main>{children}</main>
        </Web3Provider>
      </body>
    </html>
  );
}
