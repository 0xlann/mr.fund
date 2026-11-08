"use client";

import { ArrowUpRight, Pause, Play, Volume2, VolumeX } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChatBrandAvatar, chatBubbleClass } from "../play/chatAppearance";
import type { SpeechCue } from "../play/speechVisemes";
import { conversation } from "./conversation";
import type { LandingFigures } from "./figures";
import { useLandingMotion, useVisible } from "./LandingMotion";

const Character = dynamic(
  () => import("./LandingCharacter").then((module) => module.LandingCharacter),
  { ssr: false },
);
type Phase = "question" | "thinking" | "answer" | "hold";
export function ConversationPreview({ figures }: { figures: LandingFigures }) {
  const host = useRef<HTMLDivElement>(null);
  const visible = useVisible(host);
  const { paused, reduced } = useLandingMotion();
  const [localPaused, setLocalPaused] = useState(false);
  const active = visible && !paused && !reduced && !localPaused;
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("answer");
  const [characters, setCharacters] = useState(0);
  const characterProgress = useRef(0);
  const [audible, setAudible] = useState(false);
  const [audioSpeaking, setAudioSpeaking] = useState(false);
  const [audioNotice, setAudioNotice] = useState("");
  const stories = conversation(figures);
  const story = stories[index % stories.length] ?? stories[0];
  const cue = useRef<SpeechCue>({ id: 0, text: story.answer, charIndex: null });
  useEffect(() => {
    cue.current = { id: index, text: story.answer, charIndex: null };
  }, [index, story.answer]);
  useEffect(() => {
    if (!active || (phase === "hold" && audioSpeaking)) return;
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "answer") {
      let count = characterProgress.current;
      const tick = () => {
        count = Math.min(story.answer.length, count + 2);
        characterProgress.current = count;
        setCharacters(count);
        if (count >= story.answer.length) setPhase("hold");
        else timer = setTimeout(tick, 40);
      };
      timer = setTimeout(tick, 40);
    } else
      timer = setTimeout(
        () => {
          if (phase === "question") setPhase("thinking");
          else if (phase === "thinking") {
            setCharacters(0);
            setPhase("answer");
          } else {
            setIndex((value) => value + 1);
            setCharacters(0);
            setPhase("question");
          }
        },
        phase === "hold" ? 3400 : phase === "thinking" ? 1600 : 1000,
      );
    return () => clearTimeout(timer);
    // Character ticks stay inside this component; they never recreate the renderer or restart a phase timer.
  }, [active, phase, story.answer, audioSpeaking]);
  const voiceActive = active && audible && (phase === "answer" || phase === "hold");
  useEffect(() => {
    if (!voiceActive || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(story.answer);
    utterance.lang = "en-US";
    utterance.rate = 0.94;
    let cancelled = false;
    utterance.onstart = () => {
      if (!cancelled) setAudioSpeaking(true);
    };
    utterance.onboundary = (event) => {
      if (!cancelled && event.name === "word") cue.current.charIndex = event.charIndex;
    };
    utterance.onend = () => {
      if (!cancelled) setAudioSpeaking(false);
    };
    utterance.onerror = () => {
      if (!cancelled) {
        setAudioSpeaking(false);
        setAudioNotice("Voice unavailable. The visual demo keeps playing.");
      }
    };
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      setAudioNotice("Voice unavailable. The visual demo keeps playing.");
    }
    const watchdog = setTimeout(
      () => {
        if (!cancelled) {
          window.speechSynthesis.cancel();
          setAudioSpeaking(false);
        }
      },
      Math.min(30000, Math.max(12000, story.answer.length * 110)),
    );
    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      window.speechSynthesis.cancel();
      setAudioSpeaking(false);
    };
  }, [voiceActive, story.answer]);
  const speaking = active && (phase === "answer" || audioSpeaking);
  const text = reduced ? story.answer : story.answer.slice(0, characters);
  const answerVisible = reduced || phase === "answer" || phase === "hold";
  return (
    <div
      ref={host}
      id="experience"
      data-hero-visual
      className="relative mx-auto w-full max-w-[1120px] scroll-mt-24 pb-8 pt-0 lg:pb-6"
    >
      <div
        data-hero-window
        className="relative mx-auto h-[580px] w-full overflow-hidden rounded-[32px] bg-[#c9dbcb] bg-[url(/landing/grain-light.svg)] sm:h-[620px]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-6 rounded-[24px] border border-solid border-[#203327]/15"
        />
        <div
          aria-hidden="true"
          data-orbit
          className="absolute left-1/2 top-10 size-[260px] -translate-x-1/2 rounded-full border border-dashed border-[#203327]/15"
        >
          <span className="absolute left-8 top-8 size-3 rounded-full bg-[#f5edda]" />
        </div>
        <Character
          active={active}
          speaking={speaking}
          thinking={phase === "thinking"}
          cue={cue}
          wave={Math.floor(index / 3)}
        />
        <div className="absolute right-5 top-8 flex items-center gap-1.5 rounded-full bg-[#edf0df] px-3 py-2 text-sm font-bold uppercase tracking-[.12em] text-[#344b3a]">
          <span className="size-1.5 rounded-full bg-[#607c56]" />
          Demo
        </div>
      </div>
      <div
        data-float
        className="absolute -left-1 top-20 flex items-center gap-2 rounded-full border border-solid border-[#475349] bg-[#202923] px-3 py-2.5 sm:-left-5"
      >
        <Image
          src="/play/tokens/near.svg"
          alt=""
          width={20}
          height={20}
          className="size-4 invert"
        />
        <span className="text-sm text-[#c4d2c7]">Built around NEAR</span>
      </div>
      <div
        data-float
        className="absolute -right-1 top-[38%] flex items-center gap-2 rounded-2xl bg-[#eee7d8] px-3 py-3 text-[#203327] sm:-right-3"
      >
        <span className="text-sm leading-tight">
          Position
          <br />
          health
        </span>
        <b className="font-[family-name:var(--font-display)] text-xl font-medium tracking-[-.7px]">
          {figures.health}
        </b>
      </div>
      <div
        data-hero-chat
        className="absolute inset-x-0 bottom-7 rounded-[24px] border border-solid border-[#38443b] bg-[#121415] bg-[url(/play/chat-texture.svg)] p-4 sm:bottom-12 sm:left-auto sm:right-8 sm:w-[440px] sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ChatBrandAvatar />
            <div>
              <p className="m-0 text-sm font-semibold text-[#e6eee7]">Mr.Fund</p>
              <p className="m-0 mt-1 text-sm text-[#8eaa96]">
                {phase === "thinking" && !reduced
                  ? "Thinking it through…"
                  : speaking
                    ? "Talking you through it"
                    : "Here with you"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={audible ? "Mute demo voice" : "Hear demo voice"}
              aria-pressed={audible}
              onClick={() => {
                if (
                  !("speechSynthesis" in window) ||
                  typeof SpeechSynthesisUtterance === "undefined"
                ) {
                  setAudioNotice("Voice unavailable in this browser. Text stays available.");
                  return;
                }
                setAudioNotice("");
                setAudible((value) => !value);
              }}
              className="grid size-8 place-items-center rounded-full border-0 bg-transparent text-[#a8b5ab] hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#d3e5d7]"
            >
              {audible ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <button
              type="button"
              aria-label={localPaused ? "Resume conversation demo" : "Pause conversation demo"}
              aria-pressed={localPaused}
              onClick={() => setLocalPaused((value) => !value)}
              className="grid size-8 place-items-center rounded-full border-0 bg-transparent text-[#a8b5ab] hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#d3e5d7]"
            >
              {localPaused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          </div>
        </div>
        <div
          key={index}
          className="mb-3 flex justify-end transition-[opacity,translate] duration-300 starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none"
        >
          <p className={`${chatBubbleClass("user")} m-0`}>{story.question}</p>
        </div>
        <div className={`${chatBubbleClass("assistant")} min-h-[126px] max-w-full!`}>
          {answerVisible ? (
            <>
              <span aria-hidden="true" data-testid="hero-answer">
                {text}
                {speaking && <span className="ml-1 inline-block h-3 w-px bg-[#c9dcce]" />}
              </span>
              <span className="sr-only">{story.answer}</span>
            </>
          ) : (
            <span
              role="status"
              className="inline-flex items-center gap-1.5"
              aria-label="Mr.Fund is thinking"
            >
              <i className="size-1 rounded-full bg-[#9bb4a2] motion-safe:animate-pulse" />
              <i className="size-1 rounded-full bg-[#9bb4a2] motion-safe:animate-pulse [animation-delay:150ms]" />
              <i className="size-1 rounded-full bg-[#9bb4a2] motion-safe:animate-pulse [animation-delay:300ms]" />
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-sm text-[#8b9b8f]">Simulated</span>
          <a
            href="/play"
            aria-label="Try this conversation"
            className="grid size-7 shrink-0 place-items-center rounded-full bg-[#d3e5d7] text-[#203327] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3e5d7]"
          >
            <ArrowUpRight size={15} />
          </a>
        </div>
        {audioNotice && (
          <p role="status" className="m-0 mt-2 text-sm text-[#d4be99]">
            {audioNotice}
          </p>
        )}
      </div>
    </div>
  );
}
