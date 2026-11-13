import { Geist, Geist_Mono } from "next/font/google";
import ThemeProvider from "@/components/providers/ThemeProvider";
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
  title: "Next16 Template — Catálogo de Componentes",
  description: "Template Next.js 16 com biblioteca de componentes acessível e tematizada.",
};

const themeInitScript = `
(function () {
  try {
    var key = 'next16-template:theme';
    var saved = window.localStorage.getItem(key);
    var theme = saved === 'light' ? 'light' : 'dark';
    var root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    root.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
