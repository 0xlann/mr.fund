"use client";

import { RotateCw, Smartphone } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

export const PHONE_PORTRAIT_QUERY =
  "(pointer: coarse) and (max-width: 767px) and (orientation: portrait)";
const Playground = dynamic(() => import("./Playground").then((module) => module.Playground), {
  ssr: false,
});

/** Check orientation before mounting the office; later rotations preserve the current demo session. */
export function PlayViewport() {
  const [checked, setChecked] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(PHONE_PORTRAIT_QUERY);
    const update = () => {
      setBlocked(query.matches);
      if (!query.matches) setEntered(true);
      setChecked(true);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return (
    <>
      {entered && (
        <div inert={blocked} aria-hidden={blocked} className={blocked ? "hidden" : "contents"}>
          <Playground />
        </div>
      )}
      {!checked && (
        <div
          role="status"
          className="fixed inset-0 grid min-h-dvh place-items-center bg-[#244d57] font-[family-name:var(--font-body)] text-sm text-[#fff8e7]"
        >
          Opening the office…
        </div>
      )}
      {checked && blocked && (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="rotate-office-title"
          className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center gap-7 bg-[#244d57] px-7 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(32px,env(safe-area-inset-top))] text-center font-[family-name:var(--font-body)] text-[#fff8e7]"
        >
          <span className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-1.5px]">
            mr.fund
          </span>
          <div
            aria-hidden="true"
            className="relative grid size-32 place-items-center rounded-full border-2 border-[#fff8e74d] bg-[#315e68]"
          >
            <Smartphone size={62} strokeWidth={1.5} className="rotate-90 text-[#dbf884]" />
            <RotateCw
              size={30}
              strokeWidth={1.8}
              className="absolute -right-1 top-0 rounded-full bg-[#244d57] p-1 text-[#fff8e7]"
            />
          </div>
          <div className="max-w-xs space-y-3">
            <h1
              id="rotate-office-title"
              className="font-[family-name:var(--font-display)] text-[36px] font-bold leading-[1.08] tracking-[-1.5px]"
            >
              A little more room
              <br />
              for your money.
            </h1>
            <p className="text-sm leading-relaxed text-[#e2ece5]">
              Rotate your phone to landscape to step into Mr.Fund’s office.
            </p>
          </div>
          <span className="rounded-full border border-[#dbf88466] px-4 py-2 text-xs font-semibold text-[#dbf884]">
            The office opens automatically when you rotate.
          </span>
        </section>
      )}
    </>
  );
}
