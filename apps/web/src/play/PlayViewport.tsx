"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { createDemoSource } from "./source/demoSource";

const Playground = dynamic(() => import("./Playground").then((module) => module.Playground), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="fixed inset-0 grid min-h-dvh place-items-center bg-[#0c0e0f] font-[family-name:var(--font-body)] text-sm text-[#edf3f5]"
    >
      Opening the office…
    </div>
  ),
});

/** The demo works in portrait and landscape; the room reframes itself to the space the HUD leaves. */
export function PlayViewport({ source }: { source: "demo" }) {
  const [consultationSource] = useState(() => {
    switch (source) {
      case "demo":
        return createDemoSource();
    }
  });
  return <Playground source={consultationSource} />;
}
