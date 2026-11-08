"use client";

import { mood as computeMood } from "@mrfund/engine";
import { type GuardianPolicy, validatePolicy } from "@mrfund/shared";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Copy,
  History,
  Info,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Settings2,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ConsultationTabs, type DetailTab } from "./ConsultationTabs";
import { DetailContent } from "./DetailContent";
import {
  amount,
  atomic,
  comparison,
  type DataState,
  DEMO_FEE,
  draft,
  metrics,
  percent,
  scenario,
  snapshot,
} from "./demo";
import { ImmersiveSceneFrame } from "./ImmersiveSceneFrame";
import { PositionSummary } from "./PositionSummary";
import { ReplyText } from "./ReplyText";
import { panelReveal, playClasses } from "./styles";
import { VoicePanel } from "./VoicePanel";

const CharacterPortrait = dynamic(
  () => import("./CharacterPortrait").then((m) => m.CharacterPortrait),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-transparent">
        <span className="absolute bottom-[36%] left-0 w-full animate-pulse text-center text-[11px] font-semibold text-[#dcdfe6]">
          Opening the office…
        </span>
      </div>
    ),
  },
);
type Panel = "chat" | "voice" | "position" | "guardian" | "activity";
type Modal = "wallet" | "settings" | "setup" | "help" | null;
type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  kind?: "recommendation" | "scenario";
};
type Receipt = {
  id: number;
  title: string;
  detail: string;
  status: "confirmed" | "rejected" | "failed" | "partial";
  at: string;
  atMs: number;
  before?: string;
  after?: string;
};
type Pending = { title: string; description: string; amount: string; apply: () => void };
type PolicyFields = {
  max: string;
  cap: string;
  floor: string;
  deposit: string;
  trigger: string;
  target: string;
  cooldown: string;
};
const initialFields: PolicyFields = {
  max: "100",
  cap: "400",
  floor: "100",
  deposit: "500",
  trigger: "120",
  target: "150",
  cooldown: "5",
};
const prompts = [
  {
    label: "Find my smartest move",
    text: "Should I repay or earn yield?",
  },
  {
    label: "What if NEAR drops 20%?",
    text: "What if NEAR drops 20%?",
  },
  { label: "Meet my Guardian", text: "What can Guardian do for me?" },
  { label: "Explain my position", text: "Explain my position" },
];
const greeting: Message = {
  id: 0,
  role: "assistant",
  text: "Hey, I'm Mr.Fund. Your money has a lot going on. Let's make sense of it together.",
};

function ModalFrame({
  title,
  eyebrow,
  children,
  close,
  wide = false,
  wallet = false,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
  wallet?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => {
      el?.close();
    };
  }, []);
  return (
    <dialog
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          close();
        }
      }}
      ref={ref}
      className={playClasses(
        `play-modal ${wide ? "wide" : ""} ${wallet ? "w-[min(500px,calc(100vw_-_28px))]! rounded-[32px]! bg-[url(/play/chat-texture.svg)] bg-repeat" : ""}`,
      )}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className={`modal-inner ${wallet ? "relative overflow-hidden px-6 pb-6 pt-8 sm:px-8 sm:pb-7 sm:pt-10" : "p-[27px] max-[620px]:p-[23px_20px]"}`}
      >
        <div
          className={`modal-heading ${wallet ? "flex items-start justify-between gap-5 [&_.eyebrow]:text-[9px] [&_.eyebrow]:font-medium [&_.eyebrow]:text-[#929996] [&_h2]:mt-4 [&_h2]:whitespace-nowrap [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[clamp(24px,7vw,38px)] [&_h2]:font-medium [&_h2]:leading-[1.04] [&_h2]:tracking-[-1.1px]" : "flex justify-between items-start gap-[10px] [&_.eyebrow]:text-[#a2a4a5] [&_.eyebrow]:text-[8px] [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[30px] [&_h2]:font-medium [&_h2]:leading-[1.15] [&_h2]:tracking-[-1.2px] [&_h2]:mt-[7px] [&>.icon-button]:bg-[#1c1e1f] [&>.icon-button]:w-[30px] [&>.icon-button]:h-[30px] [&>.icon-button]:shrink-0 max-[620px]:[&_h2]:text-[27px] max-[620px]:[&_.eyebrow]:text-[7px]"}`}
        >
          <div>
            <span className="eyebrow text-[9px] font-extrabold tracking-[.15em] block leading-[1.5]">
              {eyebrow}
            </span>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            type="button"
            className="icon-button inline-flex items-center justify-center border-0 bg-transparent w-[32px] h-[32px] rounded-full p-0 [transition:background_.18s] [&:hover]:bg-[#8080801a]"
            onClick={close}
            aria-label="Close dialog"
          >
            <X size={21} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
function useMedia(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}
function ChatAvatar() {
  return (
    <span
      aria-hidden="true"
      className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e4d7ba] font-[family-name:var(--font-display)] text-lg font-bold leading-none tracking-[-1.5px] text-[#203327]"
    >
      m.
    </span>
  );
}

function Tag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={playClasses(`tag ${className}`)}>{children}</span>;
}

