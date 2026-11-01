import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata = {
  title: {
    default: "cvopencode - vídeos com modelos abertos",
    template: "%s | cvopencode",
  },
  description:
    "Crie vídeos com IA usando OpenCode e modelos abertos. Conteúdo sincroniza no Neon; mídia fica no seu dispositivo.",
  applicationName: "cvopencode",
  openGraph: {
    title: "cvopencode - vídeos com modelos abertos",
    description:
      "Crie vídeos com IA usando OpenCode e modelos abertos. Conteúdo sincroniza no Neon; mídia fica no seu dispositivo.",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfd" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1f" },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem("cvopencode-theme");var m=window.matchMedia("(prefers-color-scheme: dark)").matches;if(t==="dark"||(!t&&m)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
