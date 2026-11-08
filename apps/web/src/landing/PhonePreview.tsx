"use client";

import { ArrowLeft, ArrowUpRight, Mic, MoreHorizontal, Pause, Play } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  ChatBrandAvatar,
  chatBubbleClass,
  chatComposerClass,
  chatSendClass,
} from "../play/chatAppearance";
import type { SpeechCue } from "../play/speechVisemes";
import { conversation } from "./conversation";
import type { LandingFigures } from "./figures";
import { useLandingMotion, useVisible } from "./LandingMotion";

const Character = dynamic(
  () => import("./LandingCharacter").then((module) => module.LandingCharacter),
  { ssr: false },
);
export function PhonePreview({ figures: f }: { figures: LandingFigures }) {
  const host = useRef<HTMLDivElement>(null);
  const visible = useVisible(host);
  const { paused, reduced } = useLandingMotion();
  const [started, setStarted] = useState(false);
  const [localPaused, setLocalPaused] = useState(false);
  const active = visible && !paused && !reduced && !localPaused;
  const [count, setCount] = useState(0);
  const characterProgress = useRef(0);
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<"answer" | "hold">("answer");
  const story = conversation(f)[cycle % 3] ?? conversation(f)[0];
  const cue = useRef<SpeechCue>({ id: 0, text: story.answer, charIndex: null });
  useEffect(() => {
    if (visible) setStarted(true);
  }, [visible]);
  useEffect(() => {
    cue.current = { id: cycle, text: story.answer, charIndex: null };
  }, [cycle, story.answer]);
  useEffect(() => {
    if (!active) return;
    let handle: ReturnType<typeof setTimeout>;
    if (phase === "hold")
      handle = setTimeout(() => {
        setCycle((value) => value + 1);
        characterProgress.current = 0;
        setCount(0);
        setPhase("answer");
      }, 4000);
    else {
      let chars = characterProgress.current;
      const tick = () => {
        chars = Math.min(story.answer.length, chars + 2);
        characterProgress.current = chars;
        setCount(chars);
        if (chars === story.answer.length) setPhase("hold");
        else handle = setTimeout(tick, 60);
      };
      handle = setTimeout(tick, 60);
    }
    return () => clearTimeout(handle);
  }, [active, phase, story.answer]);
  const speaking = active && phase === "answer";
  return (
    <div
      ref={host}
      className="relative mx-auto w-full max-w-[390px] rounded-[46px] border-[7px] border-solid border-[#333d36] bg-[#121415] p-1.5 shadow-none"
    >
      <div className="relative isolate flex h-[660px] max-h-[85svh] min-h-[540px] flex-col overflow-hidden rounded-[34px] bg-[#121415] bg-[url(/play/chat-texture.svg)] [&_:where(p,h2,h3)]:m-0">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center"
        >
          <div className="h-5 w-[90px] rounded-b-2xl bg-[#333d36]" />
        </div>
        <header className="relative z-20 flex h-[82px] shrink-0 items-end justify-between gap-2 px-4 pb-4">
          <a
            href="/play"
            aria-label="Open Mr.Fund consultation"
            className="grid size-8 place-items-center rounded-full text-[#989a9b] focus-visible:outline-2 focus-visible:outline-[#bad7c3]"
          >
            <ArrowLeft size={19} />
          </a>
          <span className="flex items-center gap-2">
            <ChatBrandAvatar />
            <b className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-[-.6px] text-[#eeeef3]">
              mr.fund
            </b>
          </span>
          <button
            type="button"
            aria-label={localPaused ? "Resume mobile chat preview" : "Pause mobile chat preview"}
            aria-pressed={localPaused}
            onClick={() => setLocalPaused((value) => !value)}
            className="grid size-8 place-items-center rounded-full border-0 bg-transparent text-[#989a9b] focus-visible:outline-2 focus-visible:outline-[#bad7c3]"
          >
            {localPaused ? <Play size={15} /> : <Pause size={15} />}
          </button>
        </header>
        <div className="pointer-events-none absolute inset-0">
          {started && (
            <Character
              standing
              active={active}
              speaking={speaking}
              thinking={false}
              cue={cue}
              wave={0}
            />
          )}
        </div>
        <div className="relative z-10 flex min-h-0 flex-1 flex-col px-3 pb-2">
          <div className="flex min-h-0 flex-1 flex-col justify-end gap-5 overflow-hidden pb-4">
            <div
              key={cycle}
              className="flex justify-end pl-[88px] transition-[opacity,translate] duration-400 starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none"
            >
              <p className={`${chatBubbleClass("user")} m-0`}>{story.question}</p>
            </div>
            <div className="flex items-end gap-2.5 pl-[88px]">
              <div className={chatBubbleClass("assistant")}>
                <span aria-hidden="true">
                  {reduced ? story.answer : story.answer.slice(0, count)}
                  {speaking && <span className="ml-1 inline-block h-3 w-px bg-[#bad7c3]" />}
                </span>
                <span className="sr-only">{story.answer}</span>
              </div>
            </div>
          </div>
          <a
            href="/play"
            aria-label="Write a message in the playground"
            className={`${chatComposerClass} mb-2! items-center! text-[#757778]`}
          >
            <span className="min-w-0 flex-1 px-3 py-3 text-sm">Write a message…</span>
            <MoreHorizontal size={16} />
            <Mic size={16} className="mx-1" />
            <span className={`${chatSendClass} shrink-0`}>
              <ArrowUpRight size={20} />
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
