"use client";

import { mood as computeMood } from "@mrfund/engine";
import { type GuardianPolicy, validatePolicy } from "@mrfund/shared";
import {
  AlertTriangle,
  ArrowDownRight,
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
  Sparkles,
  Volume2,
  VolumeX,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
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
import { playClasses } from "./styles";
import { VoicePanel } from "./VoicePanel";

const WorldScene = dynamic(() => import("./WorldScene").then((m) => m.WorldScene), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-0 bg-[#1c2331]">
      <span className="absolute bottom-[36%] left-0 w-full animate-pulse text-center text-[11px] font-semibold text-[#dcdfe6]">
        Opening the office…
      </span>
    </div>
  ),
});
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
    icon: <Sparkles size={16} />,
    label: "Find my smartest move",
    text: "Should I repay or earn yield?",
  },
  {
    icon: <ArrowDownRight size={17} />,
    label: "What if NEAR drops 20%?",
    text: "What if NEAR drops 20%?",
  },
  { icon: <Shield size={16} />, label: "Meet my Guardian", text: "What can Guardian do for me?" },
  { icon: <CircleHelp size={16} />, label: "Explain my position", text: "Explain my position" },
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
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
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
      className={playClasses(`play-modal ${wide ? "wide" : ""}`)}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-inner p-[27px] max-[620px]:p-[23px_20px]">
        <div className="modal-heading flex justify-between items-start gap-[10px] [&_.eyebrow]:text-[#a8b8c4] [&_.eyebrow]:text-[8px] [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[30px] [&_h2]:font-medium [&_h2]:leading-[1.15] [&_h2]:tracking-[-1.2px] [&_h2]:mt-[7px] [&>.icon-button]:bg-[#1d2833] [&>.icon-button]:w-[30px] [&>.icon-button]:h-[30px] [&>.icon-button]:shrink-0 max-[620px]:[&_h2]:text-[27px] max-[620px]:[&_.eyebrow]:text-[7px]">
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
function Stat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <span className={`flex flex-col px-3 py-1.5 sm:px-4 sm:py-2 ${className}`}>
      <span className="text-[8px] font-bold tracking-[.13em] text-[#a8b8c4]">{label}</span>
      <b className="font-[family-name:var(--font-display)] text-base tabular-nums capitalize sm:text-xl">
        {value}
      </b>
    </span>
  );
}
function Token({ usdc = false }: { usdc?: boolean }) {
  return <span className={playClasses(`token ${usdc ? "usdc" : "near"}`)}>{usdc ? "$" : "N"}</span>;
}
function Tag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={playClasses(`tag ${className}`)}>{children}</span>;
}