export function Playground() {
  const [stage, setStage] = useState<"welcome" | "consult">("welcome");
  const [panel, setPanel] = useState<Panel | null>("chat");
  const wide = useMedia("(min-width: 1280px)");
  const shortMobile = useMedia("(max-height:600px) and (max-width:767px)") && !wide;
  const [speaking, setSpeaking] = useState(false);
  const [streamingId, setStreamingId] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("position");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [chatRevealed, setChatRevealed] = useState(false);
  const [detailsRevealed, setDetailsRevealed] = useState(false);
  const finishEntrance = useCallback(() => setCameraReady(true), []);
  useEffect(() => {
    if (stage !== "consult" || !cameraReady) return;
    setChatRevealed(true);
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDetailsRevealed(true);
      return;
    }
    const timer = setTimeout(() => setDetailsRevealed(true), 160);
    return () => clearTimeout(timer);
  }, [stage, cameraReady]);

  const [composerFocused, setComposerFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number | null>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () =>
      setKeyboardHeight(
        composerFocused && !wide && window.innerHeight - viewport.height > 120
          ? viewport.height
          : null,
      );
    update();
    viewport.addEventListener("resize", update);
    return () => viewport.removeEventListener("resize", update);
  }, [composerFocused, wide]);

  const openPanel = useCallback(
    (requested: Panel | null) => {
      if (wide) {
        if (requested === "position" || requested === "guardian" || requested === "activity")
          setDetailTab(requested);
        if (requested === "voice") setVoiceOpen(true);
        setPanel("chat");
      } else setPanel(requested ?? "chat");
    },
    [wide],
  );
  useEffect(() => {
    if (wide && stage === "consult" && panel !== "chat") openPanel(panel);
    if (!wide) setVoiceOpen(false);
  }, [wide, stage, panel, openPanel]);
  const [sound, setSound] = useState(true);
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const panelClose = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!panel) return;
    previousFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelClose.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) openPanel(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      previousFocus.current?.focus();
    };
  }, [panel, openPanel]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [dataState, setDataState] = useState<DataState>("fresh");
  const [debt, setDebt] = useState(1_800_000_000n);
  const [walletBalance, setWalletBalance] = useState(1_000_000_000n);
  const [now, setNow] = useState(0);
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [wave, setWave] = useState(0);
  const [repayAmount, setRepayAmount] = useState("100");
  const [adjusting, setAdjusting] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [lastRepay, setLastRepay] = useState<Receipt | null>(null);
  const [lastChange, setLastChange] = useState<{
    repaid: string;
    before: string;
    after: string;
  } | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [signing, setSigning] = useState(false);
  const [walletOutcome, setWalletOutcome] = useState("success");
  const [guardian, setGuardian] = useState<"inactive" | "active" | "paused" | "deactivated">(
    "inactive",
  );
  const [reserve, setReserve] = useState(0n);
  const [guardianSpent, setGuardianSpent] = useState(0n);
  const [guardianDebt, setGuardianDebt] = useState(1_800_000_000n);
  const [policyFields, setPolicyFields] = useState<PolicyFields>(initialFields);
  const [savedFields, setSavedFields] = useState<PolicyFields>(initialFields);
  const [setupReview, setSetupReview] = useState(false);
  const [comfort, setComfort] = useState("150");
  const [watcherOnline, setWatcherOnline] = useState(true);
  const [notice, setNotice] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const messageId = useRef(0);
  const speechSequence = useRef(0);
  const speechCue = useRef<{ id: number; text: string; charIndex: number | null }>({
    id: 0,
    text: "",
    charIndex: null,
  });
  const playback = useRef<{
    id: number;
    messageId: number;
    textDone: boolean;
    audioDone: boolean;
  } | null>(null);
  const finishAudio = useCallback((id: number) => {
    const current = playback.current;
    if (!current || current.id !== id) return;
    current.audioDone = true;
    if (current.textDone) setSpeaking(false);
  }, []);
  const finishText = useCallback((id: number) => {
    const current = playback.current;
    if (!current || current.messageId !== id) return;
    current.textDone = true;
    setStreamingId(null);
    if (current.audioDone) setSpeaking(false);
  }, []);

  useEffect(() => {
    if (panel !== "chat" && streamingId !== null) finishText(streamingId);
  }, [panel, streamingId, finishText]);
  const receiptId = useRef(0);
  useEffect(() => {
    setNow(Date.now());
    return () => {
      for (const timer of timeouts.current) clearTimeout(timer);
      speechSequence.current++;
      playback.current = null;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);
  useEffect(() => {
    if (panel !== "chat" || messages.length === 0) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: thinking || streamingId !== null ? "auto" : "smooth",
    });
  }, [messages, thinking, streamingId, panel]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  const s = snapshot(debt, now, dataState);
  const current = metrics(s, now);
  const recent = receipts[0];
  const computed = computeMood(
    s,
    recent
      ? {
          status: recent.status === "rejected" ? "failed" : recent.status,
          atMs: recent.atMs,
          txHashes: [],
          ...(recent.before && recent.after && recent.after !== "No debt"
            ? {
                observed: {
                  healthBeforeBps: String(Math.round(Number(recent.before.replace("%", "")) * 100)),
                  healthAfterBps: String(Math.round(Number(recent.after.replace("%", "")) * 100)),
                },
              }
            : {}),
        }
      : undefined,
    Math.round(Number(comfort) * 100) || 15000,
    now,
  );
  const characterMood =
    thinking || dataState === "loading"
      ? "thinking"
      : dataState === "error"
        ? "concerned"
        : computed.state;
  const card = draft(s, repayAmount, walletBalance, now);
  const comp = comparison(s, card?.ok ? card.value.amount : 100_000_000n, now);
  const whatIf = scenario(s, now);
  const unavailable = dataState !== "fresh";
  const max = atomic(savedFields.max) ?? 0n,
    floor = atomic(savedFields.floor) ?? 0n,
    cap = atomic(savedFields.cap) ?? 0n;
  const spendable = reserve > floor ? reserve - floor : 0n;
  const remaining = cap > guardianSpent ? cap - guardianSpent : 0n;
  function later(fn: () => void, ms: number) {
    const timer = setTimeout(fn, ms);
    timeouts.current.push(timer);
  }
  function addReceipt(
    title: string,
    detail: string,
    status: Receipt["status"] = "confirmed",
    before?: string,
    after?: string,
  ) {
    const item: Receipt = {
      id: ++receiptId.current,
      title,
      detail,
      status,
      at: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      atMs: Date.now(),
      ...(before ? { before } : {}),
      ...(after ? { after } : {}),
    };
    setReceipts((prev) => [item, ...prev]);
    return item;
  }
  function refresh() {
    setDataState("loading");
    later(() => {
      setNow(Date.now());
      setDataState("fresh");
      setNotice("Simulated position refreshed.");
    }, 650);
  }
  function _ask(text: string) {
    if (!text.trim() || thinking || streamingId !== null) return;
    openPanel("chat");
    const question = text.trim().slice(0, 500);
    setMessages((prev) => [...prev, { id: ++messageId.current, role: "user", text: question }]);
    setInput("");
    setThinking(true);
    setSpeaking(false);
    const speechId = ++speechSequence.current;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    later(() => {
      if (speechSequence.current !== speechId) return;
      const id = ++messageId.current;
      const q = question.toLowerCase();
      const indo = /kalau|harga|aku|berapa|jelas|aman|batas|apa |bayar|utang/.test(q);
      let text =
        "I can explain your Rhea position, compare repaying with earning yield, run a price-drop scenario, or explain Guardian. Try one of the prompts below.";
      let kind: Message["kind"];
      if (unavailable)
        text =
          dataState === "empty"
            ? "There isn't a lending position in this demo state. Switch back to Fresh in Demo settings to explore the full flow. A real position would be opened on Rhea."
            : "I need fresh position data before giving you numbers. Refresh the position first; I won't guess.";
      else if (/what if|drops|drop|turun|kalau/.test(q) && whatIf.ok) {
        text = indo
          ? `Skenario simulasi: kalau harga NEAR turun 20%, health factor menjadi ${percent(whatIf.value.value.healthBps)}. Batas likuidasi Rhea adalah 100%. Masih di atas batas pada skenario ini, tetapi risikonya tetap ada.`
          : `In this simulated 20% NEAR price drop, your health becomes ${percent(whatIf.value.value.healthBps)}. Rhea's liquidation line is 100%. You stay above it in this scenario, with less room for another drop.`;
        kind = "scenario";
      } else if (/guardian|batas|reserve|protect|limit|what did|why didn/.test(q)) {
        if (guardian === "inactive")
          text = indo
            ? "Guardian menggunakan cadangan untuk membayar utang sesuai batas yang kamu tentukan. Pinjaman yang dilindungi harus berada di akun Guardian. Coba setup demo melalui panel Guardian."
            : "Think of Guardian as your rules, on watch. It can repay a Guardian-held loan from a reserve, within your caps and cooldown. Your existing wallet loan stays separate. Open the setup to try it.";
        else if (/what did|today|history/.test(q))
          text = `Guardian is ${guardian}. ${receipts.filter((r) => /Guardian|request|reserve/.test(r.title)).length} demo events are in Activity. Every attempt has a simulated receipt there, including rejected requests.`;
        else if (/why didn/.test(q))
          text = !watcherOnline
            ? "The simulated watcher is offline. No automatic action can be requested while it's offline."
            : guardian !== "active"
              ? `Guardian is ${guardian}; automatic requests are blocked.`
              : "No automatic repay is needed at the current demo health. You can run a labelled trigger replay from the Guardian panel.";
        else
          text = `Guardian is ${guardian}. Reserve: ${amount(reserve)} USDC; spendable above your floor: ${amount(spendable)} USDC. Each action is capped at ${savedFields.max} USDC, lifetime spend at ${savedFields.cap} USDC, with a ${savedFields.cooldown}-minute cooldown. Trigger: health below ${savedFields.trigger}%. Activation fee: 1.00 test USDC; action fee: 0.00. Watcher: ${watcherOnline ? "online" : "offline"}. It reduces risk within your limits; it cannot prevent liquidation. Pause, deactivate, or withdraw from the Guardian panel.`;
      } else if (/repay|yield|smartest|bayar|interest/.test(q) && comp.ok) {
        text = indo
          ? `Dengan ${amount(comp.value.value.amountUsed)} USDC, membayar utang menghemat sekitar ${amount(comp.value.value.repaySaves)} USDC per tahun. Supply menghasilkan sekitar ${amount(comp.value.value.yieldEarns)} USDC. Dalam contoh ini, bayar utang lebih menguntungkan sebelum biaya.`
          : `Let's put that cash to work on your debt. Repaying ${amount(comp.value.value.amountUsed)} USDC avoids an estimated ${amount(comp.value.value.repaySaves)} USDC in yearly interest. Supplying it earns ${amount(comp.value.value.yieldEarns)} USDC. Repaying wins before fees.`;
        kind = "recommendation";
        setCardOpen(true);
        setLastRepay(null);
      } else if (/position|health|utang|jelas/.test(q))
        text = `Your demo position has 1,000 NEAR in collateral and ${amount(debt)} USDC in debt. Health: ${current.health === null ? "unavailable" : percent(current.health)}. Borrow APR is 21.00%; supply APR is 14.01%. These are illustrative inputs, refreshed for this demo. Below 100% health, Rhea can liquidate a position.`;
      else if (/bitcoin|ethereum|trade|buy|leverage|ignore|10000|10,000/.test(q))
        text =
          "That action is outside this demo's permissions. I can help with the supported Rhea debt and Guardian limits. A chat message never authorizes a transaction.";
      const canSpeak =
        soundRef.current &&
        "speechSynthesis" in window &&
        typeof SpeechSynthesisUtterance !== "undefined";
      speechCue.current = { id: speechId, text, charIndex: null };
      playback.current = { id: speechId, messageId: id, textDone: false, audioDone: !canSpeak };
      setMessages((prev) => [...prev, { id, role: "assistant", text, ...(kind ? { kind } : {}) }]);
      setStreamingId(id);
      setThinking(false);
      setSpeaking(true);
      if (canSpeak) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = indo ? "id-ID" : "en-US";
        utterance.rate = 0.95;
        utterance.onstart = () => {
          if (playback.current?.id === speechId && !playback.current.audioDone) setSpeaking(true);
        };
        utterance.onboundary = (event) => {
          if (speechCue.current.id === speechId && event.name === "word")
            speechCue.current.charIndex = event.charIndex;
        };
        utterance.onend = () => finishAudio(speechId);
        utterance.onerror = () => finishAudio(speechId);
        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          finishAudio(speechId);
        }
        // Recover if a browser speech service never sends an end/error event.
        later(() => finishAudio(speechId), Math.min(90000, Math.max(10000, text.length * 110)));
      }
    }, 2000);
  }
  function requestAction(action: Pending) {
    if (!connected) {
      setModal("wallet");
      setNotice("Connect the mock wallet, then try the action again.");
      return;
    }
    setWalletOutcome("success");
    setPending(action);
  }
  function confirmPending() {
    if (!pending || signing) return;
    setSigning(true);
    later(() => {
      if (walletOutcome === "cancel")
        setNotice("You cancelled. Nothing changed; your draft is ready to retry.");
      else if (walletOutcome === "failure") {
        addReceipt(
          pending.title,
          "Simulated transaction failed. No balance changed. Retry when ready.",
          "failed",
        );
        setNotice("Demo transaction failed. No funds moved.");
      } else if (walletOutcome === "partial") {
        addReceipt(
          pending.title,
          "Simulated batch stopped before applying the action. Fee and action steps were not applied. Review and retry.",
          "partial",
        );
        setNotice("Partial demo batch. No balance change was applied.");
      } else {
        pending.apply();
      }
      setSigning(false);
      setPending(null);
    }, 1100);
  }
  function executeRepay() {
    if (!card?.ok || unavailable) return;
    const value = card.value;
    requestAction({
      title: `Repay ${amount(value.amount)} USDC`,
      description:
        "Mock approval for a repayment from your wallet. Execution fee: 0.10 test USDC to fees.demo.testnet. No transaction will be sent.",
      amount: `${amount(value.amount + DEMO_FEE.executionFee)} test USDC`,
      apply: () => {
        const before = current.health === null ? "Unavailable" : percent(current.health);
        const nextDebt = debt - value.amount;
        const next = metrics(snapshot(nextDebt, Date.now()), Date.now());
        setDebt(nextDebt);
        setWalletBalance((balance) => balance - value.amount - DEMO_FEE.executionFee);
        setNow(Date.now());
        const receipt = addReceipt(
          `Repaid ${amount(value.amount)} USDC`,
          "Simulated wallet repayment. Fee: 0.10 test USDC to fees.demo.testnet. Result computed from the updated demo fixture; no chain confirmation.",
          "confirmed",
          before,
          next.health === null ? "Unavailable" : percent(next.health),
        );
        setLastRepay(receipt);
        setLastChange({
          repaid: amount(value.amount),
          before,
          after: next.health === null ? "Unavailable" : percent(next.health),
        });
        setCardOpen(false);
        setNotice("Repayment simulated. Your demo position has been updated.");
      },
    });
  }
  function policyValidation() {
    const maxPerAction = atomic(policyFields.max),
      lifetimeCap = atomic(policyFields.cap),
      reserveFloor = atomic(policyFields.floor),
      deposit = atomic(policyFields.deposit);
    if (maxPerAction === null || lifetimeCap === null || reserveFloor === null || deposit === null)
      return "Use positive token amounts with up to 6 decimals.";
    const policy: GuardianPolicy = {
      maxPerAction,
      lifetimeCap,
      reserveFloor,
      triggerHfBps: Math.round(Number(policyFields.trigger) * 100),
      targetHfBps: policyFields.target ? Math.round(Number(policyFields.target) * 100) : null,
      cooldownSec: Number(policyFields.cooldown) * 60,
      actionFee: 0n,
    };
    if (
      !Number.isFinite(Number(policyFields.trigger)) ||
      !Number.isFinite(Number(policyFields.target))
    )
      return "Enter a valid health threshold.";
    const result = validatePolicy(policy);
    if (!result.ok)
      return "Trigger must be ≥105%, target above trigger, cooldown ≥5 minutes, and lifetime cap ≥ a positive action maximum.";
    if (deposit < maxPerAction + reserveFloor)
      return "Reserve deposit must cover the action maximum plus the reserve floor.";
    if (deposit + DEMO_FEE.activationFee > walletBalance)
      return "Your mock wallet cannot cover this reserve and activation fee.";
    return null;
  }
  function activate() {
    if (policyValidation()) return;
    const deposit = atomic(policyFields.deposit) ?? 0n;
    requestAction({
      title: "Activate Guardian",
      description:
        "Simulate creating a separate Guardian-held loan and funding its reserve. Your wallet loan is not moved. Includes a 1.00 test USDC activation fee to fees.demo.testnet.",
      amount: `${amount(deposit + DEMO_FEE.activationFee)} test USDC`,
      apply: () => {
        setGuardian("active");
        setSavedFields({ ...policyFields });
        setReserve(deposit);
        setGuardianSpent(0n);
        setGuardianDebt(1_800_000_000n);
        setWalletBalance((balance) => balance - deposit - DEMO_FEE.activationFee);
        setModal(null);
        setSetupReview(false);
        addReceipt(
          "Guardian activated",
          `Simulated reserve ${amount(deposit)} USDC; activation fee 1.00 test USDC. Separate Guardian-held loan fixture. No contract was created.`,
        );
        setNotice("Your demo Guardian is on watch.");
      },
    });
  }
  function ownerAction(action: "pause" | "resume" | "deactivate" | "withdraw" | "topup") {
    if (action === "withdraw" && reserve === 0n) {
      setNotice("There is no reserve left to withdraw.");
      return;
    }
    const topup = 50_000_000n;
    if (action === "topup" && walletBalance < topup) {
      setNotice("The mock wallet needs 50 USDC for this top-up.");
      return;
    }
    const titles = {
      pause: "Pause Guardian",
      resume: "Resume Guardian",
      deactivate: "Deactivate Guardian",
      withdraw: "Withdraw reserve",
      topup: "Top up reserve",
    };
    requestAction({
      title: titles[action],
      amount:
        action === "withdraw"
          ? `${amount(reserve)} test USDC`
          : action === "topup"
            ? "50.00 test USDC"
            : "No token transfer",
      description:
        action === "deactivate"
          ? "Stops future demo automation. Past actions stay in history, and unused reserve can still be withdrawn."
          : action === "withdraw"
            ? "Returns all unlocked demo reserve to your mock wallet. The floor limits automation, not owner withdrawals."
            : "Simulated owner approval. No transaction or contract call is sent.",
      apply: () => {
        if (action === "withdraw") {
          setWalletBalance((b) => b + reserve);
          setReserve(0n);
        } else if (action === "topup") {
          setWalletBalance((b) => b - topup);
          setReserve((r) => r + topup);
        } else
          setGuardian(
            action === "pause" ? "paused" : action === "resume" ? "active" : "deactivated",
          );
        addReceipt(
          titles[action],
          "Owner control simulated with mock-wallet approval. No chain transaction.",
        );
        setNotice(`${titles[action]} simulated.`);
      },
    });
  }
  function replay(overLimit = false) {
    if (overLimit) {
      addReceipt(
        "Over-limit request rejected",
        `Simulated operator test: requested ${amount(max + 1_000_000n)} USDC; your per-action limit is ${savedFields.max} USDC. Reason: AboveMaxPerAction. Reserve unchanged.`,
        "rejected",
      );
      setNotice("Over-limit demo request rejected. Reserve unchanged.");
      return;
    }
    if (guardian !== "active" || !watcherOnline) {
      setNotice(
        !watcherOnline
          ? "Watcher is offline. Replay blocked."
          : "Guardian must be active for a trigger replay.",
      );
      return;
    }
    const lastAction = receipts.some((r) => r.title === "Guardian repay replayed");
    if (lastAction) {
      addReceipt(
        "Guardian request rejected",
        `Simulated cooldown is ${savedFields.cooldown} minutes. Reset the demo to replay again.`,
        "rejected",
      );
      setNotice("Cooldown blocks another demo replay.");
      return;
    }
    const value = [max, spendable, remaining, guardianDebt].reduce((a, b) => {
      if (a < b) return a;
      return b;
    });
    if (value <= 0n) {
      addReceipt(
        "Guardian request rejected",
        "Reserve floor, lifetime cap, or remaining debt prevents another action.",
        "rejected",
      );
      return;
    }
    setReserve((r) => r - value);
    setGuardianSpent((v) => v + value);
    setGuardianDebt((d) => d - value);
    addReceipt(
      "Guardian repay replayed",
      `SIMULATED trigger crossing: replay repaid ${amount(value)} USDC from the separate Guardian reserve. Action fee: 0.00. Reserve, floor, and lifetime cap enforced by local demo code only.`,
    );
    setNotice("Labelled trigger replay completed. No on-chain protection is claimed.");
  }
  function stopReply() {
    speechSequence.current++;
    playback.current = null;
    setStreamingId(null);
    setThinking(false);
    setSpeaking(false);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
  function clearConversation() {
    stopReply();
    setMessages([greeting]);
    setCardOpen(false);
    setLastRepay(null);
  }
  function reset() {
    stopReply();
    setDebt(1_800_000_000n);
    setWalletBalance(1_000_000_000n);
    setGuardian("inactive");
    setReserve(0n);
    setGuardianSpent(0n);
    setGuardianDebt(1_800_000_000n);
    setReceipts([]);
    setMessages([greeting]);
    setCardOpen(false);
    setLastRepay(null);
    setLastChange(null);
    setDataState("fresh");
    setNow(Date.now());
    setModal(null);
    setNotice("Demo reset. A fresh start for your money.");
  }
  function enterConsultation() {
    setStage("consult");
    openPanel("chat");
  }
  function startConsultation() {
    if (connected) enterConsultation();
    else setModal("wallet");
  }
  function connectDemoWallet() {
    if (connecting) return;
    setConnecting(true);
    later(() => {
      setConnecting(false);
      setConnected(true);
      setModal(null);
      setWave((v) => v + 1);
      setNotice("Mock wallet connected. Welcome to the office.");
      if (stage === "welcome") enterConsultation();
    }, 700);
  }
  const healthText =
    current.health === null || dataState === "error" || dataState === "loading"
      ? "—"
      : percent(current.health);
  const field = (
    name: keyof PolicyFields,
    label: string,
    suffix: string,
    hint: string,
    optional = false,
  ) => (
    <label className="form-field flex flex-col gap-[8px] mt-[21px] min-w-0 [&>span]:text-[10px] [&>span]:font-bold [&>span]:flex [&>span]:justify-between [&>span_small]:text-[8px] [&>span_small]:font-normal [&>span_small]:text-[#a2a4a5] [&_input]:p-[12px] [&_input]:bg-[#1c1e1f] [&_input]:[border:1px_solid_#313334] [&_input]:rounded-[7px] [&_input]:text-[12px] [&_input]:text-[var(--ink)] [&_input]:w-full [&_input]:min-w-0 [&_select]:p-[12px] [&_select]:bg-[#1c1e1f] [&_select]:[border:1px_solid_#313334] [&_select]:rounded-[7px] [&_select]:text-[12px] [&_select]:text-[var(--ink)] [&_select]:w-full [&_select]:min-w-0 [&>small]:text-[8px] [&>small]:leading-[1.5] [&>small]:text-[#a2a4a5] max-[620px]:[&>span]:text-[9px] max-[620px]:[&_input]:text-[11px] max-[620px]:[&_input]:p-[11px_9px] max-[620px]:[&_select]:text-[11px] max-[620px]:[&_select]:p-[11px_9px] max-[620px]:[&>small]:text-[7px]">
      <span>
        {label}
        {optional && <small>Optional</small>}
      </span>
      <div className="field-input relative [&_input]:pr-[55px] [&_b]:absolute [&_b]:right-[13px] [&_b]:top-[14px] [&_b]:text-[9px] [&_b]:text-[#a2a4a5] [&_b]:font-medium [&_b]:pointer-events-none max-[620px]:[&_b]:text-[8px] max-[620px]:[&_b]:top-[13px] max-[620px]:[&_b]:right-[9px] max-[620px]:[&_input]:pr-[44px]">
        <input
          type="number"
          min="0"
          step={
            name === "trigger" || name === "target"
              ? "0.01"
              : name === "cooldown"
                ? "1"
                : "0.000001"
          }
          value={policyFields[name]}
          onChange={(e) => {
            setPolicyFields((f) => ({ ...f, [name]: e.target.value }));
            setSetupReview(false);
          }}
        />
        <b>{suffix}</b>
      </div>
      <small>{hint}</small>
    </label>
  );

  function guardianContent() {
    return (
      <section className="guardian-card min-w-0 overflow-hidden rounded-[24px] border border-white/8 bg-[#1f2122] p-5 text-[#edf3f5] sm:p-6">
        <div data-panel-enter="0" className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[13px] font-medium text-[#c7d7ca]">
            <ShieldCheck size={18} strokeWidth={1.6} />
            Guardian
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#292d2b] px-2.5 py-1 text-[10px] text-[#aeb8b1]">
            <span
              className={`size-1 rounded-full ${guardian === "active" ? "bg-[#bad7c3]" : "bg-[#818a85]"}`}
            />
            {guardian === "inactive"
              ? "Not configured"
              : guardian === "active"
                ? "Active · demo"
                : guardian === "paused"
                  ? "Paused · demo"
                  : "Deactivated"}
          </span>
        </div>
        <div data-panel-enter="1" className="pb-6 pt-7">
          <h2 className="font-[family-name:var(--font-display)] text-[30px] font-medium leading-[1.12] tracking-[-1px]">
            {guardian === "inactive" ? (
              <>
                Your rules.
                <br />
                Your Guardian.
              </>
            ) : guardian === "active" ? (
              "Your policy, at a glance."
            ) : guardian === "paused" ? (
              "Paused. On your terms."
            ) : (
              "Your policy is off."
            )}
          </h2>
          <p className="mt-3! text-[12px] leading-[1.8] text-[#9da6a1]">
            {guardian === "inactive"
              ? "Choose when to repay and how much. Review every limit before you switch it on."
              : `Reserve ${amount(reserve)} USDC · Spendable ${amount(spendable)} USDC. A separate, simulated Guardian-held loan.`}
          </p>
        </div>
        {guardian === "inactive" ? (
          <div>
            <div data-panel-enter="2" className="mb-6 space-y-4">
              <div className="flex items-start gap-3">
                <SlidersHorizontal size={16} strokeWidth={1.6} className="mt-0.5 text-[#aabeb0]" />
                <div>
                  <p className="text-[12px] font-medium text-[#d5ddd7]">Limits you choose</p>
                  <p className="mt-1! text-[11px] leading-relaxed text-[#858f89]">
                    Repayment cap, reserve and trigger.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Pause size={16} strokeWidth={1.6} className="mt-0.5 text-[#aabeb0]" />
                <div>
                  <p className="text-[12px] font-medium text-[#d5ddd7]">Control stays with you</p>
                  <p className="mt-1! text-[11px] leading-relaxed text-[#858f89]">
                    Pause or change your policy.
                  </p>
                </div>
              </div>
            </div>
            <button
              data-panel-enter="3"
              type="button"
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-full border-0 bg-[#bad7c3] px-4 py-3 text-[12px] font-semibold text-[#203327] transition-colors hover:bg-[#d3e5d7]"
              onClick={() => {
                setSetupReview(false);
                setModal("setup");
              }}
            >
              Meet your Guardian <ArrowUpRight size={17} />
            </button>
            <p data-panel-enter="4" className="mt-3! text-center text-[10px] text-[#808c84]">
              Opt-in · Simulated policy preview
            </p>
          </div>
        ) : (
          <>
            <div
              data-panel-enter="2"
              className="guardian-numbers grid grid-cols-[repeat(3,1fr)] m-[13px_0] [border-top:1px_solid_#ffffff14] pt-[15px] gap-[12px] [&_small]:block [&_small]:text-[10px] [&_small]:text-[#a2a4a5] [&_small]:tracking-[.05em] [&_strong]:font-[family-name:var(--font-display)] [&_strong]:text-[23px] [&_strong]:font-medium [&_strong]:block [&_strong]:mt-[4px] [&_em]:[font:10px_var(--font-body)] max-[620px]:gap-[8px] max-[620px]:[&_small]:text-[9px] max-[620px]:[&_strong]:text-[22px] max-[620px]:[&_em]:text-[9px]"
            >
              <div>
                <small>PER ACTION</small>
                <strong>
                  {savedFields.max}
                  <em> USDC</em>
                </strong>
              </div>
              <div>
                <small>RESERVE FLOOR</small>
                <strong>
                  {savedFields.floor}
                  <em> USDC</em>
                </strong>
              </div>
              <div>
                <small>TRIGGER BELOW</small>
                <strong>
                  {savedFields.trigger}
                  <em>%</em>
                </strong>
              </div>
            </div>
            <div
              data-panel-enter="3"
              className="guardian-controls flex gap-[8px] items-center mt-[17px] flex-wrap [&>.icon-button]:ml-auto"
            >
              {guardian !== "deactivated" && (
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border-0 bg-[#bad7c3] px-4 py-2.5 text-xs font-semibold text-[#203327] transition-colors hover:bg-[#d3e5d7]"
                  onClick={() => ownerAction(guardian === "active" ? "pause" : "resume")}
                >
                  {guardian === "active" ? <Pause size={15} /> : <Play size={15} />}
                  {guardian === "active" ? "Pause" : "Resume"}
                </button>
              )}
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-xs font-medium text-[#c5cec7] transition-colors hover:bg-[#292d2b]"
                onClick={() => ownerAction("withdraw")}
              >
                Withdraw
              </button>
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-xs font-medium text-[#c5cec7] transition-colors hover:bg-[#292d2b]"
                onClick={() => ownerAction("topup")}
              >
                <Plus size={15} />
                Top up
              </button>
            </div>
          </>
        )}
        {guardian !== "inactive" && (
          <div
            data-panel-enter="4"
            className="guardian-details mt-[24px] [border-top:1px_solid_#ffffff14] pt-[20px] [&_.fine-print]:text-[#a2a4a5] [&_.fine-print]:text-[10px]"
          >
            <div className="detail-grid grid grid-cols-[1fr_1fr] gap-[23px_18px] [&_small]:text-[9px] [&_small]:text-[#a2a4a5] [&_small]:block [&_b]:text-[10px] [&_b]:block [&_b]:leading-[1.7] [&_b]:mt-[6px] [&_b]:font-bold [&_span]:text-[8px] [&_span]:block [&_span]:leading-[1.7] [&_span]:text-[#a2a4a5] max-[620px]:gap-[20px_13px] max-[620px]:[&_b]:text-[9px] max-[620px]:[&_small]:text-[8px]">
              <div>
                <small>Lifetime spent / cap</small>
                <b>
                  {amount(guardianSpent)} / {savedFields.cap} USDC
                </b>
              </div>
              <div>
                <small>Remaining lifetime budget</small>
                <b>{amount(remaining)} USDC</b>
              </div>
              <div>
                <small>Target health / cooldown</small>
                <b>
                  {savedFields.target || "Not set"}% / {savedFields.cooldown} min
                </b>
              </div>
              <div>
                <small>Fees / recipient</small>
                <b>1 USDC activation · 0 per action</b>
                <span>fees.demo.testnet</span>
              </div>
              <div>
                <small>Protected debt / allowed action</small>
                <b>{amount(guardianDebt)} USDC · Repay only</b>
              </div>
              <div>
                <small>Watcher heartbeat</small>
                <b>{watcherOnline ? "Online · simulated" : "Offline · simulated"}</b>
              </div>
            </div>
            <p className="fine-print text-[9px] leading-[1.8] text-[#a2a4a5] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
              Demo model: G1 Guardian-held loan. This does not transfer your existing wallet
              position. No contract is deployed. Fast markets, stale data, insufficient reserve and
              watcher downtime can still lead to liquidation.
            </p>
            <div className="replay-actions flex flex-wrap items-center gap-[10px] mt-[18px]">
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border-0 bg-[#bad7c3] px-4 py-2.5 text-xs font-semibold text-[#203327] transition-colors hover:bg-[#d3e5d7]"
                onClick={() => replay(false)}
              >
                <Play size={14} />
                Run simulated trigger
              </button>
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-xs font-medium text-[#c5cec7] transition-colors hover:bg-[#292d2b]"
                onClick={() => replay(true)}
              >
                Test over-limit rejection
              </button>
              {guardian !== "deactivated" && (
                <button
                  type="button"
                  className="text-button bg-transparent border-0 text-[10px]! font-extrabold! inline-flex items-center gap-[9px] danger-text text-[#ffb18c]! p-[7px_0]"
                  onClick={() => ownerAction("deactivate")}
                >
                  Deactivate Guardian
                </button>
              )}
            </div>
            <small className="fine-print text-[9px] leading-[1.8] text-[#a2a4a5] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
              Replays and rejections run locally. They are not on-chain evidence.
            </small>
          </div>
        )}
      </section>
    );
  }

  function activityContent() {
    return (
      <section className="activity-panel bg-[var(--paper)] [border:1px_solid_var(--line)] rounded-[20px] p-[28px] max-[620px]:p-[24px_20px]">
        <div data-panel-enter="0" className="flex items-center justify-end">
          <Tag>
            <History size={13} />
            {receipts.length} demo events
          </Tag>
        </div>
        {receipts.length ? (
          <div className="receipt-list mt-[25px]">
            {receipts.map((r, index) => (
              <button
                type="button"
                className="receipt-row flex items-center gap-[15px] p-[18px_0] border-0 [border-bottom:1px_solid_#313334] bg-transparent w-full text-left [&>svg]:ml-auto [&>svg]:text-[#a2a4a5] [&_b]:text-[12px] [&_b]:block [&_small]:text-[9px] [&_small]:block [&_small]:mt-[7px] [&_small]:text-[#a2a4a5] [&:hover]:bg-[#1c1e1f] max-[620px]:gap-[10px] max-[620px]:[&_b]:text-[11px] max-[620px]:[&_small]:text-[8px]"
                key={r.id}
                data-panel-enter={Math.min(index + 1, 5)}
                onClick={() => setSelectedReceipt(r)}
              >
                <span className={playClasses(`receipt-icon ${r.status}`)}>
                  {r.status === "confirmed" ? (
                    <CheckCheck size={21} />
                  ) : (
                    <AlertTriangle size={21} />
                  )}
                </span>
                <span>
                  <b>{r.title}</b>
                  <small>
                    Simulated · {r.at} · {r.status}
                  </small>
                </span>
                <ArrowUpRight size={19} />
              </button>
            ))}
          </div>
        ) : (
          <div
            data-panel-enter="1"
            className="empty-activity flex items-center flex-col text-center p-[65px_15px_75px] gap-[17px] [&>svg]:text-[#a2a4a5] [&_h3]:font-[family-name:var(--font-display)] [&_h3]:text-[30px] [&_h3]:font-medium [&_h3]:tracking-[-1px] [&_p]:text-[#a2a4a5] [&_p]:text-[11px] [&_p]:leading-[1.8] [&_p]:max-w-[340px] [&_.button]:mt-[8px]"
          >
            <History size={38} strokeWidth={1.3} />
            <h3>A clean slate.</h3>
            <p>Your demo receipts will land here after you try a repayment or set up Guardian.</p>
            <button
              type="button"
              className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-none [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] blue-button bg-[var(--blue)] text-[#203327]! [&:hover]:bg-[#a7c8b1]"
              onClick={() => {
                _ask("Should I repay or earn yield?");
              }}
            >
              Find my first move <ArrowRight size={17} />
            </button>
          </div>
        )}
        <p className="fine-print text-[9px] leading-[1.8] text-[#a2a4a5] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
          Demo receipts document local UI state. Real transaction hashes and explorer links only
          appear in the future live integration.
        </p>
      </section>
    );
  }

  function positionContent() {
    return (
      <PositionSummary
        state={dataState}
        health={healthText}
        debt={amount(debt)}
        liquidation={current.liquidation ? `$${Number(current.liquidation).toFixed(2)}` : "—"}
        comfort={comfort}
        noDebt={current.health === "no_debt"}
        change={lastChange}
        onRefresh={refresh}
        onSettings={() => setModal("settings")}
        onExplain={() => _ask("Explain my position")}
      />
    );
  }

  function toolContent(value: DetailTab) {
    if (value === "position") return positionContent();
    if (value === "guardian")
      return (
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {guardianContent()}
          <button
            type="button"
            onClick={() => _ask("What are my Guardian limits?")}
            data-panel-enter="5"
            className="mt-4 flex w-full items-center justify-between rounded-xl border border-[#313334] bg-[#1c1e1f] px-4 py-3 text-xs font-semibold"
          >
            Ask about my limits
            <ArrowUpRight size={16} />
          </button>
        </div>
      );
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-4 [&_.activity-panel]:border-0! [&_.activity-panel]:p-0! [&_.panel-heading]:flex-col [&_.panel-heading]:items-start [&_.panel-heading_h2]:text-[25px]!">
        {activityContent()}
      </div>
    );
  }

  const panelTitles: Record<Panel, string> = {
    chat: "Let's talk money.",
    voice: "I'm all ears.",
    position: "Here's where you stand.",
    guardian: "Meet your Guardian.",
    activity: "Every move, accounted for.",
  };
  const dockItems: { id: Panel; label: string; icon: ReactNode; color: string }[] = [
    {
      id: "chat",
      label: "Chat",
      icon: <MessageCircle size={25} strokeWidth={1.8} />,
      color: "bg-[#bad7c3] text-[#203327]",
    },
    {
      id: "position",
      label: "Position",
      icon: <BarChart3 size={25} strokeWidth={1.8} />,
      color: "bg-[#1c1e1f] text-[#edf3f5]",
    },
    {
      id: "voice",
      label: "Voice",
      icon: <Mic size={29} strokeWidth={1.8} />,
      color: "bg-[#ff643b] text-[#171b23]!",
    },
    {
      id: "guardian",
      label: "Guardian",
      icon: <ShieldCheck size={25} strokeWidth={1.8} />,
      color: "bg-[#dbf884] text-[#101a17]!",
    },
    {
      id: "activity",
      label: "Activity",
      icon: <History size={25} strokeWidth={1.8} />,
      color: "bg-[#1c1e1f] text-[#a2a4a5]",
    },
  ];
  return (
    <main
      style={keyboardHeight ? { height: keyboardHeight } : undefined}
      className="play-app fixed inset-0 isolate flex h-dvh w-full flex-col overflow-hidden [color-scheme:dark] [--dock-icon:44px] [--voice-icon:50px] [--dock-item:52px] sm:[--dock-icon:48px] sm:[--voice-icon:54px] sm:[--dock-item:60px] [--ink:#eeeeF3] [--cream:#202223] [--paper:#121415] [--orange:#ff956e] [--blue:#bad7c3] [--lime:#d7f8a4] [--line:#313334] bg-[#0c0e0f] font-[family-name:var(--font-body)] text-sm text-[#eeeef3] antialiased [&_*]:box-border [&_button]:cursor-pointer [&_button]:[font-family:inherit] [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-45 [&_input]:[font-family:inherit] [&_select]:[font-family:inherit] [&_a]:text-inherit [&_a]:no-underline [&_:where(h1,h2,h3,p)]:m-0 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[#c7d7ca] [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-[#c7d7ca] [&_svg]:shrink-0 selection:bg-[#e4d7ba] selection:text-[#151718] motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none!"
    >
      <h1 className="sr-only">Mr.Fund — your personal DeFi companion</h1>
      <div className="absolute inset-0 flex flex-col">
        {stage === "consult" && (
          <header
            inert={!chatRevealed}
            aria-hidden={!chatRevealed}
            className={`relative z-20 mx-auto flex h-[76px] w-full max-w-[1920px] shrink-0 items-center justify-between gap-3 px-4 md:h-[88px] md:px-8 transition-opacity duration-500 ${chatRevealed ? "opacity-100" : "opacity-0"} ${keyboardHeight || shortMobile ? "h-14!" : ""}`}
          >
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#e4d7ba] font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-2px] text-[#1f2122]">
                m.
              </span>
              <span className="font-[family-name:var(--font-display)] text-[22px] font-semibold tracking-[-1px]">
                mr.fund<span className="ml-1 align-top text-[9px] text-[#999b9c]">®</span>
              </span>
              <span className="ml-3 hidden border-l border-white/10 pl-4 text-[10px] text-[#818384] 2xl:block">
                A little clarity for your money.
              </span>
            </div>
            <div className="flex items-center gap-2">
              {stage === "consult" && (
                <section
                  aria-label="Position stats"
                  className="mr-3 hidden grid-cols-2 items-center gap-x-5 gap-y-1 text-sm lg:grid 2xl:grid-cols-[auto_auto_auto]"
                >
                  <span className="text-[#8f9192]">
                    Health{" "}
                    <b className="ml-2 text-base font-semibold text-[#d7f8a4] tabular-nums">
                      {healthText}
                    </b>
                  </span>
                  <span className="text-[#8f9192]">
                    Debt{" "}
                    <b className="ml-2 text-base font-semibold text-[#e4dfed] tabular-nums">
                      {dataState === "fresh" && debt > 0n ? `$${amount(debt)}` : "—"}
                    </b>
                  </span>
                  <span className="col-span-2 text-xs text-[#a2a4a5] 2xl:col-span-1">
                    SIMULATED · PnL unavailable
                  </span>
                </section>
              )}
              <button
                type="button"
                aria-label="Demo settings"
                onClick={() => setModal("settings")}
                className="grid size-9 place-items-center rounded-full border-0 bg-transparent text-[#989a9b] hover:bg-[#25292b]"
              >
                <Settings2 size={17} />
              </button>
              <button
                type="button"
                aria-label={sound ? "Mute spoken replies" : "Enable spoken replies"}
                aria-pressed={sound}
                onClick={() => {
                  if (!("speechSynthesis" in window)) {
                    setNotice(
                      "Spoken replies aren't supported by this browser. Text chat still works.",
                    );
                    return;
                  }
                  setSound((value) => !value);
                  window.speechSynthesis.cancel();
                }}
                className="grid size-9 place-items-center rounded-full border-0 bg-transparent text-[#989a9b] hover:bg-[#25292b]"
              >
                {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </button>
              <button
                type="button"
                aria-label="How it works"
                onClick={() => setModal("help")}
                className="hidden size-9 place-items-center rounded-full border-0 bg-transparent text-[#989a9b] hover:bg-[#25292b] sm:grid"
              >
                <CircleHelp size={17} />
              </button>
              {stage === "consult" && (
                <button
                  type="button"
                  onClick={() => setModal("wallet")}
                  className="ml-1 flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-[#202223] px-3 text-[11px] font-medium text-[#d8d5e0]"
                >
                  <Wallet size={15} />
                  <span className="hidden sm:block">
                    {connected ? "you.demo.testnet" : "Connect wallet"}
                  </span>
                  <span className="sr-only sm:hidden">
                    {connected ? "you.demo.testnet" : "Connect wallet"}
                  </span>
                </button>
              )}
            </div>
          </header>
        )}
        <div
          className={`mx-auto grid min-h-0 w-full max-w-[1920px] flex-1 gap-4 px-4 md:gap-5 md:px-8 ${keyboardHeight || shortMobile ? `grid-cols-1 grid-rows-[minmax(0,1fr)] ${keyboardHeight ? "pb-4" : "pb-[88px]"}` : "grid-rows-[164px_minmax(0,1fr)] pb-[100px] md:grid-cols-[.7fr_1.3fr] md:grid-rows-1 xl:grid-cols-[.8fr_1.45fr_1fr] xl:pb-6"}`}
        >
          <section
            aria-label="Your companion"
            hidden={chatRevealed && (keyboardHeight !== null || shortMobile)}
            className="relative col-start-1 row-start-1 min-h-0 min-w-0"
          >
            <ImmersiveSceneFrame immersive={!chatRevealed}>
              <CharacterPortrait
                mood={characterMood}
                speaking={speaking}
                speech={speechCue}
                wave={wave}
                station={stage === "welcome" ? "office" : "chat"}
                onEntranceComplete={finishEntrance}
              />
            </ImmersiveSceneFrame>
          </section>
          {stage === "welcome" && (
            <section
              aria-labelledby="welcome-title"
              className="fixed inset-x-0 bottom-[max(32px,env(safe-area-inset-bottom))] z-30 flex justify-center px-6"
            >
              <h2 id="welcome-title" className="sr-only">
                Start your consultation with Mr.Fund
              </h2>
              <button
                type="button"
                onClick={startConsultation}
                className="flex min-h-14 min-w-[260px] items-center justify-center gap-5 rounded-full border border-[#e0eee45c] bg-[#d3e5d7] px-7 text-sm font-semibold text-[#203327] transition-colors hover:bg-[#e1efe4]"
              >
                Start consultation <ArrowUpRight size={19} />
              </button>
            </section>
          )}

          {wide && (
            <aside
              aria-label="Consultation details"
              inert={!detailsRevealed}
              aria-hidden={!detailsRevealed}
              className={`relative z-10 col-start-3 row-start-1 hidden min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[#121415] xl:flex ${detailTab === "position" ? "bg-[url(/play/chat-texture.svg)] bg-repeat" : ""} ${panelReveal(detailsRevealed)}`}
            >
              <div className="shrink-0 px-4 pt-4">
                <ConsultationTabs
                  value={detailTab}
                  onChange={setDetailTab}
                  activityCount={receipts.length}
                />
              </div>
              <div
                id="consultation-detail-panel"
                role="tabpanel"
                aria-labelledby={`detail-tab-${detailTab}`}
                className="flex min-h-0 flex-1 flex-col"
              >
                <DetailContent key={`${detailTab}-${detailsRevealed}`}>
                  {toolContent(detailTab)}
                </DetailContent>
              </div>
            </aside>
          )}
          {panel && (
            <aside
              role={panel === "chat" ? "region" : "dialog"}
              aria-labelledby="office-panel-title"
              inert={!chatRevealed}
              aria-hidden={!chatRevealed}
              className={`relative z-10 col-start-1 ${keyboardHeight || shortMobile ? "row-start-1" : "row-start-2"} flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[#121415] md:col-start-2 md:row-start-1 [&_.chat-panel]:flex-1 ${panel === "position" ? "bg-[url(/play/chat-texture.svg)] bg-repeat" : ""} ${panelReveal(chatRevealed)}`}
            >
              <h2 id="office-panel-title" className="sr-only">
                {panelTitles[panel]}
              </h2>
              {!wide && panel !== "chat" && (
                <div className="flex shrink-0 justify-end px-4 pt-3">
                  <button
                    type="button"
                    ref={panelClose}
                    aria-label="Close overlay"
                    onClick={() => openPanel(null)}
                    className="grid size-8 shrink-0 place-items-center rounded-full border border-[#313334] bg-[#1c1e1f]"
                  >
                    <X size={17} />
                  </button>
                </div>
              )}
              {panel === "chat" && (
                <section className="chat-panel flex flex-1 min-h-0 flex-col bg-[#121415] bg-[url(/play/chat-texture.svg)] bg-repeat px-4 text-[#edf3f5] sm:px-5">
                  <div className="shrink-0 pb-2 pt-5 text-center font-[family-name:var(--font-display)] text-sm font-semibold tracking-[-.4px] text-[#edf3f5]">
                    mr.fund
                  </div>
                  <div
                    className="chat-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-2 pt-6 [scrollbar-width:thin] [scrollbar-color:#313334_transparent] sm:pt-8"
                    ref={scrollRef}
                    aria-live="polite"
                    aria-busy={thinking}
                  >
                    <div className="flex min-h-full flex-col justify-end">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`chat-message mb-5 flex items-end gap-2.5 ${message.role === "user" ? "justify-end pl-9" : "pr-4 sm:pr-8"}`}
                        >
                          {message.role === "assistant" && <ChatAvatar />}
                          <div
                            className={`min-w-0 max-w-[92%] rounded-[22px] px-4 py-3 text-[13px] leading-[1.7] [overflow-wrap:anywhere] [&_p]:whitespace-pre-wrap [&_p]:font-normal [&_p]:leading-[1.7] sm:text-sm ${message.role === "user" ? "rounded-br-[6px] bg-[#bad7c3] text-[#203327]" : "rounded-bl-[6px] bg-[#1f2122] text-[#d6d8d9]"}`}
                          >
                            <span className="sr-only">
                              {message.role === "assistant" ? "MR.FUND" : "YOU"}
                            </span>
                            {message.role === "assistant" ? (
                              <ReplyText
                                id={message.id}
                                text={message.text}
                                streaming={streamingId === message.id}
                                onComplete={finishText}
                              />
                            ) : (
                              <p>{message.text}</p>
                            )}
                            {message.kind === "scenario" && whatIf.ok && (
                              <div className="scenario-result [border:1px_solid_#313334] bg-[#1c1e1f] p-[13px] mt-[12px] rounded-[9px] [&_.tag]:text-[#a2a4a5] [&_.tag]:border-0 [&_.tag]:p-0 [&>div]:flex [&>div]:gap-[17px] [&>div]:items-center [&>div]:mt-[12px] [&>div>span]:text-[9px] [&>div>span]:flex [&>div>span]:flex-col [&>div>span]:gap-[3px] [&>div>span]:text-[#a2a4a5] [&_b]:font-[family-name:var(--font-display)] [&_b]:text-[22px] [&_b]:text-[#a2a4a5] [&>small]:text-[8px] [&>small]:text-[#a2a4a5] [&>small]:block [&>small]:mt-[10px]">
                                <Tag>SIMULATED WHAT-IF</Tag>
                                <div>
                                  <span>
                                    NEAR price <b>−20%</b>
                                  </span>
                                  <ArrowRight size={19} />
                                  <span>
                                    Health <b>{percent(whatIf.value.value.healthBps)}</b>
                                  </span>
                                </div>
                                <small>Engine calculation · no action executed</small>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {messages.length === 1 && (
                        <div className="prompt-grid mb-6 ml-[42px] flex flex-wrap gap-2 [&_button]:inline-flex [&_button]:items-center [&_button]:gap-2 [&_button]:rounded-full [&_button]:border [&_button]:border-[#313334] [&_button]:bg-transparent [&_button]:px-3.5 [&_button]:py-2.5 [&_button]:text-left [&_button]:text-[11px] [&_button]:font-medium [&_button]:text-[#a2a4a5] [&_button]:transition-colors [&_button:hover]:bg-[#1f2122] [&_button:hover]:text-[#edf3f5]">
                          {prompts.map((p) => (
                            <button type="button" key={p.label} onClick={() => _ask(p.text)}>
                              <span>{p.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {thinking && (
                        <div className="mb-5 flex items-end gap-2.5" role="status">
                          <ChatAvatar />
                          <div className="flex items-center gap-1.5 rounded-[22px] rounded-bl-[6px] bg-[#1f2122] px-4 py-4">
                            {[0, 150, 300].map((delay) => (
                              <span
                                key={delay}
                                aria-hidden="true"
                                className={`size-1.5 rounded-full bg-[#a2a4a5] motion-safe:animate-pulse ${delay === 150 ? "[animation-delay:150ms]" : delay === 300 ? "[animation-delay:300ms]" : ""}`}
                              />
                            ))}
                            <span className="sr-only">Checking the numbers…</span>
                          </div>
                        </div>
                      )}
                      {cardOpen && (
                        <div className="recommendation-card bg-[#1c1e1f] [border:1px_solid_#313334] rounded-[12px] p-[15px] m-[12px_0] [&_h3]:font-[family-name:var(--font-display)] [&_h3]:text-[24px] [&_h3]:tracking-[-.9px] [&_h3]:m-[5px_0] [&>p]:text-[10px] [&>p]:text-[#a2a4a5] [&>p]:mb-[15px] [&_details]:[border-top:1px_solid_#313334] [&_details]:pt-[10px] [&_details]:text-[8px] [&_details]:text-[#a2a4a5] [&_summary]:flex [&_summary]:items-center [&_summary]:justify-between [&_summary]:cursor-pointer [&_summary]:font-semibold [&_details_p]:mt-[10px] [&_details_p]:leading-[1.7]">
                          <div className="recommendation-heading flex items-center justify-between [&_.tag]:border-0 [&_.tag]:text-[var(--blue)] [&_.tag]:bg-[#1c1e1f] [&_.tag]:pl-[0]">
                            <Tag>
                              <Zap size={12} />
                              THE SMARTER MOVE
                            </Tag>
                            <button
                              type="button"
                              className="icon-button inline-flex items-center justify-center border-0 bg-transparent w-[32px] h-[32px] rounded-full p-0 [transition:background_.18s] [&:hover]:bg-[#8080801a]"
                              aria-label="Dismiss recommendation"
                              onClick={() => setCardOpen(false)}
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <h3>
                            {card?.ok ? card.value.headline : "Refresh before your next move"}
                          </h3>
                          {card?.ok ? (
                            <>
                              <p>Less debt. Less interest. More breathing room.</p>
                              <div className="comparison-bars flex flex-col gap-[12px] m-[18px_0] [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:flex-wrap [&>div]:gap-[5px] [&>div]:text-[8px] [&>div]:text-[#a2a4a5] [&_b]:text-[9px] [&_b]:text-[var(--ink)] [&_i]:block [&_i]:basis-[100%] [&_i]:h-[7px] [&_i]:rounded-[3px] [&_.repay-bar]:bg-[var(--blue)] [&_.yield-bar]:bg-[#1c1e1f] [&_.yield-bar]:max-w-[66.7%]">
                                <div>
                                  <span>Repay · avoided interest</span>
                                  <b>
                                    {comp.ok ? amount(comp.value.value.repaySaves) : "—"} USDC / yr
                                  </b>
                                  <i className="repay-bar" />
                                </div>
                                <div>
                                  <span>Supply · estimated yield</span>
                                  <b>
                                    {comp.ok ? amount(comp.value.value.yieldEarns) : "—"} USDC / yr
                                  </b>
                                  <i className="yield-bar" />
                                </div>
                              </div>
                              <div className="card-number-list tabular-nums [border-top:1px_solid_#313334] p-[6px_0] [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:p-[7px_0] [&>div]:gap-[10px] [&>div]:text-[8px] [&_span]:text-[#a2a4a5] [&_b]:flex [&_b]:items-center [&_b]:gap-[6px] [&_b]:font-bold [&_b]:text-[9px] [&_small]:text-[7px] [&_small]:text-[#a2a4a5]">
                                {card.value.numbers.map((n) => (
                                  <div key={n.label}>
                                    <span>{n.label}</span>
                                    <b>
                                      {n.before} <ArrowRight size={12} />
                                      {n.after ?? "—"} <small>{n.unit}</small>
                                    </b>
                                  </div>
                                ))}
                              </div>
                              {adjusting && (
                                <label className="adjust-field flex flex-col text-[9px] gap-[7px] m-[12px_0] [&_input]:bg-[#101923] [&_input]:[border:1px_solid_#313334] [&_input]:rounded-[6px] [&_input]:p-[10px] [&_input]:w-full [&_input]:text-[12px]">
                                  Repay amount (USDC)
                                  <input
                                    type="number"
                                    min="0.000001"
                                    step="0.01"
                                    value={repayAmount}
                                    onChange={(e) => setRepayAmount(e.target.value)}
                                  />
                                </label>
                              )}
                              <details>
                                <summary>
                                  Why this? Assumptions, fees & risks <ChevronDown size={13} />
                                </summary>
                                <p>
                                  Both rates are illustrative APRs, estimated linearly for 365 days
                                  without compounding. Borrow 21.00%; supply 14.01%. Demo input age:
                                  fresh.{" "}
                                  {card.value.cappedBy
                                    ? `Amount capped by ${card.value.cappedBy}.`
                                    : ""}
                                </p>
                                <p>
                                  Execution fee: 0.10 test USDC → fees.demo.testnet, charged on mock
                                  approval. Rates change. Repayment reduces liquidation risk within
                                  your limits; it cannot remove it.
                                </p>
                                {card.value.assumptions.map((a) => (
                                  <p key={a}>{a}</p>
                                ))}
                              </details>
                              <div className="card-actions flex gap-[9px] mt-[16px] [&>button]:flex-1 [&>button]:justify-center">
                                <button
                                  type="button"
                                  className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-none [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#313334] bg-transparent [&:hover]:bg-[#ffffff40] small"
                                  onClick={() => setAdjusting((v) => !v)}
                                >
                                  <SlidersHorizontal size={14} />
                                  Adjust
                                </button>
                                <button
                                  type="button"
                                  className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-none [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] blue-button bg-[var(--blue)] text-[#203327]! [&:hover]:bg-[#a7c8b1] small"
                                  onClick={executeRepay}
                                  disabled={unavailable}
                                >
                                  Execute now <ArrowUpRight size={15} />
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p>
                                {unavailable
                                  ? "Fresh position data is needed. Execute is blocked."
                                  : "Enter a positive amount. Your wallet must cover the repayment and its fee."}
                              </p>
                              {adjusting && (
                                <label className="adjust-field flex flex-col text-[9px] gap-[7px] m-[12px_0] [&_input]:bg-[#101923] [&_input]:[border:1px_solid_#313334] [&_input]:rounded-[6px] [&_input]:p-[10px] [&_input]:w-full [&_input]:text-[12px]">
                                  Repay amount (USDC)
                                  <input
                                    type="number"
                                    min="0.000001"
                                    step="0.01"
                                    value={repayAmount}
                                    onChange={(e) => setRepayAmount(e.target.value)}
                                  />
                                </label>
                              )}
                              <button
                                type="button"
                                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-none [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#313334] bg-transparent [&:hover]:bg-[#ffffff40] small"
                                onClick={unavailable ? refresh : () => setAdjusting(true)}
                              >
                                {unavailable ? "Refresh position" : "Adjust amount"}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {lastRepay && (
                        <button
                          type="button"
                          className="inline-receipt flex items-center text-left w-full [border:1px_solid_#313334] bg-[#1c1e1f] p-[14px_12px] gap-[10px] rounded-[9px] m-[10px_0] [&_b]:text-[11px] [&_b]:block [&_small]:text-[8px] [&_small]:text-[#a2a4a5] [&_small]:block [&_small]:mt-[4px] [&>svg]:ml-auto"
                          onClick={() => setSelectedReceipt(lastRepay)}
                        >
                          <span className="receipt-check w-[32px] h-[32px] grid place-items-center bg-[var(--lime)] text-[#101a17]! rounded-full text-[#a2a4a5]">
                            <Check size={20} />
                          </span>
                          <span>
                            <b>{lastRepay.title}</b>
                            <small>Demo receipt · Health {lastRepay.after}</small>
                          </span>
                          <ArrowUpRight size={18} />
                        </button>
                      )}
                      {messages.length > 1 && !thinking && streamingId === null && (
                        <div className="follow-up-prompts flex gap-[7px] flex-wrap mt-[14px] [&_button]:bg-transparent [&_button]:[border:1px_solid_#313334] [&_button]:rounded-[6px] [&_button]:p-[7px_8px] [&_button]:text-[8px] [&_button]:flex [&_button]:gap-[5px] [&_button]:items-center">
                          <button type="button" onClick={() => _ask("What if NEAR drops 20%?")}>
                            What if NEAR drops? <ArrowUpRight size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => _ask("What are my Guardian limits?")}
                          >
                            My Guardian limits <ArrowUpRight size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <form
                    className="chat-composer mb-4 mt-3 flex shrink-0 items-end gap-1 rounded-[28px] border border-white/8 bg-[#1f2122] p-1.5 transition-colors focus-within:border-[#e4d7ba4d]"
                    onSubmit={(event: FormEvent) => {
                      event.preventDefault();
                      _ask(input);
                    }}
                  >
                    <textarea
                      rows={1}
                      onFocus={() => setComposerFocused(true)}
                      onBlur={() => {
                        setComposerFocused(false);
                        setKeyboardHeight(null);
                      }}
                      className="block field-sizing-content min-h-11 max-h-32 min-w-0 flex-1 resize-none border-0 bg-transparent px-3 py-3 font-[family-name:var(--font-body)] text-base leading-5 text-[#eeeef3] outline-none! placeholder:text-[#757778] sm:text-sm"
                      aria-label="Message Mr.Fund"
                      placeholder="Write a message…"
                      value={input}
                      maxLength={500}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault();
                          if (input.trim() && !thinking && streamingId === null)
                            event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      disabled={thinking}
                    />
                    <div className="flex shrink-0 items-center gap-0.5 pb-1 pr-1 sm:gap-1">
                      <button
                        type="button"
                        aria-label="Clear conversation"
                        title="Clear conversation"
                        onClick={clearConversation}
                        className="grid size-9 place-items-center rounded-full border-0 bg-transparent text-[#a2a4a5] transition-colors hover:bg-[#2b2d2e] hover:text-[#edf3f5]"
                      >
                        <MoreHorizontal size={17} />
                      </button>
                      <button
                        type="button"
                        aria-label="Open voice input"
                        title="Voice input"
                        onClick={() => openPanel("voice")}
                        className="grid size-9 place-items-center rounded-full border-0 bg-transparent text-[#a2a4a5] transition-colors hover:bg-[#2b2d2e] hover:text-[#edf3f5]"
                      >
                        <Mic size={17} />
                      </button>
                      <button
                        type="submit"
                        aria-label="Send message"
                        disabled={!input.trim() || thinking || streamingId !== null}
                        className="grid size-9 place-items-center rounded-full border-0 bg-[#e4d7ba] text-[#26352a] transition-colors hover:bg-[#eee6d3] disabled:bg-[#323435] disabled:text-[#767879]"
                      >
                        {thinking ? (
                          <LoaderCircle size={17} className="animate-spin" />
                        ) : (
                          <ArrowUpRight size={20} />
                        )}
                      </button>
                    </div>
                  </form>
                </section>
              )}
              {panel === "voice" && (
                <VoicePanel
                  busy={thinking || streamingId !== null}
                  onSend={_ask}
                  onNotice={setNotice}
                />
              )}
              {panel !== "chat" && panel !== "voice" && (
                <DetailContent key={`${panel}-${chatRevealed}`}>{toolContent(panel)}</DetailContent>
              )}
            </aside>
          )}
        </div>
        {stage === "consult" && chatRevealed && !wide && keyboardHeight === null && (
          <nav
            aria-label="Office actions"
            className="absolute inset-x-0 bottom-[max(8px,env(safe-area-inset-bottom))] z-30 mx-auto flex w-max max-w-[calc(100%_-_16px)] items-end gap-2 px-2 pb-2 pt-3 sm:gap-5 sm:px-6 sm:pb-3 [@media(max-height:600px)]:gap-1! [@media(max-height:600px)]:py-2"
          >
            {dockItems.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-label={item.label}
                aria-pressed={panel === item.id}
                onClick={() => openPanel(panel === item.id ? null : item.id)}
                className={`group flex w-[var(--dock-item)] flex-col items-center gap-2 [@media(max-height:600px)]:gap-1 border-0 bg-transparent p-0 transition-transform duration-200 hover:-translate-y-1 ${item.id === "voice" ? "-mt-5 [@media(max-height:600px)]:-mt-2" : ""}`}
              >
                <span
                  className={`relative grid size-[var(--dock-icon)] place-items-center rounded-[19px] border border-white/8 shadow-none transition-transform group-active:translate-y-1 group-active:shadow-none ${item.color} ${item.id === "voice" ? "size-[var(--voice-icon)]! rounded-[23px]!" : ""} ${panel === item.id ? "outline-2 outline-offset-4 outline-[#ff643b]" : ""}`}
                >
                  {item.icon}
                  {item.id === "activity" && receipts.length > 0 && (
                    <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full border border-[#313334] bg-[#ff643b] text-[#171b23]! text-[8px] font-bold">
                      {receipts.length}
                    </span>
                  )}
                </span>
                <span className="text-[8px] font-bold tracking-[.04em] text-[#a2a4a5] sm:text-[10px]">
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {wide && voiceOpen && (
        <ModalFrame
          title="Speak with Mr.Fund."
          eyebrow="VOICE CONSULTATION"
          close={() => setVoiceOpen(false)}
        >
          <VoicePanel
            busy={thinking || streamingId !== null}
            onSend={(question) => {
              setVoiceOpen(false);
              _ask(question);
            }}
            onNotice={setNotice}
          />
        </ModalFrame>
      )}
      <div className="relative z-40">
        {notice && (
          <div
            className="play-toast fixed right-[max(16px,env(safe-area-inset-right))] top-[max(16px,env(safe-area-inset-top))] z-[100] grid w-[380px] max-w-[calc(100vw_-_32px)] grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-[20px] border border-white/10 bg-[#1c1e1f] p-4 text-[#edf3f5] transition-[opacity,translate] duration-200 ease-out starting:-translate-y-2 starting:opacity-0 motion-reduce:transition-none"
            role="status"
            aria-atomic="true"
          >
            <span className="mt-0.5 grid size-9 place-items-center rounded-[12px] bg-[#bad7c314] text-[#bad7c3]">
              <Info size={18} strokeWidth={1.7} />
            </span>
            <div className="min-w-0 py-0.5">
              <p className="font-[family-name:var(--font-display)] text-[13px] font-semibold tracking-[-.2px]">
                Mr.Fund
              </p>
              <p className="mt-1.5! text-[13px] leading-[1.6] text-[#b8bdbc] [overflow-wrap:anywhere]">
                {notice}
              </p>
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
              className="-mr-1 -mt-1 grid size-9 place-items-center rounded-full border-0 bg-transparent text-[#818a85] transition-colors hover:bg-[#2b2f2d] hover:text-[#edf3f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bad7c3]"
            >
              <X size={16} strokeWidth={1.7} />
            </button>
          </div>
        )}

        {modal === "wallet" && (
          <ModalFrame
            wallet
            eyebrow="YOUR CONSULTATION"
            title={
              connected
                ? "Your mock wallet."
                : stage === "welcome"
                  ? "Connect to begin."
                  : "Come on in."
            }
            close={() => setModal(null)}
          >
            <span className="mt-5 inline-flex items-center gap-2 text-[9px] font-medium tracking-[.08em] text-[#a2a4a5]">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-[#bad7c3]" />
              NETWORK · TESTNET · SIMULATED
            </span>
            <p className="mt-4! max-w-[320px] text-[13px] leading-[1.8] text-[#a2a4a5]">
              {connected
                ? "Connected to a local demo identity. These tokens are simulated balances."
                : "Meet Mr.Fund with a demo wallet. No setup or signature needed."}
            </p>
            {connected ? (
              <>
                <div className="wallet-account flex items-center gap-[10px] p-[16px_0_24px] [&_b]:text-[12px] [&_small]:text-[10px] [&_small]:text-[#a2a4a5] [&_small]:block [&_small]:mt-[5px] [&_.icon-button]:ml-auto">
                  <span className="wallet-avatar h-[40px] w-[40px] bg-[var(--lime)] text-[#101a17]! grid place-items-center rounded-full font-[family-name:var(--font-display)] text-[21px]">
                    Y
                  </span>
                  <div>
                    <b>you.demo.testnet</b>
                    <small>{amount(walletBalance)} test USDC available</small>
                  </div>
                  <button
                    type="button"
                    className="icon-button inline-flex items-center justify-center border-0 bg-transparent w-[32px] h-[32px] rounded-full p-0 [transition:background_.18s] [&:hover]:bg-[#8080801a]"
                    aria-label="Copy mock account"
                    onClick={() => {
                      navigator.clipboard?.writeText("you.demo.testnet");
                      setNotice("Mock account copied.");
                    }}
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-none [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#313334] bg-transparent [&:hover]:bg-[#ffffff40] full-width w-full"
                  onClick={() => {
                    setConnected(false);
                    setModal(null);
                    setNotice("Mock wallet disconnected.");
                  }}
                >
                  <LogOut size={17} />
                  Disconnect mock wallet
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-label={connecting ? "Connecting demo wallet" : "Connect demo wallet"}
                  className="group relative mt-7 flex w-full flex-col items-stretch gap-6 overflow-hidden rounded-[22px] border-0 bg-[#d3e5d7] p-5 text-left text-[#203327] transition-colors hover:bg-[#e1efe4] disabled:cursor-wait sm:p-6"
                  disabled={connecting}
                  onClick={connectDemoWallet}
                >
                  <div className="flex items-start justify-between">
                    {connecting ? (
                      <LoaderCircle size={30} className="animate-spin" />
                    ) : (
                      <Wallet size={30} strokeWidth={1.4} />
                    )}
                    <span className="text-[9px] font-semibold uppercase tracking-[.15em] text-[#52685b]">
                      Demo access / 01
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <b className="block font-[family-name:var(--font-display)] text-[25px] font-medium leading-tight tracking-[-.8px]">
                        Demo wallet
                      </b>
                      <small className="mt-2 block text-[11px] text-[#52685b]">
                        {connecting
                          ? "Connecting to the simulated testnet…"
                          : "1,000 test USDC · instant connection"}
                      </small>
                    </div>
                    <ArrowUpRight
                      size={26}
                      strokeWidth={1.5}
                      className="mb-1 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none"
                    />
                  </div>
                </button>
                <div className="pb-2 pt-7">
                  <p className="text-center text-[11px] text-[#858d89]">Your own wallet, next.</p>
                  <div className="mx-auto mt-5 grid max-w-[280px] grid-cols-3 gap-6">
                    {[
                      { name: "Meteor", logo: "/play/wallets/meteor.svg", treatment: "" },
                      { name: "Intear", logo: "/play/wallets/intear.svg", treatment: "" },
                      { name: "NEAR", logo: "/play/tokens/near.svg", treatment: "invert" },
                    ].map((provider) => (
                      <span
                        key={provider.name}
                        className="flex flex-col items-center gap-3 text-[11px] font-medium text-[#bbc3be]"
                      >
                        <Image
                          src={provider.logo}
                          alt=""
                          width={40}
                          height={40}
                          className={`size-10 object-contain ${provider.treatment}`}
                        />
                        {provider.name}
                      </span>
                    ))}
                  </div>
                  <p className="mt-5! text-center text-[10px] text-[#747c78]">
                    Coming with the live integration
                  </p>
                </div>
              </>
            )}
            <p className="mt-6! flex items-center justify-center gap-2 text-[10px] leading-relaxed text-[#8b948f]">
              <LockKeyhole size={12} />
              Mr.Fund never asks for your private key.
            </p>
          </ModalFrame>
        )}
        {modal === "settings" && (
          <ModalFrame
            eyebrow="BEHIND THE SCENES"
            title="Make the demo yours."
            close={() => setModal(null)}
          >
            <label className="form-field flex flex-col gap-[8px] mt-[21px] min-w-0 [&>span]:text-[10px] [&>span]:font-bold [&>span]:flex [&>span]:justify-between [&>span_small]:text-[8px] [&>span_small]:font-normal [&>span_small]:text-[#a2a4a5] [&_input]:p-[12px] [&_input]:bg-[#1c1e1f] [&_input]:[border:1px_solid_#313334] [&_input]:rounded-[7px] [&_input]:text-[12px] [&_input]:text-[var(--ink)] [&_input]:w-full [&_input]:min-w-0 [&_select]:p-[12px] [&_select]:bg-[#1c1e1f] [&_select]:[border:1px_solid_#313334] [&_select]:rounded-[7px] [&_select]:text-[12px] [&_select]:text-[var(--ink)] [&_select]:w-full [&_select]:min-w-0 [&>small]:text-[8px] [&>small]:leading-[1.5] [&>small]:text-[#a2a4a5] max-[620px]:[&>span]:text-[9px] max-[620px]:[&_input]:text-[11px] max-[620px]:[&_input]:p-[11px_9px] max-[620px]:[&_select]:text-[11px] max-[620px]:[&_select]:p-[11px_9px] max-[620px]:[&>small]:text-[7px]">
              <span>Position data state</span>
              <select
                value={dataState}
                onChange={(e) => {
                  setDataState(e.target.value as DataState);
                  setNow(Date.now());
                }}
              >
                <option value="fresh">Fresh — ready to explore</option>
                <option value="loading">Loading — input in flight</option>
                <option value="stale">Stale — advice and execution blocked</option>
                <option value="empty">Empty — no lending position</option>
                <option value="error">Error — simulated RPC failure</option>
              </select>
            </label>
            <label className="form-field flex flex-col gap-[8px] mt-[21px] min-w-0 [&>span]:text-[10px] [&>span]:font-bold [&>span]:flex [&>span]:justify-between [&>span_small]:text-[8px] [&>span_small]:font-normal [&>span_small]:text-[#a2a4a5] [&_input]:p-[12px] [&_input]:bg-[#1c1e1f] [&_input]:[border:1px_solid_#313334] [&_input]:rounded-[7px] [&_input]:text-[12px] [&_input]:text-[var(--ink)] [&_input]:w-full [&_input]:min-w-0 [&_select]:p-[12px] [&_select]:bg-[#1c1e1f] [&_select]:[border:1px_solid_#313334] [&_select]:rounded-[7px] [&_select]:text-[12px] [&_select]:text-[var(--ink)] [&_select]:w-full [&_select]:min-w-0 [&>small]:text-[8px] [&>small]:leading-[1.5] [&>small]:text-[#a2a4a5] max-[620px]:[&>span]:text-[9px] max-[620px]:[&_input]:text-[11px] max-[620px]:[&_input]:p-[11px_9px] max-[620px]:[&_select]:text-[11px] max-[620px]:[&_select]:p-[11px_9px] max-[620px]:[&>small]:text-[7px]">
              <span>Your comfort line (%)</span>
              <input
                type="number"
                min="105"
                max="1000"
                value={comfort}
                onChange={(e) => setComfort(e.target.value)}
              />
              <small>Mr.Fund becomes concerned below this line. This is not a guarantee.</small>
            </label>
            <label className="switch-row flex items-center justify-between m-[25px_0] [&_b]:text-[11px] [&_small]:block [&_small]:text-[9px] [&_small]:text-[#a2a4a5] [&_small]:mt-[5px] [&_input]:w-[19px] [&_input]:h-[19px] [&_input]:[accent-color:var(--blue)]">
              <span>
                <b>Watcher online</b>
                <small>Simulate an offline Guardian watcher</small>
              </span>
              <input
                type="checkbox"
                checked={watcherOnline}
                onChange={(e) => setWatcherOnline(e.target.checked)}
              />
            </label>
            <button
              type="button"
              className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-none [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#313334] bg-transparent [&:hover]:bg-[#ffffff40] full-width w-full"
              onClick={reset}
            >
              <RefreshCw size={16} />
              Reset all demo activity
            </button>
            <p className="fine-print text-[9px] leading-[1.8] text-[#a2a4a5] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
              Settings affect this tab's demo session only. Reloading starts a fresh session.
            </p>
          </ModalFrame>
        )}
        {modal === "help" && (
          <ModalFrame
            eyebrow="A LITTLE CONTEXT"
            title="Real idea. Demo office."
            close={() => setModal(null)}
          >
            <div className="help-block flex gap-[14px] mt-[26px] [&_b]:text-[12px] [&_p]:text-[10px] [&_p]:text-[#a2a4a5] [&_p]:leading-[1.8] [&_p]:mt-[7px]">
              <span className="help-number w-[28px] h-[28px] bg-[var(--lime)] text-[#101a17]! rounded-[7px] grid place-items-center text-[10px] shrink-0">
                01
              </span>
              <div>
                <b>Talk it through.</b>
                <p>
                  Explore position summaries, repay-versus-yield, and price-drop scenarios. Chat
                  responses are scripted; financial outputs use the existing deterministic engine on
                  illustrative inputs.
                </p>
              </div>
            </div>
            <div className="help-block flex gap-[14px] mt-[26px] [&_b]:text-[12px] [&_p]:text-[10px] [&_p]:text-[#a2a4a5] [&_p]:leading-[1.8] [&_p]:mt-[7px]">
              <span className="help-number w-[28px] h-[28px] bg-[var(--lime)] text-[#101a17]! rounded-[7px] grid place-items-center text-[10px] shrink-0">
                02
              </span>
              <div>
                <b>Try a move.</b>
                <p>
                  Connect the mock wallet, adjust a repayment, and approve it. You can simulate
                  rejection, failure, or a partial batch before approval.
                </p>
              </div>
            </div>
            <div className="help-block flex gap-[14px] mt-[26px] [&_b]:text-[12px] [&_p]:text-[10px] [&_p]:text-[#a2a4a5] [&_p]:leading-[1.8] [&_p]:mt-[7px]">
              <span className="help-number w-[28px] h-[28px] bg-[var(--lime)] text-[#101a17]! rounded-[7px] grid place-items-center text-[10px] shrink-0">
                03
              </span>
              <div>
                <b>Set your limits.</b>
                <p>
                  Activate a simulated Guardian, inspect its rules, run a labelled replay or
                  over-limit test, then pause, deactivate, or withdraw.
                </p>
              </div>
            </div>
            <p className="risk-note flex gap-[9px] bg-[#1c1e1f] p-[15px] rounded-[9px] text-[9px] leading-[1.8] text-[#a2a4a5] mt-[24px]!">
              <Shield size={18} />
              The live product aims to reduce liquidation risk within your limits. It cannot prevent
              liquidation. Guardian and Rhea have smart-contract risks; hackathon code is unaudited.
            </p>
            <p className="mt-5! text-[9px] leading-relaxed text-[#a2a4a5]">
              Character:{" "}
              <a
                className="underline underline-offset-2"
                href="https://github.com/microsoft/Microsoft-Rocketbox"
                target="_blank"
                rel="noreferrer"
              >
                Business Male 01 by Microsoft Rocketbox
              </a>
              —{" "}
              <a
                className="underline underline-offset-2"
                href="https://github.com/microsoft/Microsoft-Rocketbox/blob/master/LICENSE.md"
                target="_blank"
                rel="noreferrer"
              >
                MIT License
              </a>
              . Optimized for this demo with facial blendshapes and procedural body animation.
            </p>
          </ModalFrame>
        )}
        {modal === "setup" && (
          <ModalFrame
            eyebrow={setupReview ? "YOUR RULES, IN PLAIN WORDS" : "LET'S SET SOME BOUNDARIES"}
            title={setupReview ? "Your Guardian. Your terms." : "A Guardian on your terms."}
            close={() => {
              setModal(null);
              setSetupReview(false);
            }}
            wide
          >
            <div className="setup-steps flex items-center gap-[10px] mt-[24px] [&>span]:text-[9px] [&>span]:text-[#a2a4a5] [&>span]:font-semibold [&>span.current]:text-[var(--blue)] [&>i]:flex-1 [&>i]:h-[1px] [&>i]:bg-[#1c1e1f] max-[620px]:[&>span]:text-[8px]">
              <span className={playClasses(!setupReview ? "current" : "")}>01 Configure</span>
              <i />
              <span className={playClasses(setupReview ? "current" : "")}>02 Review</span>
              <i />
              <span>03 Mock approval</span>
            </div>
            <div className="setup-position flex items-center gap-[11px] bg-[#1c1e1f] p-[15px] [border:1px_solid_#313334] rounded-[9px] mt-[23px] [&>span]:flex-1 [&>span]:min-w-0 [&_b]:block [&_b]:text-[11px] [&_small]:block [&_small]:text-[8px] [&_small]:leading-[1.6] [&_small]:mt-[5px] [&_small]:text-[#a2a4a5] [&_.tag]:text-[7px] [&_.tag]:text-[#a2a4a5] [&_.tag]:[border-color:#d6dfc7] max-[620px]:p-[12px] max-[620px]:gap-[8px] max-[620px]:[&_b]:text-[9px] max-[620px]:[&_small]:text-[7px] max-[620px]:[&_.tag]:hidden">
              <Shield size={20} />
              <span>
                <b>Guardian-held loan · NEAR / USDC</b>
                <small>Separate simulated position. Your wallet loan stays where it is.</small>
              </span>
              <Tag>G1 DEMO</Tag>
            </div>
            {!setupReview ? (
              <>
                <div className="fixed-action mt-[23px] [&_small]:text-[8px] [&_small]:tracking-[.08em] [&_small]:text-[#a2a4a5] [&_b]:flex [&_b]:items-center [&_b]:justify-between [&_b]:text-[11px] [&_b]:mt-[9px] [&_b]:pb-[15px] [&_b]:[border-bottom:1px_solid_var(--line)]">
                  <small>ALLOWED ACTION</small>
                  <b>
                    Repay USDC debt from my reserve <LockKeyhole size={14} />
                  </b>
                </div>
                <div className="setup-form-grid grid grid-cols-[1fr_1fr] gap-x-[20px] max-[620px]:gap-x-[12px]">
                  {field("max", "Maximum per action", "USDC", "Largest single repayment.")}
                  {field(
                    "cap",
                    "Lifetime spending cap",
                    "USDC",
                    "At least your per-action maximum.",
                  )}
                  {field("floor", "Reserve to keep", "USDC", "Automation never spends below this.")}
                  {field("deposit", "Reserve deposit", "USDC", "Activation fee is added on top.")}
                  {field(
                    "trigger",
                    "Trigger below health",
                    "%",
                    "Minimum 105%; liquidation line is 100%.",
                  )}
                  {field(
                    "target",
                    "Target health after action",
                    "%",
                    "Must be above your trigger.",
                    true,
                  )}
                  {field("cooldown", "Time between actions", "min", "Minimum 5 minutes.")}
                </div>
                {policyValidation() && (
                  <p
                    className="field-error flex items-start gap-[6px] text-[#ffb18c] text-[10px] leading-[1.7] mt-[18px]!"
                    role="alert"
                  >
                    <AlertTriangle size={15} />
                    {policyValidation()}
                  </p>
                )}
              </>
            ) : (
              <div className="policy-summary pt-[20px] [&_p]:text-[13px] [&_p]:leading-[1.9] [&_p]:text-[#a2a4a5] [&_p]:mt-[13px] [&_b]:text-[var(--ink)] [&_b]:font-bold max-[620px]:[&_p]:text-[12px]">
                <p>
                  When the simulated Guardian loan's health falls below{" "}
                  <b>{policyFields.trigger}%</b>, it may repay up to <b>{policyFields.max} USDC</b>{" "}
                  per action, with at least <b>{policyFields.cooldown} minutes</b> between actions.
                </p>
                <p>
                  It will keep at least <b>{policyFields.floor} USDC</b> in reserve and spend no
                  more than <b>{policyFields.cap} USDC</b> over this activation.{" "}
                  {policyFields.target && (
                    <>
                      The sizing target is <b>{policyFields.target}%</b> health.
                    </>
                  )}
                </p>
                <p>
                  You deposit <b>{policyFields.deposit} USDC</b> into the demo reserve. Pause or
                  deactivate whenever you want, and withdraw unused reserve.
                </p>
              </div>
            )}
            <div className="fee-box bg-[#1c1e1f] rounded-[9px] p-[15px] mt-[23px] flex flex-col gap-[11px] [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:text-[10px] [&>div]:gap-[8px] [&>div>span]:flex [&>div>span]:items-center [&>div>span]:gap-[8px] [&_.tag]:text-[6px] [&_.tag]:text-[#a2a4a5] [&_.tag]:p-[3px_4px] [&_b]:text-[10px] [&_b]:whitespace-nowrap [&>small]:text-[8px] [&>small]:text-[#a2a4a5] [&>small]:leading-[1.7] max-[620px]:p-[12px] max-[620px]:[&_.tag]:text-[5px] max-[620px]:[&_.tag]:tracking-[0] max-[620px]:[&>div]:text-[8px] max-[620px]:[&_b]:text-[8px] max-[620px]:[&>small]:text-[7px]">
              <div>
                <span>
                  Activation fee <Tag>EXAMPLE PRICING</Tag>
                </span>
                <b>1.00 test USDC</b>
              </div>
              <div>
                <span>Per-action fee</span>
                <b>0.00 test USDC</b>
              </div>
              <small>
                Recipient: fees.demo.testnet · Demo pricing only; live pricing is undecided.
              </small>
            </div>
            <p className="fine-print text-[9px] leading-[1.8] text-[#a2a4a5] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
              This flow simulates a separate Guardian account and loan. No account is created and no
              tokens move on-chain. Protection cannot prevent liquidation.
            </p>
            <div className="modal-actions flex gap-[10px] justify-end mt-[25px] [&_.button]:flex-1 [&_.button]:text-[10px]! max-[620px]:gap-[8px] max-[620px]:[&_.button]:text-[9px]! max-[620px]:[&_.button]:p-[12px_9px] max-[620px]:[&_.button]:gap-[6px]">
              <button
                type="button"
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-none [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#313334] bg-transparent [&:hover]:bg-[#ffffff40]"
                onClick={setupReview ? () => setSetupReview(false) : () => setModal(null)}
              >
                {setupReview ? "Back to edit" : "Maybe later"}
              </button>
              <button
                type="button"
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-none [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] blue-button bg-[var(--blue)] text-[#203327]! [&:hover]:bg-[#a7c8b1]"
                disabled={!!policyValidation()}
                onClick={setupReview ? activate : () => setSetupReview(true)}
              >
                {setupReview ? "Approve in mock wallet" : "Review my rules"}
                <ArrowRight size={17} />
              </button>
            </div>
          </ModalFrame>
        )}
        {pending && (
          <ModalFrame
            eyebrow="MOCK WALLET · NO REAL SIGNATURE"
            title={signing ? "Making your move…" : pending.title}
            close={() => {
              if (!signing) setPending(null);
            }}
          >
            <p className="modal-copy text-[12px] leading-[1.8] text-[#a2a4a5] m-[20px_0]! max-[620px]:text-[11px]">
              {pending.description}
            </p>
            <div className="approval-amount flex flex-col gap-[11px] items-center bg-[#1c1e1f] p-[27px_15px] rounded-[11px] text-center [&_small]:text-[8px] [&_small]:tracking-[.1em] [&_small]:text-[#a2a4a5] [&_b]:font-[family-name:var(--font-display)] [&_b]:text-[25px] [&_b]:tracking-[-.7px] [&_span]:text-[9px] [&_span]:text-[#a2a4a5] max-[620px]:[&_b]:text-[23px]">
              <small>YOU AUTHORIZE IN THIS DEMO</small>
              <b>{pending.amount}</b>
              <span>Account: you.demo.testnet</span>
            </div>
            <label className="form-field flex flex-col gap-[8px] mt-[21px] min-w-0 [&>span]:text-[10px] [&>span]:font-bold [&>span]:flex [&>span]:justify-between [&>span_small]:text-[8px] [&>span_small]:font-normal [&>span_small]:text-[#a2a4a5] [&_input]:p-[12px] [&_input]:bg-[#1c1e1f] [&_input]:[border:1px_solid_#313334] [&_input]:rounded-[7px] [&_input]:text-[12px] [&_input]:text-[var(--ink)] [&_input]:w-full [&_input]:min-w-0 [&_select]:p-[12px] [&_select]:bg-[#1c1e1f] [&_select]:[border:1px_solid_#313334] [&_select]:rounded-[7px] [&_select]:text-[12px] [&_select]:text-[var(--ink)] [&_select]:w-full [&_select]:min-w-0 [&>small]:text-[8px] [&>small]:leading-[1.5] [&>small]:text-[#a2a4a5] max-[620px]:[&>span]:text-[9px] max-[620px]:[&_input]:text-[11px] max-[620px]:[&_input]:p-[11px_9px] max-[620px]:[&_select]:text-[11px] max-[620px]:[&_select]:p-[11px_9px] max-[620px]:[&>small]:text-[7px]">
              <span>Demo transaction outcome</span>
              <select
                disabled={signing}
                value={walletOutcome}
                onChange={(e) => setWalletOutcome(e.target.value)}
              >
                <option value="success">Confirmed — apply demo action</option>
                <option value="cancel">Wallet rejection — keep draft</option>
                <option value="failure">Transaction failure — keep balances</option>
                <option value="partial">Partial batch — review receipt</option>
              </select>
            </label>
            <div className="modal-actions flex gap-[10px] justify-end mt-[25px] [&_.button]:flex-1 [&_.button]:text-[10px]! max-[620px]:gap-[8px] max-[620px]:[&_.button]:text-[9px]! max-[620px]:[&_.button]:p-[12px_9px] max-[620px]:[&_.button]:gap-[6px]">
              <button
                type="button"
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-none [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#313334] bg-transparent [&:hover]:bg-[#ffffff40]"
                disabled={signing}
                onClick={() => {
                  setPending(null);
                  setNotice("You cancelled. Your draft is still here.");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-none [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] blue-button bg-[var(--blue)] text-[#203327]! [&:hover]:bg-[#a7c8b1]"
                disabled={signing}
                onClick={confirmPending}
              >
                {signing ? (
                  <LoaderCircle className="spin animate-spin" size={17} />
                ) : (
                  <Check size={17} />
                )}
                {signing ? "Simulating…" : "Approve demo action"}
              </button>
            </div>
          </ModalFrame>
        )}
        {selectedReceipt && (
          <ModalFrame
            eyebrow="A RECORD, NOT A PROMISE"
            title="Your demo receipt."
            close={() => setSelectedReceipt(null)}
          >
            <div className={playClasses(`receipt-banner ${selectedReceipt.status}`)}>
              <span>
                {selectedReceipt.status === "confirmed" ? (
                  <BadgeCheck size={27} />
                ) : (
                  <AlertTriangle size={27} />
                )}
              </span>
              <div>
                <b>{selectedReceipt.title}</b>
                <small>
                  {selectedReceipt.status.toUpperCase()} · SIMULATED · {selectedReceipt.at}
                </small>
              </div>
            </div>
            <p className="modal-copy text-[12px] leading-[1.8] text-[#a2a4a5] m-[20px_0]! max-[620px]:text-[11px]">
              {selectedReceipt.detail}
            </p>
            {selectedReceipt.before && (
              <div className="receipt-health flex items-center justify-between [border:1px_solid_#313334] rounded-[8px] p-[14px_12px] gap-[10px] [&>span]:text-[10px] [&>span]:text-[#a2a4a5] [&_b]:flex [&_b]:gap-[8px] [&_b]:items-center [&_b]:font-[family-name:var(--font-display)] [&_b]:text-[15px] max-[620px]:p-[12px_9px] max-[620px]:[&>span]:text-[8px] max-[620px]:[&_b]:text-[13px]">
                <span>Position health</span>
                <b>
                  {selectedReceipt.before}
                  <ArrowRight size={18} />
                  {selectedReceipt.after}
                </b>
              </div>
            )}
            <div className="receipt-metadata mt-[16px] [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:p-[12px_0] [&>div]:[border-bottom:1px_solid_#313334] [&>div]:text-[10px] [&_span]:text-[#a2a4a5] [&_b]:text-[9px] [&~.button]:mt-[22px]">
              <div>
                <span>Reference</span>
                <b>DEMO-{String(selectedReceipt.id).padStart(4, "0")}</b>
              </div>
              <div>
                <span>Network</span>
                <b>Local simulation</b>
              </div>
              <div>
                <span>Transaction hash</span>
                <b>Not submitted</b>
              </div>
            </div>
            <p className="fine-print text-[9px] leading-[1.8] text-[#a2a4a5] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
              No explorer link: this is a local UI simulation. The result is computed from the
              updated demo fixture, not observed on-chain.
            </p>
            <button
              type="button"
              className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-none [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] blue-button bg-[var(--blue)] text-[#203327]! [&:hover]:bg-[#a7c8b1] full-width w-full"
              onClick={() => {
                setSelectedReceipt(null);
                openPanel("activity");
              }}
            >
              View all activity <ArrowRight size={16} />
            </button>
          </ModalFrame>
        )}
      </div>
    </main>
  );
}
