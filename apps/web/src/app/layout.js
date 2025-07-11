import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Cuaderno de Campo GPS",
  description: "Sistema integral de gestión agrícola con GPS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="bg-green-600 text-white p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">🌾 Cuaderno de Campo GPS</h1>
            <div className="space-x-4">
              <a href="/" className="hover:text-green-200">Dashboard</a>
              <a href="/parcelas" className="hover:text-green-200">Parcelas</a>
              <a href="/actividades" className="hover:text-green-200">Actividades</a>
              <a href="/mapa" className="hover:text-green-200">Mapa</a>
              <a href="/sigpac" className="hover:text-green-200">SIGPAC</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