export function Playground() {
  const [stage, setStage] = useState<"welcome" | "consult">("welcome");
  const [panel, setPanel] = useState<Panel | null>(null);
  const wide = useMedia("(min-width: 1280px)");
  const stacked = !useMedia("(min-width: 1024px)");
  const [speaking, setSpeaking] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>("position");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const openPanel = useCallback(
    (requested: Panel | null) => {
      if (wide) {
        if (requested === "position" || requested === "guardian" || requested === "activity")
          setDetailTab(requested);
        if (requested === "voice") setVoiceOpen(true);
        setPanel("chat");
      } else setPanel(requested);
    },
    [wide],
  );
  useEffect(() => {
    if (wide && stage === "consult" && panel !== "chat") openPanel(panel);
    if (!wide) setVoiceOpen(false);
  }, [wide, stage, panel, openPanel]);
  const [sound, setSound] = useState(false);
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
  const receiptId = useRef(0);
  useEffect(() => {
    setNow(Date.now());
    return () => {
      for (const timer of timeouts.current) clearTimeout(timer);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);
  useEffect(() => {
    if (panel !== "chat" || messages.length === 0) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: thinking ? "auto" : "smooth",
    });
  }, [messages, thinking, panel]);
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
    if (!text.trim() || thinking) return;
    openPanel("chat");
    const question = text.trim().slice(0, 500);
    setMessages((prev) => [...prev, { id: ++messageId.current, role: "user", text: question }]);
    setInput("");
    setThinking(true);
    setSpeaking(false);
    const speechId = ++speechSequence.current;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    later(() => {
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
          ? `Dengan $amount(comp.value.value.amountUsed)USDC, membayar utang menghemat sekitar $amount(comp.value.value.repaySaves)USDC per tahun. Supply menghasilkan sekitar $amount(comp.value.value.yieldEarns)USDC. Dalam contoh ini, bayar utang lebih menguntungkan sebelum biaya.`
          : `Let's put that cash to work on your debt. Repaying ${amount(comp.value.value.amountUsed)} USDC avoids an estimated ${amount(comp.value.value.repaySaves)} USDC in yearly interest. Supplying it earns ${amount(comp.value.value.yieldEarns)} USDC. Repaying wins before fees.`;
        kind = "recommendation";
        setCardOpen(true);
        setLastRepay(null);
      } else if (/position|health|utang|jelas/.test(q))
        text = `Your demo position has 1,000 NEAR in collateral and ${amount(debt)} USDC in debt. Health: ${current.health === null ? "unavailable" : percent(current.health)}. Borrow APR is 21.00%; supply APR is 14.01%. These are illustrative inputs, refreshed for this demo. Below 100% health, Rhea can liquidate a position.`;
      else if (/bitcoin|ethereum|trade|buy|leverage|ignore|10000|10,000/.test(q))
        text =
          "That action is outside this demo's permissions. I can help with the supported Rhea debt and Guardian limits. A chat message never authorizes a transaction.";
      setMessages((prev) => [...prev, { id, role: "assistant", text, ...(kind ? { kind } : {}) }]);
      setThinking(false);
      setSpeaking(true);
      if (sound && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = indo ? "id-ID" : "en-US";
        utterance.rate = 0.95;
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => {
          if (speechSequence.current === speechId) setSpeaking(false);
        };
        utterance.onerror = () => {
          if (speechSequence.current === speechId) setSpeaking(false);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        later(
          () => {
            if (speechSequence.current === speechId) setSpeaking(false);
          },
          Math.min(8000, Math.max(1800, text.length * 24)),
        );
      }
    }, 900);
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
  function reset() {
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
    <label className="form-field flex flex-col gap-[8px] mt-[21px] min-w-0 [&>span]:text-[10px] [&>span]:font-bold [&>span]:flex [&>span]:justify-between [&>span_small]:text-[8px] [&>span_small]:font-normal [&>span_small]:text-[#a8b8c4] [&_input]:p-[12px] [&_input]:bg-[#1d2833] [&_input]:[border:1px_solid_#344552] [&_input]:rounded-[7px] [&_input]:text-[12px] [&_input]:text-[var(--ink)] [&_input]:w-full [&_input]:min-w-0 [&_select]:p-[12px] [&_select]:bg-[#1d2833] [&_select]:[border:1px_solid_#344552] [&_select]:rounded-[7px] [&_select]:text-[12px] [&_select]:text-[var(--ink)] [&_select]:w-full [&_select]:min-w-0 [&>small]:text-[8px] [&>small]:leading-[1.5] [&>small]:text-[#a8b8c4] max-[620px]:[&>span]:text-[9px] max-[620px]:[&_input]:text-[11px] max-[620px]:[&_input]:p-[11px_9px] max-[620px]:[&_select]:text-[11px] max-[620px]:[&_select]:p-[11px_9px] max-[620px]:[&>small]:text-[7px]">
      <span>
        {label}
        {optional && <small>Optional</small>}
      </span>
      <div className="field-input relative [&_input]:pr-[55px] [&_b]:absolute [&_b]:right-[13px] [&_b]:top-[14px] [&_b]:text-[9px] [&_b]:text-[#a8b8c4] [&_b]:font-medium [&_b]:pointer-events-none max-[620px]:[&_b]:text-[8px] max-[620px]:[&_b]:top-[13px] max-[620px]:[&_b]:right-[9px] max-[620px]:[&_input]:pr-[44px]">
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

  function guardianContent(full = false) {
    return (
      <section className={playClasses(`guardian-card ${full ? "expanded" : ""}`)}>
        <div className="guardian-top flex items-center gap-[10px] [&_.tag]:border-0 [&_.tag]:text-[7px] [&_.tag]:text-[#a8b8c4] [&_.tag]:bg-[#294134] [&_.tag]:p-[6px_8px] max-[1100px]:[&_.tag]:text-[6px] max-[820px]:[&_.tag]:text-[8px] max-[620px]:gap-[8px] max-[620px]:[&_.tag]:text-[6px]">
          <span className="guardian-symbol w-[35px] h-[35px] rounded-[9px] [border:1px_solid_#b5cb6e] flex items-center justify-center">
            <ShieldCheck size={27} />
          </span>
          <Tag>
            {guardian === "inactive" ? (
              "YOUR RULES. ON WATCH."
            ) : (
              <>
                <i className={playClasses(`status-dot ${guardian !== "active" ? "muted" : ""}`)} />
                {guardian.toUpperCase()}
              </>
            )}
          </Tag>
          <span className="section-index ml-auto text-[7px] tracking-[.08em] text-[#a8b8c4] font-bold max-[1100px]:text-[6px] max-[820px]:text-[8px] max-[620px]:text-[6px]">
            02 / GUARDIAN
          </span>
        </div>
        <div className="guardian-body flex items-center relative gap-[10px] pt-[17px] min-h-[157px] [&>div:first-child]:relative [&>div:first-child]:z-[1] [&>div:first-child]:flex-1 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[27px] [&_h2]:leading-[1.12] [&_h2]:tracking-[-1.2px] [&_h2]:font-medium [&_p]:text-[9px] [&_p]:leading-[1.7] [&_p]:text-[#a8b8c4] [&_p]:max-w-[265px] [&_p]:mt-[11px] min-[1500px]:[&_h2]:text-[32px] min-[1500px]:[&_p]:text-[10px] min-[1500px]:min-h-[165px] max-[1100px]:[&_h2]:text-[24px] max-[1100px]:[&_p]:text-[8px] max-[820px]:[&_h2]:text-[31px] max-[820px]:[&_p]:text-[11px] max-[820px]:[&_p]:max-w-[350px] max-[620px]:min-h-[155px] max-[620px]:[&_h2]:text-[26px] max-[620px]:[&_p]:text-[9px]">
          <div>
            <h2>
              {guardian === "inactive" ? (
                <>
                  A little backup.
                  <br />A lot more peace of mind.
                </>
              ) : guardian === "active" ? (
                <>
                  Your limits.
                  <br />
                  Always in charge.
                </>
              ) : guardian === "paused" ? (
                <>
                  Taking a breather.
                  <br />
                  You're in control.
                </>
              ) : (
                <>
                  Off duty.
                  <br />
                  Still your money.
                </>
              )}
            </h2>
            <p>
              {guardian === "inactive"
                ? "Give your position a watchful eye. You choose the limits. Guardian sticks to them."
                : `Reserve ${amount(reserve)} USDC · Spendable ${amount(spendable)} USDC. A separate, simulated Guardian-held loan.`}
            </p>
          </div>
          <div
            className="guardian-visual relative w-[120px] h-[125px] shrink-0 perspective-[500px] transform-[rotate(-10deg)] max-[1100px]:w-[99px] max-[1100px]:transform-[scale(.85)_rotate(-10deg)] max-[1100px]:[transform-origin:right_center] max-[820px]:transform-[rotate(-10deg)] max-[820px]:w-[130px] max-[620px]:transform-[scale(.9)_rotate(-10deg)] max-[620px]:w-[100px]"
            aria-hidden="true"
          >
            <div className="shield-back absolute w-[86px] h-[102px] [clip-path:polygon(50%_0,100%_17%,92%_67%,78%_87%,50%_100%,22%_87%,8%_67%,0_17%)] bg-[#8dab3f] left-[14px] top-[14px] transform-[rotateY(-25deg)_rotateX(8deg)] flex items-center justify-center text-[#e8ffb5]" />
            <div className="shield-front absolute w-[86px] h-[102px] [clip-path:polygon(50%_0,100%_17%,92%_67%,78%_87%,50%_100%,22%_87%,8%_67%,0_17%)] bg-[#8dab3f] left-[14px] top-[14px] transform-[rotateY(-25deg)_rotateX(8deg)] flex items-center justify-center text-[#e8ffb5] top-[9px] left-[10px] bg-[#263527] border-0 [&_svg]:transform-[translateY(-3px)]">
              <ShieldCheck strokeWidth={1.6} size={66} />
            </div>
            <span className="shield-spark absolute text-[#a8b8c4] text-[31px] right-[0] top-[2px]">
              ✦
            </span>
          </div>
        </div>
        {guardian === "inactive" ? (
          <div className="guardian-bottom flex gap-[20px] items-center mt-[11px] [&>span]:text-[7px] [&>span]:text-[#a8b8c4] [&>span]:leading-[1.65] max-[1100px]:gap-[10px] max-[1100px]:[&_.button]:text-[9px]! max-[1100px]:[&_.button]:p-[12px] max-[1100px]:[&>span]:text-[6px] max-[820px]:gap-[20px] max-[820px]:[&_.button]:text-[11px]! max-[820px]:[&_.button]:p-[13px_16px] max-[820px]:[&>span]:text-[8px] max-[620px]:gap-[14px] max-[620px]:[&_.button]:text-[9px]! max-[620px]:[&_.button]:p-[12px_14px] max-[620px]:[&>span]:text-[7px]">
            <button
              type="button"
              className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] ink-button bg-[#263847] text-white! [&:hover]:bg-[#344052]"
              onClick={() => {
                setSetupReview(false);
                setModal("setup");
              }}
            >
              Meet your Guardian <ArrowUpRight size={18} />
            </button>
            <span>
              Opt-in. Your limits.
              <br />
              Never a guarantee.
            </span>
          </div>
        ) : (
          <>
            <div className="guardian-numbers grid grid-cols-[repeat(3,1fr)] m-[13px_0] [border-top:1px_solid_#bdd96e] pt-[15px] gap-[12px] [&_small]:block [&_small]:text-[7px] [&_small]:text-[#a8b8c4] [&_small]:tracking-[.05em] [&_strong]:font-[family-name:var(--font-display)] [&_strong]:text-[23px] [&_strong]:font-medium [&_strong]:block [&_strong]:mt-[4px] [&_em]:[font:8px_var(--font-body)] max-[620px]:gap-[8px] max-[620px]:[&_small]:text-[6px] max-[620px]:[&_strong]:text-[22px] max-[620px]:[&_em]:text-[6px]">
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
            <div className="guardian-controls flex gap-[8px] items-center mt-[17px] flex-wrap [&>.icon-button]:ml-auto">
              {guardian !== "deactivated" && (
                <button
                  type="button"
                  className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] ink-button bg-[#263847] text-white! [&:hover]:bg-[#344052] small"
                  onClick={() => ownerAction(guardian === "active" ? "pause" : "resume")}
                >
                  {guardian === "active" ? <Pause size={15} /> : <Play size={15} />}
                  {guardian === "active" ? "Pause" : "Resume"}
                </button>
              )}
              <button
                type="button"
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#344552] bg-transparent [&:hover]:bg-[#ffffff40] small"
                onClick={() => ownerAction("withdraw")}
              >
                Withdraw
              </button>
              <button
                type="button"
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#344552] bg-transparent [&:hover]:bg-[#ffffff40] small"
                onClick={() => ownerAction("topup")}
              >
                <Plus size={15} />
                Top up
              </button>
              {!full && (
                <button
                  type="button"
                  className="icon-button inline-flex items-center justify-center border-0 bg-transparent w-[32px] h-[32px] rounded-full p-0 [transition:background_.18s] [&:hover]:bg-[#8080801a]"
                  onClick={() => openPanel("guardian")}
                  aria-label="View Guardian details"
                >
                  <ArrowUpRight size={20} />
                </button>
              )}
            </div>
          </>
        )}
        {full && guardian !== "inactive" && (
          <div className="guardian-details mt-[24px] [border-top:1px_solid_#bdd56f] pt-[20px] [&_.fine-print]:text-[#a8b8c4] [&_.fine-print]:text-[8px]">
            <div className="detail-grid grid grid-cols-[1fr_1fr] gap-[23px_18px] [&_small]:text-[9px] [&_small]:text-[#a8b8c4] [&_small]:block [&_b]:text-[10px] [&_b]:block [&_b]:leading-[1.7] [&_b]:mt-[6px] [&_b]:font-bold [&_span]:text-[8px] [&_span]:block [&_span]:leading-[1.7] [&_span]:text-[#a8b8c4] max-[620px]:gap-[20px_13px] max-[620px]:[&_b]:text-[9px] max-[620px]:[&_small]:text-[8px]">
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
            <p className="fine-print text-[9px] leading-[1.8] text-[#a8b8c4] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
              Demo model: G1 Guardian-held loan. This does not transfer your existing wallet
              position. No contract is deployed. Fast markets, stale data, insufficient reserve and
              watcher downtime can still lead to liquidation.
            </p>
            <div className="replay-actions flex flex-wrap items-center gap-[10px] mt-[18px]">
              <button
                type="button"
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] ink-button bg-[#263847] text-white! [&:hover]:bg-[#344052] small"
                onClick={() => replay(false)}
              >
                <Play size={14} />
                Run simulated trigger
              </button>
              <button
                type="button"
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#344552] bg-transparent [&:hover]:bg-[#ffffff40] small"
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
            <small className="fine-print text-[9px] leading-[1.8] text-[#a8b8c4] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
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
        <div className="panel-heading flex justify-between items-center gap-[15px] [&_.eyebrow]:text-[#a8b8c4] [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[30px] [&_h2]:font-medium [&_h2]:tracking-[-1px] [&_h2]:mt-[8px] [&>.tag]:[border-color:#d7decc] [&>.tag]:text-[#a8b8c4] [&>.tag]:text-[8px] max-[620px]:items-start max-[620px]:flex-col max-[620px]:[&_h2]:text-[28px]">
          <div>
            <span className="eyebrow text-[9px] font-extrabold tracking-[.15em] block leading-[1.5]">
              THE PAPER TRAIL
            </span>
            <h2>Every move. In the open.</h2>
          </div>
          <Tag>
            <History size={13} />
            {receipts.length} demo events
          </Tag>
        </div>
        {receipts.length ? (
          <div className="receipt-list mt-[25px]">
            {receipts.map((r) => (
              <button
                type="button"
                className="receipt-row flex items-center gap-[15px] p-[18px_0] border-0 [border-bottom:1px_solid_#344552] bg-transparent w-full text-left [&>svg]:ml-auto [&>svg]:text-[#a8b8c4] [&_b]:text-[12px] [&_b]:block [&_small]:text-[9px] [&_small]:block [&_small]:mt-[7px] [&_small]:text-[#a8b8c4] [&:hover]:bg-[#1d2833] max-[620px]:gap-[10px] max-[620px]:[&_b]:text-[11px] max-[620px]:[&_small]:text-[8px]"
                key={r.id}
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
          <div className="empty-activity flex items-center flex-col text-center p-[65px_15px_75px] gap-[17px] [&>svg]:text-[#a8b8c4] [&_h3]:font-[family-name:var(--font-display)] [&_h3]:text-[30px] [&_h3]:font-medium [&_h3]:tracking-[-1px] [&_p]:text-[#a8b8c4] [&_p]:text-[11px] [&_p]:leading-[1.8] [&_p]:max-w-[340px] [&_.button]:mt-[8px]">
            <History size={38} strokeWidth={1.3} />
            <h3>A clean slate.</h3>
            <p>Your demo receipts will land here after you try a repayment or set up Guardian.</p>
            <button
              type="button"
              className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] blue-button bg-[var(--blue)] text-white! [&:hover]:bg-[#183ac7]"
              onClick={() => {
                _ask("Should I repay or earn yield?");
              }}
            >
              Find my first move <ArrowRight size={17} />
            </button>
          </div>
        )}
        <p className="fine-print text-[9px] leading-[1.8] text-[#a8b8c4] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
          Demo receipts document local UI state. Real transaction hashes and explorer links only
          appear in the future live integration.
        </p>
      </section>
    );
  }

  function positionContent() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-4 [&_.position-values_strong]:text-[25px]! lg:[&_.position-values_strong]:text-[30px]! [&_.position-values_small]:text-[10px]! [&_.position-values>div>span]:text-[10px]! [&_.position-card]:p-4! [&_.health-section_small]:text-[10px]! [&_.health-section>div:first-child>span]:text-[11px]! [&_.health-labels]:text-[8px]! [&_.position-footer]:flex-wrap! [&_.position-footer>span]:text-[10px]! [&_.position-footnote]:text-[9px]! [&_.position-heading_.tag]:text-[8px]!">
        <section className="position-card rounded-[20px] bg-[#0e1721] shadow-[0_20px_60px_#0b102a66] text-[var(--ink)] p-[22px_25px_15px] min-w-0 max-[1100px]:p-[20px] max-[820px]:p-[22px_25px] max-[620px]:p-[20px] max-[620px]:rounded-[17px]">
          <div className="position-heading flex justify-between items-center [&_.eyebrow]:text-[8px] [&_.eyebrow]:text-[#a8b8c4] [&>div]:flex [&>div]:items-center [&>div]:gap-[7px] [&_.tag]:text-[7px] [&_.tag]:border-0 [&_.tag]:bg-[#303b35] [&_.tag]:text-[#bfda9f] [&_.tag]:p-[5px_7px] [&_.status-dot]:w-[4px] [&_.status-dot]:h-[4px] [&_.status-dot]:bg-[#badc8e] [&_.icon-button]:text-[#a8b8c4] [&_.icon-button]:w-[24px] [&_.icon-button]:h-[24px] max-[620px]:[&_.eyebrow]:text-[7px] max-[620px]:[&_.tag]:text-[6px]">
            <span className="eyebrow text-[9px] font-extrabold tracking-[.15em] block leading-[1.5]">
              01 / YOUR POSITION
            </span>
            <div>
              <Tag>
                <span className="status-dot inline-block w-[5px] h-[5px] bg-[#729955] rounded-full shrink-0" />
                {dataState === "fresh" ? "SIMULATED · FRESH" : dataState.toUpperCase()}
              </Tag>
              <button
                type="button"
                className="icon-button inline-flex items-center justify-center border-0 bg-transparent w-[32px] h-[32px] rounded-full p-0 [transition:background_.18s] [&:hover]:bg-[#8080801a]"
                aria-label="Refresh simulated position"
                onClick={refresh}
              >
                <RefreshCw
                  size={15}
                  className={playClasses(dataState === "loading" ? "spin" : "")}
                />
              </button>
            </div>
          </div>
          {dataState === "error" ? (
            <div className="position-error min-h-[240px] flex items-start flex-col justify-center gap-[12px] [&_h3]:font-[family-name:var(--font-display)] [&_h3]:text-[22px] [&_h3]:font-medium [&_p]:text-[11px] [&_p]:text-[#b2b9c3]">
              <AlertTriangle />
              <h3>Can't reach NEAR right now.</h3>
              <p>A simulated RPC error. Try refreshing.</p>
              <button
                type="button"
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] light-button bg-[var(--cream)] text-[var(--ink)] small"
                onClick={refresh}
              >
                Retry
              </button>
            </div>
          ) : dataState === "empty" ? (
            <div className="position-error min-h-[240px] flex items-start flex-col justify-center gap-[12px] [&_h3]:font-[family-name:var(--font-display)] [&_h3]:text-[22px] [&_h3]:font-medium [&_p]:text-[11px] [&_p]:text-[#b2b9c3]">
              <Wallet />
              <h3>A little room for your next move.</h3>
              <p>No position in this demo state. Open one on Rhea in the live app.</p>
              <button
                type="button"
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] light-button bg-[var(--cream)] text-[var(--ink)] small"
                onClick={() => setModal("settings")}
              >
                Switch demo state
              </button>
            </div>
          ) : (
            <>
              <div
                className={playClasses(
                  `position-values ${dataState === "loading" ? "loading-state" : ""}`,
                )}
              >
                <div className="collateral-value">
                  <span>
                    Collateral value <ArrowUpRight size={13} />
                  </span>
                  <strong>
                    $5,000<span>.00</span>
                  </strong>
                  <small>
                    <Token />
                    1,000 NEAR <b>· $5.00 / NEAR</b>
                  </small>
                </div>
                <div className="debt-value [border-left:1px_solid_#414652] pl-[22px] [&_strong]:text-[28px] [&_strong]:mt-[10px] [&_strong]:tracking-[-.8px] min-[1500px]:[&_strong]:text-[33px] max-[1100px]:pl-[13px] max-[1100px]:[&_strong]:text-[25px] max-[1100px]:[&_strong]:mt-[10px] max-[820px]:[&_strong]:text-[33px] max-[620px]:[&_strong]:text-[27px] max-[620px]:[&_strong]:mt-[11px] max-[620px]:pl-[14px]">
                  <span>Outstanding debt</span>
                  <strong>${amount(debt)}</strong>
                  <small>
                    <Token usdc />
                    {amount(debt)} USDC
                  </small>
                </div>
              </div>
              <div className="health-section tabular-nums mt-[24px] [&>div:first-child]:flex [&>div:first-child]:items-center [&>div:first-child]:gap-[10px] [&>div:first-child]:flex-wrap [&>div:first-child>span]:text-[9px] [&>div:first-child>span]:text-[#a8b8c4] [&>div:first-child>span]:flex [&>div:first-child>span]:items-center [&>div:first-child>span]:gap-[5px] [&_strong]:font-[family-name:var(--font-display)] [&_strong]:text-[19px] [&_strong]:font-medium [&_strong]:text-[var(--lime)] [&_strong]:tracking-[-.5px] [&_strong.health-warning]:text-[#ffae6b] [&_small]:ml-auto [&_small]:text-[7px] [&_small]:text-[#a8b8c4] max-[1100px]:[&_small]:text-[6px] max-[820px]:[&>div:first-child>span]:text-[10px] max-[820px]:[&_small]:text-[9px] max-[620px]:mt-[24px] max-[620px]:[&>div:first-child]:gap-[7px] max-[620px]:[&>div:first-child>span]:text-[8px] max-[620px]:[&_strong]:text-[18px] max-[620px]:[&_small]:text-[6px]">
                <div>
                  <span>
                    Position health <CircleHelp size={12} />
                  </span>
                  <strong
                    className={playClasses(
                      current.health !== null &&
                        current.health !== "no_debt" &&
                        current.health < Number(comfort) * 100
                        ? "health-warning"
                        : "",
                    )}
                  >
                    {healthText}
                  </strong>
                  <small>
                    {dataState === "stale"
                      ? "Data is 5 minutes old. Refresh to advise."
                      : current.health === "no_debt"
                        ? "No debt remaining"
                        : "Liquidation below 100%"}
                  </small>
                </div>
                <div
                  className="health-bars flex gap-[4px] h-[20px] mt-[10px] relative [&_i]:flex-1 [&_i]:rounded-[2px] [&_.risk]:bg-[#bf6753] [&_.buffer]:bg-[#e0ca83] [&_.healthy]:bg-[#d2ed99] max-[620px]:gap-[3px] max-[620px]:h-[18px]"
                  aria-hidden="true"
                >
                  {Array.from({ length: 32 }, (_, value) => value).map((i) => (
                    <i
                      key={`health-${i}`}
                      className={playClasses(i < 12 ? "risk" : i < 22 ? "buffer" : "healthy")}
                    />
                  ))}
                  <span
                    className="health-pointer absolute w-[3px] h-[28px] bg-[var(--paper)] top-[-4px] shadow-[0_0_0_3px_var(--ink)] rounded-[3px]"
                    style={{
                      left: `${current.health === null || current.health === "no_debt" ? 95 : Math.min(95, Math.max(2, (current.health - 5000) / 150))}%`,
                    }}
                  />
                </div>
                <div className="health-labels flex justify-between mt-[9px] text-[6px] tracking-[.07em] text-[#a8b8c4] max-[620px]:text-[5px]">
                  <span>100% · LIQUIDATION</span>
                  <span>{comfort}% · COMFORT LINE</span>
                </div>
              </div>
              <div className="position-footer [border-top:1px_solid_#3a4250] flex items-center justify-between gap-[12px] mt-[19px] pt-[13px] [&>span]:text-[7px] [&>span]:text-[#a8b8c4] [&>span]:flex [&>span]:flex-col [&>span]:gap-[5px] [&_b]:text-[12px] [&_b]:font-semibold [&_b]:text-[#e6e9e1] max-[820px]:[&>span]:text-[9px] max-[820px]:[&_b]:text-[14px] max-[620px]:gap-[10px] max-[620px]:[&>span]:text-[6px] max-[620px]:[&>span]:gap-[6px] max-[620px]:[&_b]:text-[12px]">
                <span>
                  Est. NEAR liquidation price{" "}
                  <b>{current.liquidation ? `$${Number(current.liquidation).toFixed(2)}` : "—"}</b>
                </span>
                <span>
                  Borrow APR <b>21.00%</b>
                </span>
                <span>
                  Supply APR <b>14.01%</b>
                </span>
              </div>
            </>
          )}
          <span className="position-footnote text-[6px] block mt-[14px] text-[#a8b8c4] tracking-[.03em] max-[820px]:text-[7px] max-[620px]:text-[6px]">
            Illustrative Rhea fixture · engine-computed · wallet-held loan
          </span>
        </section>
        <button
          type="button"
          onClick={() => _ask("Explain my position")}
          className="mt-4 flex w-full items-center justify-between rounded-xl border border-[#344552] bg-[#1d2833] px-4 py-3 text-xs font-semibold"
        >
          <span className="flex items-center gap-2">
            <MessageCircle size={16} />
            Talk me through it
          </span>
          <ArrowUpRight size={16} />
        </button>
        <p className="mt-4! px-1 text-[10px] leading-relaxed text-[#a8b8c4]">
          Illustrative position, computed with the finance engine. These are simulated inputs, not a
          live wallet read.
        </p>
      </div>
    );
  }

  function toolContent(value: DetailTab) {
    if (value === "position") return positionContent();
    if (value === "guardian")
      return (
        <div className="min-h-0 flex-1 overflow-y-auto p-4 [&_.position-values_strong]:text-[25px]! lg:[&_.position-values_strong]:text-[30px]! [&_.position-values_small]:text-[10px]! [&_.position-values>div>span]:text-[10px]! [&_.position-card]:p-4! [&_.health-section_small]:text-[10px]! [&_.health-section>div:first-child>span]:text-[11px]! [&_.health-labels]:text-[8px]! [&_.position-footer]:flex-wrap! [&_.position-footer>span]:text-[10px]! [&_.position-footnote]:text-[9px]! [&_.position-heading_.tag]:text-[8px]!">
          {guardianContent(true)}
          <button
            type="button"
            onClick={() => _ask("What are my Guardian limits?")}
            className="mt-4 flex w-full items-center justify-between rounded-xl border border-[#344552] bg-[#1d2833] px-4 py-3 text-xs font-semibold"
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

  const panelTitles: Record<Panel, { label: string; title: string }> = {
    chat: { label: "THE CONVERSATION", title: "Let's talk money." },
    voice: { label: "A LITTLE FACE TIME", title: "I'm all ears." },
    position: { label: "YOUR FINANCIAL PICTURE", title: "Here's where you stand." },
    guardian: { label: "YOUR RULES. ON WATCH.", title: "Meet your Guardian." },
    activity: { label: "THE PAPER TRAIL", title: "Every move, accounted for." },
  };
  const dockItems: { id: Panel; label: string; icon: ReactNode; color: string }[] = [
    {
      id: "chat",
      label: "Chat",
      icon: <MessageCircle size={25} strokeWidth={1.8} />,
      color: "bg-[#284bdf] text-white",
    },
    {
      id: "position",
      label: "Position",
      icon: <BarChart3 size={25} strokeWidth={1.8} />,
      color: "bg-[#1d2833] text-[#edf3f5]",
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
      color: "bg-[#1d2833] text-[#a8b8c4]",
    },
  ];
  return (
    <main className="play-app fixed inset-0 isolate h-dvh w-full overflow-hidden [--tool-width:min(560px,48vw)] xl:[--tool-width:clamp(440px,32vw,620px)] [--pos-width:clamp(380px,28vw,500px)] [color-scheme:dark] [--dock-icon:49px] [--voice-icon:60px] [--dock-item:52px] sm:[--dock-icon:58px] sm:[--voice-icon:70px] sm:[--dock-item:64px] [@media(max-height:600px)]:[--dock-icon:44px] [@media(max-height:600px)]:[--voice-icon:52px] [@media(max-height:600px)]:[--dock-item:44px] [--ink:#edf3f5] [--cream:#1d2833] [--paper:#141d27] [--orange:#ff643b] [--blue:#284bdf] [--lime:#dbf884] [--line:#344552] bg-[#0d141c] font-[family-name:var(--font-body)] text-sm text-[#edf3f5] antialiased [font-optical-sizing:auto] [&_*]:box-border [&_button]:cursor-pointer [&_button]:[font-family:inherit] [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-45 [&_input]:[font-family:inherit] [&_select]:[font-family:inherit] [&_a]:text-inherit [&_a]:no-underline [&_:where(h1,h2,h3,p)]:m-0 [&_button:focus-visible]:outline-3 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[#284bdf] [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-[#284bdf] [&_select:focus-visible]:outline-2 [&_select:focus-visible]:outline-[#284bdf] [&_svg]:shrink-0 selection:bg-[#dbf884] selection:text-[#101a17] motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none!">
      <h1 className="sr-only">Mr.Fund — your personal DeFi office</h1>
      <div
        className={`fixed inset-0 z-0 transition-[filter,transform] duration-700 motion-reduce:transition-none ${stage === "welcome" ? "scale-105 blur-[7px]" : ""}`}
      >
        <WorldScene
          mood={characterMood}
          wave={wave}
          station={stage === "welcome" ? "office" : "chat"}
          speaking={speaking}
          hud={{ panelOpen: panel !== null, positionColumn: wide && stage === "consult", stacked }}
          healthBps={
            dataState !== "fresh" || current.health === null
              ? null
              : current.health === "no_debt"
                ? 30000
                : current.health
          }
          activityCount={receipts.length}
        />
      </div>

      {stage === "welcome" && (
        <section
          aria-labelledby="welcome-title"
          className="absolute inset-0 z-30 grid place-items-center overflow-y-auto p-5"
        >
          <div className="w-full max-w-[500px] rounded-[32px] border-2 border-[#172f36] bg-[#141f2b] p-7 text-left text-[#fff8e7] shadow-[8px_9px_0_#dbf884,0_24px_80px_#172f3666] sm:p-10">
            <span className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-1.5px]">
              mr.fund
            </span>
            <p className="mt-2 text-[9px] font-extrabold tracking-[.15em] text-[#dbf884]">
              YOUR PRIVATE CONSULTATION · DEMO
            </p>
            <h2
              id="welcome-title"
              className="mt-5 font-[family-name:var(--font-display)] text-[42px] font-semibold leading-[.98] tracking-[-2px] sm:text-[58px]"
            >
              The DeFi manager you can talk to.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-[#d5e3dd]">
              Mr.Fund explains your Rhea position in plain words, shows the smartest move, and acts
              only within limits you set.
            </p>
            <button
              type="button"
              onClick={startConsultation}
              className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#26314a] bg-[#dbf884] text-[#101a17]! px-6 py-4 text-sm font-extrabold shadow-[0_4px_0_#26314a] transition-transform hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
            >
              Start consultation <ArrowRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => setModal("help")}
              className="mt-5 border-0 bg-transparent text-xs font-bold text-[#fff8e7] underline underline-offset-4"
            >
              How it works
            </button>
            <p className="mt-5 text-[10px] leading-relaxed text-[#c1d1c9]">
              Next you connect a mock wallet. No real funds, keys or transactions are involved.
            </p>
          </div>
        </section>
      )}

      {stage === "consult" && (
        <>
          <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-end gap-2 p-3 sm:gap-3 sm:p-5 lg:px-9">
            <div className="pointer-events-auto flex flex-col items-stretch gap-1">
              <section
                aria-label="Position stats"
                className="flex items-stretch divide-x divide-[#26314a33] rounded-2xl border-2 border-[#26314a] bg-[#1d2833] shadow-[0_4px_0_#26314a]"
              >
                <Stat label="HEALTH" value={healthText} />
                <Stat
                  className="max-sm:hidden"
                  label="DEBT"
                  value={dataState === "fresh" && debt > 0n ? `$${amount(debt)}` : "—"}
                />
                <Stat className="max-sm:hidden" label="PnL" value="—" />
              </section>
              <span className="text-right text-[8px] font-bold tracking-[.12em] text-[#fff8e7] [text-shadow:0_1px_2px_#26314a]">
                SIMULATED · PnL unavailable
              </span>
            </div>
            <button
              type="button"
              onClick={() => setModal("wallet")}
              className="pointer-events-auto flex h-[60px] items-center gap-2 rounded-2xl border-2 border-[#26314a] bg-[#26314a] px-3 text-[#fff8e7] shadow-[0_4px_0_#111927] sm:px-4"
            >
              <Wallet size={19} />
              <span className="text-[10px] font-bold sm:text-xs max-sm:hidden">
                {connected ? "you.demo.testnet" : "Connect wallet"}
              </span>
              <span className="sr-only sm:hidden">
                {connected ? "you.demo.testnet" : "Connect wallet"}
              </span>
            </button>
          </header>

          <aside
            aria-label="Office controls"
            className="absolute left-3 top-3 z-20 flex gap-2 sm:left-5 sm:top-5 lg:left-9"
          >
            <button
              type="button"
              aria-label="Demo settings"
              onClick={() => setModal("settings")}
              className="grid size-11 place-items-center rounded-xl border-2 border-[#26314a] bg-[#1d2833] shadow-[0_3px_0_#26314a] transition-transform hover:-translate-y-0.5"
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
                setSound((v) => !v);
                window.speechSynthesis.cancel();
              }}
              className="grid size-11 place-items-center rounded-xl border-2 border-[#26314a] bg-[#1d2833] shadow-[0_3px_0_#26314a] transition-transform hover:-translate-y-0.5"
            >
              {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>
            <button
              type="button"
              aria-label="How it works"
              onClick={() => setModal("help")}
              className="grid size-11 place-items-center rounded-xl border-2 border-[#26314a] bg-[#1d2833] shadow-[0_3px_0_#26314a] transition-transform hover:-translate-y-0.5"
            >
              <CircleHelp size={17} />
            </button>
          </aside>

          {!wide && (
            <nav
              aria-label="Office actions"
              className="absolute inset-x-0 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 mx-auto flex w-max max-w-[calc(100%_-_16px)] items-end gap-2 px-2 pb-2 pt-3 sm:gap-5 sm:px-6 sm:pb-3 [@media(max-height:600px)]:gap-1! [@media(max-height:600px)]:py-2"
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
                    className={`relative grid size-[var(--dock-icon)] place-items-center rounded-[19px] border-2 border-[#26314a] shadow-[0_4px_0_#26314a] transition-transform group-active:translate-y-1 group-active:shadow-none ${item.color} ${item.id === "voice" ? "size-[var(--voice-icon)]! rounded-[23px]!" : ""} ${panel === item.id ? "outline-2 outline-offset-4 outline-[#ff643b]" : ""}`}
                  >
                    {item.icon}
                    {item.id === "activity" && receipts.length > 0 && (
                      <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full border border-[#26314a] bg-[#ff643b] text-[#171b23]! text-[8px] font-bold">
                        {receipts.length}
                      </span>
                    )}
                  </span>
                  <span className="text-[8px] font-bold tracking-[.04em] text-[#a8b8c4] sm:text-[10px]">
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>
          )}

          <div className="pointer-events-none absolute left-5 top-[31dvh] z-10 lg:bottom-[150px] xl:bottom-7 lg:top-auto lg:left-9">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#172f36] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.12em] text-[#dbf884]">
              <span
                className={`size-1.5 rounded-full bg-current ${thinking || speaking ? "animate-pulse" : ""}`}
              />
              {thinking
                ? "Thinking it through"
                : speaking
                  ? "Mr.Fund is speaking"
                  : "Here for your next move"}
            </span>
          </div>
          {wide && (
            <aside
              aria-label="Consultation details"
              className="absolute bottom-4 right-4 top-[88px] z-20 flex w-[var(--pos-width)] flex-col overflow-hidden rounded-[24px] border-2 border-[#26314a] bg-[#1d2833] shadow-[6px_7px_0_#26314a,0_20px_70px_#26314a2b]"
            >
              <div className="shrink-0 border-b border-[#344552] bg-[#1d2833] px-5 py-4">
                <span className="text-[7px] font-extrabold tracking-[.17em] text-[#a8b8c4]">
                  {panelTitles[detailTab].label}
                </span>
                <h2 className="mt-1! font-[family-name:var(--font-display)] text-[24px] font-semibold tracking-[-.8px]">
                  {panelTitles[detailTab].title}
                </h2>
              </div>
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
                {toolContent(detailTab)}
              </div>
            </aside>
          )}
        </>
      )}

      {stage === "consult" && panel && (
        <aside
          role={wide ? "region" : "dialog"}
          aria-labelledby="office-panel-title"
          className="absolute inset-x-3 bottom-[118px] top-[38dvh] z-20 flex flex-col overflow-hidden rounded-[24px] lg:inset-x-auto lg:bottom-[132px] lg:right-4 lg:top-[88px] lg:w-[var(--tool-width)] xl:right-[calc(var(--pos-width)_+_32px)] xl:bottom-4 border-2 border-[#26314a] bg-[#1d2833] shadow-[6px_7px_0_#26314a,0_20px_70px_#26314a2b] [@media(max-height:600px)]:top-3 [@media(max-height:600px)]:bottom-3 [@media(max-height:600px)]:rounded-2xl [&_.chat-message_p]:text-[14px]! [&_.chat-message_p]:leading-[1.8]! [&_.prompt-grid_button]:text-[12px]! [&_.chat-disclaimer]:text-[8px]! [&_.chat-panel]:flex-1 [&_.chat-heading]:pt-3!"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#344552] bg-[#1d2833] px-5 py-4 [@media(max-height:600px)]:px-4 [@media(max-height:600px)]:py-2">
            <div>
              <span className="text-[7px] font-extrabold tracking-[.17em] text-[#a8b8c4]">
                {panelTitles[panel].label}
              </span>
              <h2
                id="office-panel-title"
                className="mt-1! font-[family-name:var(--font-display)] text-[24px] font-semibold tracking-[-.8px] [@media(max-height:600px)]:text-[19px]"
              >
                {panelTitles[panel].title}
              </h2>
            </div>
            {!wide && (
              <button
                type="button"
                ref={panelClose}
                aria-label="Close overlay"
                onClick={() => openPanel(null)}
                className="grid size-8 shrink-0 place-items-center rounded-full border border-[#344552] bg-[#1d2833]"
              >
                <X size={17} />
              </button>
            )}
          </div>
          {panel === "chat" && (
            <section className="chat-panel flex flex-1 min-h-0 flex-col bg-[#1d2833] px-5 text-[#edf3f5] sm:px-6">
              <div className="chat-heading [@media(max-height:600px)]:hidden! p-[20px_0_16px] flex items-center justify-between [border-bottom:1px_solid_#344552] [&>div]:flex [&>div]:items-center [&>div]:gap-[10px] [&_b]:text-[12px] [&_b]:font-extrabold [&_small]:flex [&_small]:items-center [&_small]:gap-[5px] [&_small]:text-[8px] [&_small]:text-[#a8b8c4] [&_small]:mt-[3px] [&_.status-dot]:w-[4px] [&_.status-dot]:h-[4px] min-[1500px]:pt-[24px] min-[1500px]:pb-[20px] min-[1500px]:[&_b]:text-[13px] max-[1100px]:[&_b]:text-[11px] max-[820px]:[&_small]:text-[7px] max-[820px]:[&>div]:gap-[7px] max-[820px]:[&_b]:text-[10px] max-[620px]:pt-[19px] max-[620px]:[&_b]:text-[12px] max-[620px]:[&_small]:text-[7px] max-[620px]:[&>div]:gap-[10px]">
                <div>
                  <span className="chat-avatar h-[35px] w-[35px] bg-[var(--blue)] text-white font-[family-name:var(--font-display)] text-[25px] rounded-[11px] flex items-center justify-center tracking-[-2px] pr-[3px] max-[820px]:w-[30px] max-[820px]:h-[30px] max-[820px]:text-[23px] max-[620px]:h-[34px] max-[620px]:w-[34px] max-[620px]:text-[25px]">
                    m.
                  </span>
                  <span>
                    <b>A word with Mr.Fund</b>
                    <small>
                      <i className="status-dot inline-block w-[5px] h-[5px] bg-[#729955] rounded-full shrink-0" />
                      Scripted demo · English / Indonesian
                    </small>
                  </span>
                </div>
                <button
                  type="button"
                  className="icon-button inline-flex items-center justify-center border-0 bg-transparent w-[32px] h-[32px] rounded-full p-0 [transition:background_.18s] [&:hover]:bg-[#8080801a]"
                  aria-label="Clear conversation"
                  onClick={() => {
                    setMessages([greeting]);
                    setCardOpen(false);
                    setLastRepay(null);
                  }}
                >
                  <MoreHorizontal size={21} />
                </button>
              </div>
              <div
                className="chat-scroll flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#d7d8cd_transparent] p-[22px_4px_16px_0] min-h-0 overscroll-contain max-[820px]:pt-[17px] max-[620px]:pt-[22px]"
                ref={scrollRef}
                aria-live="polite"
                aria-busy={thinking}
              >
                {messages.map((message) => (
                  <div key={message.id} className={playClasses(`chat-message ${message.role}`)}>
                    <span className="message-label text-[7px] tracking-[.13em] font-extrabold text-[#a8b8c4] block mb-[7px]">
                      {message.role === "assistant" ? "MR.FUND" : "YOU"}
                    </span>
                    <p>{message.text}</p>
                    {message.kind === "scenario" && whatIf.ok && (
                      <div className="scenario-result [border:1px_solid_#344552] bg-[#1d2833] p-[13px] mt-[12px] rounded-[9px] [&_.tag]:text-[#a8b8c4] [&_.tag]:border-0 [&_.tag]:p-0 [&>div]:flex [&>div]:gap-[17px] [&>div]:items-center [&>div]:mt-[12px] [&>div>span]:text-[9px] [&>div>span]:flex [&>div>span]:flex-col [&>div>span]:gap-[3px] [&>div>span]:text-[#a8b8c4] [&_b]:font-[family-name:var(--font-display)] [&_b]:text-[22px] [&_b]:text-[#a8b8c4] [&>small]:text-[8px] [&>small]:text-[#a8b8c4] [&>small]:block [&>small]:mt-[10px]">
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
                ))}
                {messages.length === 1 && (
                  <>
                    <div className="chat-invitation p-[4px_0_19px] [&_h3]:font-[family-name:var(--font-display)] [&_h3]:text-[27px] [&_h3]:font-medium [&_h3]:leading-[1.15] [&_h3]:tracking-[-1px] [&_p]:text-[#a8b8c4] [&_p]:text-[10px] [&_p]:mt-[9px] min-[1500px]:p-[18px_0_28px] min-[1500px]:[&_h3]:text-[34px] max-[1100px]:[&_h3]:text-[24px] max-[820px]:[&_h3]:text-[23px] max-[820px]:pb-[14px] max-[620px]:p-[8px_0_23px] max-[620px]:[&_h3]:text-[29px] max-[620px]:[&_p]:text-[10px]">
                      <h3>
                        A good question
                        <br />
                        is a good investment.
                      </h3>
                      <p>Pick a thought. We'll take it from there.</p>
                    </div>
                    <div className="prompt-grid grid grid-cols-[1fr_1fr] gap-[8px] [&_button]:bg-[#1d2833] [&_button]:[border:1px_solid_#344552] [&_button]:p-[12px_10px] [&_button]:rounded-[9px] [&_button]:flex [&_button]:gap-[7px] [&_button]:items-center [&_button]:text-left [&_button]:text-[9px] [&_button]:font-semibold [&_button]:[transition:background_.16s,transform_.16s] [&_button]:min-w-0 [&_button>svg:first-child]:text-[#a8b8c4] [&_button>svg:last-child]:ml-auto [&_button>svg:last-child]:text-[#a8b8c4] [&_button:hover]:bg-[#1d2833] [&_button:hover]:transform-[translateY(-2px)] min-[1500px]:[&_button]:p-[16px_12px] min-[1500px]:[&_button]:text-[10px] max-[1100px]:gap-[6px] max-[1100px]:[&_button]:text-[8px] max-[1100px]:[&_button]:gap-[5px] max-[1100px]:[&_button]:p-[11px_8px] max-[1100px]:[&_button>svg]:w-[13px] max-[1100px]:[&_button>svg:last-child]:w-[10px] max-[820px]:grid-cols-[1fr] max-[820px]:[&_button]:p-[9px_10px] max-[820px]:[&_button]:text-[9px] max-[620px]:grid-cols-[1fr_1fr] max-[620px]:gap-[7px] max-[620px]:[&_button]:text-[8px] max-[620px]:[&_button]:p-[13px_9px] max-[620px]:[&_button]:gap-[5px]">
                      {prompts.map((p) => (
                        <button type="button" key={p.label} onClick={() => _ask(p.text)}>
                          {p.icon}
                          <span>{p.label}</span>
                          <ArrowUpRight size={14} />
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {thinking && (
                  <div className="thinking-message flex gap-[4px] items-center p-[8px_0_18px] [&>span]:w-[5px] [&>span]:h-[5px] [&>span]:bg-[var(--blue)] [&>span]:rounded-full [&>span]:animate-pulse [&_small]:text-[9px] [&_small]:ml-[6px] [&_small]:text-[#a8b8c4]">
                    <span />
                    <span />
                    <span />
                    <small>Checking the numbers…</small>
                  </div>
                )}
                {cardOpen && (
                  <div className="recommendation-card bg-[#1d2833] [border:1px_solid_#344552] rounded-[12px] p-[15px] m-[12px_0] [&_h3]:font-[family-name:var(--font-display)] [&_h3]:text-[24px] [&_h3]:tracking-[-.9px] [&_h3]:m-[5px_0] [&>p]:text-[10px] [&>p]:text-[#a8b8c4] [&>p]:mb-[15px] [&_details]:[border-top:1px_solid_#344552] [&_details]:pt-[10px] [&_details]:text-[8px] [&_details]:text-[#a8b8c4] [&_summary]:flex [&_summary]:items-center [&_summary]:justify-between [&_summary]:cursor-pointer [&_summary]:font-semibold [&_details_p]:mt-[10px] [&_details_p]:leading-[1.7]">
                    <div className="recommendation-heading flex items-center justify-between [&_.tag]:border-0 [&_.tag]:text-[var(--blue)] [&_.tag]:bg-[#1d2833] [&_.tag]:pl-[0]">
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
                    <h3>{card?.ok ? card.value.headline : "Refresh before your next move"}</h3>
                    {card?.ok ? (
                      <>
                        <p>Less debt. Less interest. More breathing room.</p>
                        <div className="comparison-bars flex flex-col gap-[12px] m-[18px_0] [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:flex-wrap [&>div]:gap-[5px] [&>div]:text-[8px] [&>div]:text-[#a8b8c4] [&_b]:text-[9px] [&_b]:text-[var(--ink)] [&_i]:block [&_i]:basis-[100%] [&_i]:h-[7px] [&_i]:rounded-[3px] [&_.repay-bar]:bg-[var(--blue)] [&_.yield-bar]:bg-[#1d2833] [&_.yield-bar]:max-w-[66.7%]">
                          <div>
                            <span>Repay · avoided interest</span>
                            <b>{comp.ok ? amount(comp.value.value.repaySaves) : "—"} USDC / yr</b>
                            <i className="repay-bar" />
                          </div>
                          <div>
                            <span>Supply · estimated yield</span>
                            <b>{comp.ok ? amount(comp.value.value.yieldEarns) : "—"} USDC / yr</b>
                            <i className="yield-bar" />
                          </div>
                        </div>
                        <div className="card-number-list tabular-nums [border-top:1px_solid_#344552] p-[6px_0] [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:p-[7px_0] [&>div]:gap-[10px] [&>div]:text-[8px] [&_span]:text-[#a8b8c4] [&_b]:flex [&_b]:items-center [&_b]:gap-[6px] [&_b]:font-bold [&_b]:text-[9px] [&_small]:text-[7px] [&_small]:text-[#a8b8c4]">
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
                          <label className="adjust-field flex flex-col text-[9px] gap-[7px] m-[12px_0] [&_input]:bg-[#101923] [&_input]:[border:1px_solid_#344552] [&_input]:rounded-[6px] [&_input]:p-[10px] [&_input]:w-full [&_input]:text-[12px]">
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
                            {card.value.cappedBy ? `Amount capped by ${card.value.cappedBy}.` : ""}
                          </p>
                          <p>
                            Execution fee: 0.10 test USDC → fees.demo.testnet, charged on mock
                            approval. Rates change. Repayment reduces liquidation risk within your
                            limits; it cannot remove it.
                          </p>
                          {card.value.assumptions.map((a) => (
                            <p key={a}>{a}</p>
                          ))}
                        </details>
                        <div className="card-actions flex gap-[9px] mt-[16px] [&>button]:flex-1 [&>button]:justify-center">
                          <button
                            type="button"
                            className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#344552] bg-transparent [&:hover]:bg-[#ffffff40] small"
                            onClick={() => setAdjusting((v) => !v)}
                          >
                            <SlidersHorizontal size={14} />
                            Adjust
                          </button>
                          <button
                            type="button"
                            className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] blue-button bg-[var(--blue)] text-white! [&:hover]:bg-[#183ac7] small"
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
                          <label className="adjust-field flex flex-col text-[9px] gap-[7px] m-[12px_0] [&_input]:bg-[#101923] [&_input]:[border:1px_solid_#344552] [&_input]:rounded-[6px] [&_input]:p-[10px] [&_input]:w-full [&_input]:text-[12px]">
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
                          className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#344552] bg-transparent [&:hover]:bg-[#ffffff40] small"
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
                    className="inline-receipt flex items-center text-left w-full [border:1px_solid_#344552] bg-[#1d2833] p-[14px_12px] gap-[10px] rounded-[9px] m-[10px_0] [&_b]:text-[11px] [&_b]:block [&_small]:text-[8px] [&_small]:text-[#a8b8c4] [&_small]:block [&_small]:mt-[4px] [&>svg]:ml-auto"
                    onClick={() => setSelectedReceipt(lastRepay)}
                  >
                    <span className="receipt-check w-[32px] h-[32px] grid place-items-center bg-[var(--lime)] text-[#101a17]! rounded-full text-[#a8b8c4]">
                      <Check size={20} />
                    </span>
                    <span>
                      <b>{lastRepay.title}</b>
                      <small>Demo receipt · Health {lastRepay.after}</small>
                    </span>
                    <ArrowUpRight size={18} />
                  </button>
                )}
                {messages.length > 1 && !thinking && (
                  <div className="follow-up-prompts flex gap-[7px] flex-wrap mt-[14px] [&_button]:bg-transparent [&_button]:[border:1px_solid_#344552] [&_button]:rounded-[6px] [&_button]:p-[7px_8px] [&_button]:text-[8px] [&_button]:flex [&_button]:gap-[5px] [&_button]:items-center">
                    <button type="button" onClick={() => _ask("What if NEAR drops 20%?")}>
                      What if NEAR drops? <ArrowUpRight size={12} />
                    </button>
                    <button type="button" onClick={() => _ask("What are my Guardian limits?")}>
                      My Guardian limits <ArrowUpRight size={12} />
                    </button>
                  </div>
                )}
              </div>
              <form
                className="chat-composer flex items-center [border:1px_solid_#344552] rounded-[10px] bg-[#1d2833] p-[6px] gap-[5px] mt-[5px] [&_input]:w-full [&_input]:min-w-0 [&_input]:p-[9px_7px] [&_input]:bg-transparent [&_input]:border-0 [&_input]:text-[10px] [&_input]:text-[var(--ink)] [&_input::placeholder]:text-[#a8b8c4] [&_button]:w-[36px] [&_button]:h-[34px] [&_button]:rounded-[7px] [&_button]:border-0 [&_button]:flex [&_button]:items-center [&_button]:justify-center [&_button]:bg-[var(--blue)] [&_button]:text-white [&_button]:shrink-0 [&_button:disabled]:opacity-[1] [&_button:disabled]:bg-[#1d2833] [&_button:disabled]:text-[#a8b8c4] max-[820px]:[&_input]:text-[8px] max-[620px]:[&_input]:text-[10px] max-[620px]:[&_input]:p-[11px_7px]"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  _ask(input);
                }}
              >
                <input
                  className="text-base!"
                  aria-label="Message Mr.Fund"
                  placeholder="Ask away. Money questions welcome."
                  value={input}
                  maxLength={500}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={thinking}
                />
                <button
                  type="button"
                  aria-label="Open voice input"
                  title="Voice input"
                  onClick={() => openPanel("voice")}
                  className="bg-[#293a47]! text-[#dbf884]! hover:bg-[#354c5b]!"
                >
                  <Mic size={19} />
                </button>
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={!input.trim() || thinking}
                >
                  {thinking ? (
                    <LoaderCircle size={18} className="spin animate-spin" />
                  ) : (
                    <ArrowUpRight size={23} />
                  )}
                </button>
              </form>
              <div className="chat-disclaimer flex items-center justify-center gap-[4px] text-[7px] text-[#a8b8c4] p-[9px_0_12px] max-[820px]:text-[6px] max-[620px]:text-[7px] max-[620px]:pb-[12px]">
                <LockKeyhole size={10} />
                You approve every move. Demo chat isn't an LLM connection.
              </div>
            </section>
          )}
          {panel === "voice" && <VoicePanel onSend={_ask} onNotice={setNotice} />}
          {panel !== "chat" && panel !== "voice" && toolContent(panel)}
        </aside>
      )}
      {wide && voiceOpen && (
        <ModalFrame
          title="Speak with Mr.Fund."
          eyebrow="VOICE CONSULTATION"
          close={() => setVoiceOpen(false)}
        >
          <VoicePanel
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
            className="play-toast fixed bottom-[165px] left-[50%] transform-[translateX(-50%)] z-[100] flex gap-[11px] items-center bg-[#263847] text-white [border:1px_solid_#434b58] rounded-[12px] p-[14px_16px] text-[11px] shadow-[0_8px_40px_#1c23313b] max-w-[calc(100vw_-_30px)] w-[max-content] [&>span]:h-[25px] [&>span]:w-[25px] [&>span]:rounded-full [&>span]:bg-[var(--lime)] [&>span]:text-[#101a17] [&>span]:grid [&>span]:place-items-center [&>span]:shrink-0 [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-[#b6bcc5] [&_button]:ml-[10px] [&_button]:flex [&_button]:p-[3px] max-[620px]:bottom-[155px] max-[620px]:text-[10px] max-[620px]:p-[11px] max-[620px]:gap-[8px] max-[620px]:w-[calc(100vw_-_28px)] max-[620px]:leading-[1.6] max-[620px]:[&>span]:w-[22px] max-[620px]:[&>span]:h-[22px]"
            role="status"
          >
            <span>
              <Check size={16} />
            </span>
            {notice}
            <button type="button" aria-label="Dismiss notification" onClick={() => setNotice("")}>
              <X size={15} />
            </button>
          </div>
        )}

        {modal === "wallet" && (
          <ModalFrame
            eyebrow="JUST A DRESS REHEARSAL"
            title={
              connected
                ? "Your mock wallet."
                : stage === "welcome"
                  ? "Connect to begin."
                  : "Come on in."
            }
            close={() => setModal(null)}
          >
            <Tag className="text-[#a8b8c4]!">NETWORK · TESTNET · SIMULATED</Tag>
            <p className="modal-copy text-[12px] leading-[1.8] text-[#a8b8c4] m-[20px_0]! max-[620px]:text-[11px]">
              {connected
                ? "Connected to a local demo identity. These tokens are simulated balances."
                : "Try the whole experience with a mock wallet. No extension, real account, or signature needed."}
            </p>
            {connected ? (
              <>
                <div className="wallet-account flex items-center gap-[10px] p-[16px_0_24px] [&_b]:text-[12px] [&_small]:text-[10px] [&_small]:text-[#a8b8c4] [&_small]:block [&_small]:mt-[5px] [&_.icon-button]:ml-auto">
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
                  className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#344552] bg-transparent [&:hover]:bg-[#ffffff40] full-width w-full"
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
                  className="wallet-option flex gap-[13px] items-center w-full bg-[#1d2833] [border:1px_solid_#344552] p-[17px_14px] rounded-[12px] text-left mt-[24px] [&>span]:w-[43px] [&>span]:h-[43px] [&>span]:bg-[var(--blue)] [&>span]:rounded-[11px] [&>span]:text-[#fff] [&>span]:grid [&>span]:place-items-center [&_b]:text-[13px] [&_small]:text-[9px] [&_small]:text-[#a8b8c4] [&_small]:block [&_small]:mt-[5px] [&>svg]:ml-auto [&:hover]:bg-[#1d2833] [&:hover]:[border-color:#b7c79f]"
                  disabled={connecting}
                  onClick={connectDemoWallet}
                >
                  <span>
                    {connecting ? (
                      <LoaderCircle size={24} className="animate-spin" />
                    ) : (
                      <Wallet size={24} />
                    )}
                  </span>
                  <div>
                    <b>Demo wallet</b>
                    <small>
                      {connecting
                        ? "Connecting to the simulated testnet…"
                        : "1,000 test USDC · instant connection"}
                    </small>
                  </div>
                  <ArrowUpRight size={20} />
                </button>
                <div className="disabled-wallets p-[25px_0_20px] text-center [&>span]:text-[9px] [&>span]:text-[#a8b8c4] [&>div]:flex [&>div]:justify-center [&>div]:gap-[27px] [&>div]:mt-[16px] [&>div]:text-[#a8b8c4] [&>div]:font-[family-name:var(--font-display)] [&>div]:text-[11px]">
                  <span>Real wallets arrive with the live integration</span>
                  <div>
                    <b>METEOR</b>
                    <b>INTEAR</b>
                    <b>NEAR</b>
                  </div>
                </div>
              </>
            )}
            <p className="fine-print text-[9px] leading-[1.8] text-[#a8b8c4] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
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
            <label className="form-field flex flex-col gap-[8px] mt-[21px] min-w-0 [&>span]:text-[10px] [&>span]:font-bold [&>span]:flex [&>span]:justify-between [&>span_small]:text-[8px] [&>span_small]:font-normal [&>span_small]:text-[#a8b8c4] [&_input]:p-[12px] [&_input]:bg-[#1d2833] [&_input]:[border:1px_solid_#344552] [&_input]:rounded-[7px] [&_input]:text-[12px] [&_input]:text-[var(--ink)] [&_input]:w-full [&_input]:min-w-0 [&_select]:p-[12px] [&_select]:bg-[#1d2833] [&_select]:[border:1px_solid_#344552] [&_select]:rounded-[7px] [&_select]:text-[12px] [&_select]:text-[var(--ink)] [&_select]:w-full [&_select]:min-w-0 [&>small]:text-[8px] [&>small]:leading-[1.5] [&>small]:text-[#a8b8c4] max-[620px]:[&>span]:text-[9px] max-[620px]:[&_input]:text-[11px] max-[620px]:[&_input]:p-[11px_9px] max-[620px]:[&_select]:text-[11px] max-[620px]:[&_select]:p-[11px_9px] max-[620px]:[&>small]:text-[7px]">
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
            <label className="form-field flex flex-col gap-[8px] mt-[21px] min-w-0 [&>span]:text-[10px] [&>span]:font-bold [&>span]:flex [&>span]:justify-between [&>span_small]:text-[8px] [&>span_small]:font-normal [&>span_small]:text-[#a8b8c4] [&_input]:p-[12px] [&_input]:bg-[#1d2833] [&_input]:[border:1px_solid_#344552] [&_input]:rounded-[7px] [&_input]:text-[12px] [&_input]:text-[var(--ink)] [&_input]:w-full [&_input]:min-w-0 [&_select]:p-[12px] [&_select]:bg-[#1d2833] [&_select]:[border:1px_solid_#344552] [&_select]:rounded-[7px] [&_select]:text-[12px] [&_select]:text-[var(--ink)] [&_select]:w-full [&_select]:min-w-0 [&>small]:text-[8px] [&>small]:leading-[1.5] [&>small]:text-[#a8b8c4] max-[620px]:[&>span]:text-[9px] max-[620px]:[&_input]:text-[11px] max-[620px]:[&_input]:p-[11px_9px] max-[620px]:[&_select]:text-[11px] max-[620px]:[&_select]:p-[11px_9px] max-[620px]:[&>small]:text-[7px]">
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
            <label className="switch-row flex items-center justify-between m-[25px_0] [&_b]:text-[11px] [&_small]:block [&_small]:text-[9px] [&_small]:text-[#a8b8c4] [&_small]:mt-[5px] [&_input]:w-[19px] [&_input]:h-[19px] [&_input]:[accent-color:var(--blue)]">
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
              className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#344552] bg-transparent [&:hover]:bg-[#ffffff40] full-width w-full"
              onClick={reset}
            >
              <RefreshCw size={16} />
              Reset all demo activity
            </button>
            <p className="fine-print text-[9px] leading-[1.8] text-[#a8b8c4] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
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
            <div className="help-block flex gap-[14px] mt-[26px] [&_b]:text-[12px] [&_p]:text-[10px] [&_p]:text-[#a8b8c4] [&_p]:leading-[1.8] [&_p]:mt-[7px]">
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
            <div className="help-block flex gap-[14px] mt-[26px] [&_b]:text-[12px] [&_p]:text-[10px] [&_p]:text-[#a8b8c4] [&_p]:leading-[1.8] [&_p]:mt-[7px]">
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
            <div className="help-block flex gap-[14px] mt-[26px] [&_b]:text-[12px] [&_p]:text-[10px] [&_p]:text-[#a8b8c4] [&_p]:leading-[1.8] [&_p]:mt-[7px]">
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
            <p className="risk-note flex gap-[9px] bg-[#1d2833] p-[15px] rounded-[9px] text-[9px] leading-[1.8] text-[#a8b8c4] mt-[24px]!">
              <Shield size={18} />
              The live product aims to reduce liquidation risk within your limits. It cannot prevent
              liquidation. Guardian and Rhea have smart-contract risks; hackathon code is unaudited.
            </p>
            <p className="mt-5! text-[9px] leading-relaxed text-[#a8b8c4]">
              Character:{" "}
              <a
                className="underline underline-offset-2"
                href="https://sketchfab.com/3d-models/businessman-rigged-8933d61fcb1e46f3aead661227bb4fed"
                target="_blank"
                rel="noreferrer"
              >
                Businessman (Rigged) by Jungle Jim
              </a>
              —{" "}
              <a
                className="underline underline-offset-2"
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY 4.0
              </a>
              . Adapted with a standing pose, procedural wave and scene placement.
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
            <div className="setup-steps flex items-center gap-[10px] mt-[24px] [&>span]:text-[9px] [&>span]:text-[#a8b8c4] [&>span]:font-semibold [&>span.current]:text-[var(--blue)] [&>i]:flex-1 [&>i]:h-[1px] [&>i]:bg-[#1d2833] max-[620px]:[&>span]:text-[8px]">
              <span className={playClasses(!setupReview ? "current" : "")}>01 Configure</span>
              <i />
              <span className={playClasses(setupReview ? "current" : "")}>02 Review</span>
              <i />
              <span>03 Mock approval</span>
            </div>
            <div className="setup-position flex items-center gap-[11px] bg-[#1d2833] p-[15px] [border:1px_solid_#344552] rounded-[9px] mt-[23px] [&>span]:flex-1 [&>span]:min-w-0 [&_b]:block [&_b]:text-[11px] [&_small]:block [&_small]:text-[8px] [&_small]:leading-[1.6] [&_small]:mt-[5px] [&_small]:text-[#a8b8c4] [&_.tag]:text-[7px] [&_.tag]:text-[#a8b8c4] [&_.tag]:[border-color:#d6dfc7] max-[620px]:p-[12px] max-[620px]:gap-[8px] max-[620px]:[&_b]:text-[9px] max-[620px]:[&_small]:text-[7px] max-[620px]:[&_.tag]:hidden">
              <Shield size={20} />
              <span>
                <b>Guardian-held loan · NEAR / USDC</b>
                <small>Separate simulated position. Your wallet loan stays where it is.</small>
              </span>
              <Tag>G1 DEMO</Tag>
            </div>
            {!setupReview ? (
              <>
                <div className="fixed-action mt-[23px] [&_small]:text-[8px] [&_small]:tracking-[.08em] [&_small]:text-[#a8b8c4] [&_b]:flex [&_b]:items-center [&_b]:justify-between [&_b]:text-[11px] [&_b]:mt-[9px] [&_b]:pb-[15px] [&_b]:[border-bottom:1px_solid_var(--line)]">
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
              <div className="policy-summary pt-[20px] [&_p]:text-[13px] [&_p]:leading-[1.9] [&_p]:text-[#a8b8c4] [&_p]:mt-[13px] [&_b]:text-[var(--ink)] [&_b]:font-bold max-[620px]:[&_p]:text-[12px]">
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
            <div className="fee-box bg-[#1d2833] rounded-[9px] p-[15px] mt-[23px] flex flex-col gap-[11px] [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:text-[10px] [&>div]:gap-[8px] [&>div>span]:flex [&>div>span]:items-center [&>div>span]:gap-[8px] [&_.tag]:text-[6px] [&_.tag]:text-[#a8b8c4] [&_.tag]:p-[3px_4px] [&_b]:text-[10px] [&_b]:whitespace-nowrap [&>small]:text-[8px] [&>small]:text-[#a8b8c4] [&>small]:leading-[1.7] max-[620px]:p-[12px] max-[620px]:[&_.tag]:text-[5px] max-[620px]:[&_.tag]:tracking-[0] max-[620px]:[&>div]:text-[8px] max-[620px]:[&_b]:text-[8px] max-[620px]:[&>small]:text-[7px]">
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
            <p className="fine-print text-[9px] leading-[1.8] text-[#a8b8c4] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
              This flow simulates a separate Guardian account and loan. No account is created and no
              tokens move on-chain. Protection cannot prevent liquidation.
            </p>
            <div className="modal-actions flex gap-[10px] justify-end mt-[25px] [&_.button]:flex-1 [&_.button]:text-[10px]! max-[620px]:gap-[8px] max-[620px]:[&_.button]:text-[9px]! max-[620px]:[&_.button]:p-[12px_9px] max-[620px]:[&_.button]:gap-[6px]">
              <button
                type="button"
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#344552] bg-transparent [&:hover]:bg-[#ffffff40]"
                onClick={setupReview ? () => setSetupReview(false) : () => setModal(null)}
              >
                {setupReview ? "Back to edit" : "Maybe later"}
              </button>
              <button
                type="button"
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] blue-button bg-[var(--blue)] text-white! [&:hover]:bg-[#183ac7]"
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
            <p className="modal-copy text-[12px] leading-[1.8] text-[#a8b8c4] m-[20px_0]! max-[620px]:text-[11px]">
              {pending.description}
            </p>
            <div className="approval-amount flex flex-col gap-[11px] items-center bg-[#1d2833] p-[27px_15px] rounded-[11px] text-center [&_small]:text-[8px] [&_small]:tracking-[.1em] [&_small]:text-[#a8b8c4] [&_b]:font-[family-name:var(--font-display)] [&_b]:text-[25px] [&_b]:tracking-[-.7px] [&_span]:text-[9px] [&_span]:text-[#a8b8c4] max-[620px]:[&_b]:text-[23px]">
              <small>YOU AUTHORIZE IN THIS DEMO</small>
              <b>{pending.amount}</b>
              <span>Account: you.demo.testnet</span>
            </div>
            <label className="form-field flex flex-col gap-[8px] mt-[21px] min-w-0 [&>span]:text-[10px] [&>span]:font-bold [&>span]:flex [&>span]:justify-between [&>span_small]:text-[8px] [&>span_small]:font-normal [&>span_small]:text-[#a8b8c4] [&_input]:p-[12px] [&_input]:bg-[#1d2833] [&_input]:[border:1px_solid_#344552] [&_input]:rounded-[7px] [&_input]:text-[12px] [&_input]:text-[var(--ink)] [&_input]:w-full [&_input]:min-w-0 [&_select]:p-[12px] [&_select]:bg-[#1d2833] [&_select]:[border:1px_solid_#344552] [&_select]:rounded-[7px] [&_select]:text-[12px] [&_select]:text-[var(--ink)] [&_select]:w-full [&_select]:min-w-0 [&>small]:text-[8px] [&>small]:leading-[1.5] [&>small]:text-[#a8b8c4] max-[620px]:[&>span]:text-[9px] max-[620px]:[&_input]:text-[11px] max-[620px]:[&_input]:p-[11px_9px] max-[620px]:[&_select]:text-[11px] max-[620px]:[&_select]:p-[11px_9px] max-[620px]:[&>small]:text-[7px]">
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
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#344552] bg-transparent [&:hover]:bg-[#ffffff40]"
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
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] blue-button bg-[var(--blue)] text-white! [&:hover]:bg-[#183ac7]"
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
            <p className="modal-copy text-[12px] leading-[1.8] text-[#a8b8c4] m-[20px_0]! max-[620px]:text-[11px]">
              {selectedReceipt.detail}
            </p>
            {selectedReceipt.before && (
              <div className="receipt-health flex items-center justify-between [border:1px_solid_#344552] rounded-[8px] p-[14px_12px] gap-[10px] [&>span]:text-[10px] [&>span]:text-[#a8b8c4] [&_b]:flex [&_b]:gap-[8px] [&_b]:items-center [&_b]:font-[family-name:var(--font-display)] [&_b]:text-[15px] max-[620px]:p-[12px_9px] max-[620px]:[&>span]:text-[8px] max-[620px]:[&_b]:text-[13px]">
                <span>Position health</span>
                <b>
                  {selectedReceipt.before}
                  <ArrowRight size={18} />
                  {selectedReceipt.after}
                </b>
              </div>
            )}
            <div className="receipt-metadata mt-[16px] [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:p-[12px_0] [&>div]:[border-bottom:1px_solid_#344552] [&>div]:text-[10px] [&_span]:text-[#a8b8c4] [&_b]:text-[9px] [&~.button]:mt-[22px]">
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
            <p className="fine-print text-[9px] leading-[1.8] text-[#a8b8c4] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
              No explorer link: this is a local UI simulation. The result is computed from the
              updated demo fixture, not observed on-chain.
            </p>
            <button
              type="button"
              className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] blue-button bg-[var(--blue)] text-white! [&:hover]:bg-[#183ac7] full-width w-full"
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
