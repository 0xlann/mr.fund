import type { Metadata } from "next";
import localFont from "next/font/local";
import { PlayViewport } from "../../play/PlayViewport";
import "./tailwind.css";

const bodyFont = localFont({
  src: "../../../public/play/instrument-sans-variable.ttf",
  weight: "400 700",
  variable: "--font-body",
  display: "swap",
});
const displayFont = localFont({
  src: "../../../public/play/bricolage-grotesque-variable.ttf",
  weight: "200 800",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The office · Mr.Fund",
  description: "Meet your money's new plus-one. An interactive, simulated Mr.Fund demo.",
  robots: { index: false, follow: false },
};

export default function PlayPage() {
  return (
    <div className={`${bodyFont.variable} ${displayFont.variable}`}>
      <PlayViewport />
    </div>
  );
}
