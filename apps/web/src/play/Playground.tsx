"use client";

import { mood as computeMood } from "@mrfund/engine";
import { type GuardianPolicy, validatePolicy } from "@mrfund/shared";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Copy,
  ExternalLink,
  Hand,
  History,
  LayoutGrid,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  MessageCircle,
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
  Wallet,
  X,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import { type FormEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
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

const OfficeScene = dynamic(() => import("./OfficeScene").then((m) => m.OfficeScene), {
  ssr: false,
  loading: () => (
    <div className="office-scene absolute inset-[119px_-15px_7px] cursor-grab touch-pan-y [&:active]:cursor-grabbing [&_canvas]:w-full [&_canvas]:h-full [&_canvas]:block min-[1500px]:inset-[130px_-10px_10px] max-[820px]:inset-[113px_-70px_15px] max-[620px]:inset-[110px_-30px_5px]">
      <span className="scene-loading absolute top-[50%] w-full text-center text-[11px] text-[#713825]">
        Opening the office…
      </span>
    </div>
  ),
});
type Tab = "office" | "guardian" | "activity";
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
        <div className="modal-heading flex justify-between items-start gap-[10px] [&_.eyebrow]:text-[#8a927e] [&_.eyebrow]:text-[8px] [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[30px] [&_h2]:font-medium [&_h2]:leading-[1.15] [&_h2]:tracking-[-1.2px] [&_h2]:mt-[7px] [&>.icon-button]:bg-[#eeefe6] [&>.icon-button]:w-[30px] [&>.icon-button]:h-[30px] [&>.icon-button]:shrink-0 max-[620px]:[&_h2]:text-[27px] max-[620px]:[&_.eyebrow]:text-[7px]">
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
function Token({ usdc = false }: { usdc?: boolean }) {
  return <span className={playClasses(`token ${usdc ? "usdc" : "near"}`)}>{usdc ? "$" : "N"}</span>;
}
function Tag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={playClasses(`tag ${className}`)}>{children}</span>;
}

export function Playground() {
  const [tab, setTab] = useState<Tab>("office");
  const [connected, setConnected] = useState(false);
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
  const receiptId = useRef(0);
  useEffect(() => {
    setNow(Date.now());
    return () => {
      for (const timer of timeouts.current) clearTimeout(timer);
    };
  }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);
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
    const question = text.trim().slice(0, 500);
    setMessages((prev) => [...prev, { id: ++messageId.current, role: "user", text: question }]);
    setInput("");
    setThinking(true);
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
  const latest = receipts[0];
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
    <label className="form-field flex flex-col gap-[8px] mt-[21px] min-w-0 [&>span]:text-[10px] [&>span]:font-bold [&>span]:flex [&>span]:justify-between [&>span_small]:text-[8px] [&>span_small]:font-normal [&>span_small]:text-[#9ba18f] [&_input]:p-[12px] [&_input]:bg-[#f6f7f0] [&_input]:[border:1px_solid_#dce0d2] [&_input]:rounded-[7px] [&_input]:text-[12px] [&_input]:text-[var(--ink)] [&_input]:w-full [&_input]:min-w-0 [&_select]:p-[12px] [&_select]:bg-[#f6f7f0] [&_select]:[border:1px_solid_#dce0d2] [&_select]:rounded-[7px] [&_select]:text-[12px] [&_select]:text-[var(--ink)] [&_select]:w-full [&_select]:min-w-0 [&>small]:text-[8px] [&>small]:leading-[1.5] [&>small]:text-[#8e9783] max-[620px]:[&>span]:text-[9px] max-[620px]:[&_input]:text-[11px] max-[620px]:[&_input]:p-[11px_9px] max-[620px]:[&_select]:text-[11px] max-[620px]:[&_select]:p-[11px_9px] max-[620px]:[&>small]:text-[7px]">
      <span>
        {label}
        {optional && <small>Optional</small>}
      </span>
      <div className="field-input relative [&_input]:pr-[55px] [&_b]:absolute [&_b]:right-[13px] [&_b]:top-[14px] [&_b]:text-[9px] [&_b]:text-[#939b87] [&_b]:font-medium [&_b]:pointer-events-none max-[620px]:[&_b]:text-[8px] max-[620px]:[&_b]:top-[13px] max-[620px]:[&_b]:right-[9px] max-[620px]:[&_input]:pr-[44px]">
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
        <div className="guardian-top flex items-center gap-[10px] [&_.tag]:border-0 [&_.tag]:text-[7px] [&_.tag]:text-[#5b6b37] [&_.tag]:bg-[#d3eb86] [&_.tag]:p-[6px_8px] max-[1100px]:[&_.tag]:text-[6px] max-[820px]:[&_.tag]:text-[8px] max-[620px]:gap-[8px] max-[620px]:[&_.tag]:text-[6px]">
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
          <span className="section-index ml-auto text-[7px] tracking-[.08em] text-[#6d7f46] font-bold max-[1100px]:text-[6px] max-[820px]:text-[8px] max-[620px]:text-[6px]">
            02 / GUARDIAN
          </span>
        </div>
        <div className="guardian-body flex items-center relative gap-[10px] pt-[17px] min-h-[157px] [&>div:first-child]:relative [&>div:first-child]:z-[1] [&>div:first-child]:flex-1 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[27px] [&_h2]:leading-[1.12] [&_h2]:tracking-[-1.2px] [&_h2]:font-medium [&_p]:text-[9px] [&_p]:leading-[1.7] [&_p]:text-[#687849] [&_p]:max-w-[265px] [&_p]:mt-[11px] min-[1500px]:[&_h2]:text-[32px] min-[1500px]:[&_p]:text-[10px] min-[1500px]:min-h-[165px] max-[1100px]:[&_h2]:text-[24px] max-[1100px]:[&_p]:text-[8px] max-[820px]:[&_h2]:text-[31px] max-[820px]:[&_p]:text-[11px] max-[820px]:[&_p]:max-w-[350px] max-[620px]:min-h-[155px] max-[620px]:[&_h2]:text-[26px] max-[620px]:[&_p]:text-[9px]">
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
            <span className="shield-spark absolute text-[#739230] text-[31px] right-[0] top-[2px]">
              ✦
            </span>
          </div>
        </div>
        {guardian === "inactive" ? (
          <div className="guardian-bottom flex gap-[20px] items-center mt-[11px] [&>span]:text-[7px] [&>span]:text-[#6f7d50] [&>span]:leading-[1.65] max-[1100px]:gap-[10px] max-[1100px]:[&_.button]:text-[9px]! max-[1100px]:[&_.button]:p-[12px] max-[1100px]:[&>span]:text-[6px] max-[820px]:gap-[20px] max-[820px]:[&_.button]:text-[11px]! max-[820px]:[&_.button]:p-[13px_16px] max-[820px]:[&>span]:text-[8px] max-[620px]:gap-[14px] max-[620px]:[&_.button]:text-[9px]! max-[620px]:[&_.button]:p-[12px_14px] max-[620px]:[&>span]:text-[7px]">
            <button
              type="button"
              className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] ink-button bg-[var(--ink)] text-white! [&:hover]:bg-[#344052]"
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
            <div className="guardian-numbers grid grid-cols-[repeat(3,1fr)] m-[13px_0] [border-top:1px_solid_#bdd96e] pt-[15px] gap-[12px] [&_small]:block [&_small]:text-[7px] [&_small]:text-[#6a7e3c] [&_small]:tracking-[.05em] [&_strong]:font-[family-name:var(--font-display)] [&_strong]:text-[23px] [&_strong]:font-medium [&_strong]:block [&_strong]:mt-[4px] [&_em]:[font:8px_var(--font-body)] max-[620px]:gap-[8px] max-[620px]:[&_small]:text-[6px] max-[620px]:[&_strong]:text-[22px] max-[620px]:[&_em]:text-[6px]">
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
                  className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] ink-button bg-[var(--ink)] text-white! [&:hover]:bg-[#344052] small"
                  onClick={() => ownerAction(guardian === "active" ? "pause" : "resume")}
                >
                  {guardian === "active" ? <Pause size={15} /> : <Play size={15} />}
                  {guardian === "active" ? "Pause" : "Resume"}
                </button>
              )}
              <button
                type="button"
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#bcc6a8] bg-transparent [&:hover]:bg-[#ffffff40] small"
                onClick={() => ownerAction("withdraw")}
              >
                Withdraw
              </button>
              <button
                type="button"
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#bcc6a8] bg-transparent [&:hover]:bg-[#ffffff40] small"
                onClick={() => ownerAction("topup")}
              >
                <Plus size={15} />
                Top up
              </button>
              {!full && (
                <button
                  type="button"
                  className="icon-button inline-flex items-center justify-center border-0 bg-transparent w-[32px] h-[32px] rounded-full p-0 [transition:background_.18s] [&:hover]:bg-[#8080801a]"
                  onClick={() => setTab("guardian")}
                  aria-label="View Guardian details"
                >
                  <ArrowUpRight size={20} />
                </button>
              )}
            </div>
          </>
        )}
        {full && guardian !== "inactive" && (
          <div className="guardian-details mt-[24px] [border-top:1px_solid_#bdd56f] pt-[20px] [&_.fine-print]:text-[#788b4b] [&_.fine-print]:text-[8px]">
            <div className="detail-grid grid grid-cols-[1fr_1fr] gap-[23px_18px] [&_small]:text-[9px] [&_small]:text-[#7e9150] [&_small]:block [&_b]:text-[10px] [&_b]:block [&_b]:leading-[1.7] [&_b]:mt-[6px] [&_b]:font-bold [&_span]:text-[8px] [&_span]:block [&_span]:leading-[1.7] [&_span]:text-[#8b9b65] max-[620px]:gap-[20px_13px] max-[620px]:[&_b]:text-[9px] max-[620px]:[&_small]:text-[8px]">
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
            <p className="fine-print text-[9px] leading-[1.8] text-[#929987] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
              Demo model: G1 Guardian-held loan. This does not transfer your existing wallet
              position. No contract is deployed. Fast markets, stale data, insufficient reserve and
              watcher downtime can still lead to liquidation.
            </p>
            <div className="replay-actions flex flex-wrap items-center gap-[10px] mt-[18px]">
              <button
                type="button"
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] ink-button bg-[var(--ink)] text-white! [&:hover]:bg-[#344052] small"
                onClick={() => replay(false)}
              >
                <Play size={14} />
                Run simulated trigger
              </button>
              <button
                type="button"
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#bcc6a8] bg-transparent [&:hover]:bg-[#ffffff40] small"
                onClick={() => replay(true)}
              >
                Test over-limit rejection
              </button>
              {guardian !== "deactivated" && (
                <button
                  type="button"
                  className="text-button bg-transparent border-0 text-[10px]! font-extrabold! inline-flex items-center gap-[9px] danger-text text-[#9a4d35]! p-[7px_0]"
                  onClick={() => ownerAction("deactivate")}
                >
                  Deactivate Guardian
                </button>
              )}
            </div>
            <small className="fine-print text-[9px] leading-[1.8] text-[#929987] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
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
        <div className="panel-heading flex justify-between items-center gap-[15px] [&_.eyebrow]:text-[#979f89] [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[30px] [&_h2]:font-medium [&_h2]:tracking-[-1px] [&_h2]:mt-[8px] [&>.tag]:[border-color:#d7decc] [&>.tag]:text-[#899878] [&>.tag]:text-[8px] max-[620px]:items-start max-[620px]:flex-col max-[620px]:[&_h2]:text-[28px]">
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
                className="receipt-row flex items-center gap-[15px] p-[18px_0] border-0 [border-bottom:1px_solid_#e6eadd] bg-transparent w-full text-left [&>svg]:ml-auto [&>svg]:text-[#a1aa94] [&_b]:text-[12px] [&_b]:block [&_small]:text-[9px] [&_small]:block [&_small]:mt-[7px] [&_small]:text-[#99a18f] [&:hover]:bg-[#f5f6ee] max-[620px]:gap-[10px] max-[620px]:[&_b]:text-[11px] max-[620px]:[&_small]:text-[8px]"
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
          <div className="empty-activity flex items-center flex-col text-center p-[65px_15px_75px] gap-[17px] [&>svg]:text-[#919c81] [&_h3]:font-[family-name:var(--font-display)] [&_h3]:text-[30px] [&_h3]:font-medium [&_h3]:tracking-[-1px] [&_p]:text-[#929b85] [&_p]:text-[11px] [&_p]:leading-[1.8] [&_p]:max-w-[340px] [&_.button]:mt-[8px]">
            <History size={38} strokeWidth={1.3} />
            <h3>A clean slate.</h3>
            <p>Your demo receipts will land here after you try a repayment or set up Guardian.</p>
            <button
              type="button"
              className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] blue-button bg-[var(--blue)] text-white! [&:hover]:bg-[#183ac7]"
              onClick={() => {
                setTab("office");
                _ask("Should I repay or earn yield?");
              }}
            >
              Find my first move <ArrowRight size={17} />
            </button>
          </div>
        )}
        <p className="fine-print text-[9px] leading-[1.8] text-[#929987] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
          Demo receipts document local UI state. Real transaction hashes and explorer links only
          appear in the future live integration.
        </p>
      </section>
    );
  }

  return (
    <main className="play-app pt-[18px]! [--ink:#1c2331] [--cream:#f6f4ec] [--paper:#fffef9] [--orange:#ff643b] [--blue:#284bdf] [--lime:#dbf884] [--muted:#7b7d80] [--line:#dfdfd6] box-border bg-[var(--cream)] text-[var(--ink)] font-[family-name:var(--font-body)] text-[14px] min-h-screen p-[0_max(28px,calc((100vw_-_1456px)/2))_22px] antialiased [font-optical-sizing:auto] [&_*]:box-border [&_button]:[font:inherit] [&_input]:[font:inherit] [&_select]:[font:inherit] [&_button]:[-webkit-tap-highlight-color:transparent] [&_a]:[-webkit-tap-highlight-color:transparent] [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-[.45] [&_a]:text-inherit [&_a]:no-underline [&_button]:text-inherit [&_:where(h1)]:m-0 [&_:where(h2)]:m-0 [&_:where(h3)]:m-0 [&_:where(p)]:m-0 [&_button:focus-visible]:[outline:3px_solid_var(--blue)] [&_button:focus-visible]:outline-offset-4 [&_a:focus-visible]:[outline:3px_solid_var(--blue)] [&_a:focus-visible]:outline-offset-4 [&_input:focus-visible]:[outline:3px_solid_var(--blue)] [&_input:focus-visible]:outline-offset-4 [&_select:focus-visible]:[outline:3px_solid_var(--blue)] [&_select:focus-visible]:outline-offset-4 [&_summary:focus-visible]:[outline:3px_solid_var(--blue)] [&_summary:focus-visible]:outline-offset-4 [&_::selection]:bg-[var(--lime)] [&_::selection]:text-[var(--ink)] [&_svg]:shrink-0 [&_.mood-concerned_.mood-face]:text-[#b95a1f] [&_.mood-pleased_.mood-chip]:bg-[var(--lime)] min-[1500px]:pl-[max(45px,calc((100vw_-_1456px)/2))] min-[1500px]:pr-[max(45px,calc((100vw_-_1456px)/2))] max-[1100px]:pl-[20px] max-[1100px]:pr-[20px] max-[620px]:p-[0_14px_20px] motion-reduce:[&_*]:[transition:none]! motion-reduce:[&_*]:[scroll-behavior:auto]! motion-reduce:[&_*::before]:[transition:none]! motion-reduce:[&_*::before]:[scroll-behavior:auto]! motion-reduce:[&_*::after]:[transition:none]! motion-reduce:[&_*::after]:[scroll-behavior:auto]! motion-reduce:[&_*]:animate-none m-[-8px] [&_button]:[font-family:inherit] [&_button]:[line-height:inherit] [&_input]:[font-family:inherit]">
      <header className="play-header h-[79px] flex items-center justify-between gap-[20px] bg-[var(--ink)] text-[var(--paper)] p-[0_23px] rounded-[18px] [&_nav]:flex [&_nav]:items-center [&_nav]:gap-[7px] [&_nav_button]:flex [&_nav_button]:items-center [&_nav_button]:gap-[8px] [&_nav_button]:border-0 [&_nav_button]:bg-transparent [&_nav_button]:text-[#b2b7c0] [&_nav_button]:p-[12px_17px] [&_nav_button]:rounded-[10px] [&_nav_button]:text-[12px] [&_nav_button]:font-semibold [&_nav_button]:[transition:background_.18s,color_.18s] [&_nav_button:hover]:bg-[#333b4b] [&_nav_button:hover]:text-white [&_nav_button.active]:bg-[#3a4250] [&_nav_button.active]:text-white max-[1100px]:p-[0_18px] max-[1100px]:h-[74px] max-[1100px]:[&_nav_button]:p-[11px_12px] max-[1100px]:[&_nav_button]:text-[10px] max-[1100px]:[&_nav_button]:gap-[6px] max-[820px]:gap-[9px] max-[820px]:[&_.brand-mark]:w-[33px] max-[820px]:[&_.brand-mark]:h-[33px] max-[820px]:[&_nav]:gap-[1px] max-[820px]:[&_nav_button]:p-[10px] max-[820px]:[&_nav_button]:text-[9px] max-[820px]:[&_nav_button]:gap-[5px] max-[820px]:[&_nav_button_svg]:w-[13px] max-[620px]:h-[115px] max-[620px]:relative max-[620px]:p-[0_14px_44px] max-[620px]:rounded-[14px] max-[620px]:[&_.brand-mark]:w-[33px] max-[620px]:[&_.brand-mark]:h-[33px] max-[620px]:[&_nav]:absolute max-[620px]:[&_nav]:left-[12px] max-[620px]:[&_nav]:right-[12px] max-[620px]:[&_nav]:bottom-[9px] max-[620px]:[&_nav]:flex max-[620px]:[&_nav]:gap-[5px] max-[620px]:[&_nav]:[border-top:1px_solid_#ffffff12] max-[620px]:[&_nav]:pt-[7px] max-[620px]:[&_nav_button]:flex-1 max-[620px]:[&_nav_button]:justify-center max-[620px]:[&_nav_button]:p-[8px_7px] max-[620px]:[&_nav_button]:text-[10px] max-[620px]:[&_nav_button]:gap-[6px] max-[620px]:[&_nav_button]:rounded-[6px] max-[620px]:[&_nav_button_svg]:w-[14px]">
        <a
          className="wordmark flex items-center gap-[11px] font-[family-name:var(--font-display)] text-[32px] font-extrabold tracking-[-1.5px] max-[1100px]:text-[27px] max-[820px]:text-[24px] max-[820px]:gap-[7px] max-[620px]:text-[25px] max-[620px]:gap-[8px]"
          href="/play"
          aria-label="Mr.Fund office"
        >
          <span className="brand-mark h-[39px] w-[39px] flex items-center justify-center bg-[var(--orange)] rounded-[11px] text-[var(--ink)] text-[29px] leading-[1] relative tracking-[-3px] pr-[6px] [&>span]:text-[21px] [&>span]:absolute [&>span]:right-[4px] [&>span]:top-[2px] [&>span]:leading-[1]">
            m<span>↗</span>
          </span>
          <span>
            mr.fund
            <span className="brand-dot text-[10px] [align-self:flex-start] [vertical-align:top] relative top-[7px] left-[3px] tracking-[0] max-[620px]:text-[8px] max-[620px]:top-[5px]">
              ®
            </span>
          </span>
        </a>
        <nav aria-label="Playground navigation">
          {(
            [
              { id: "office", name: "The office", icon: <LayoutGrid size={16} /> },
              { id: "guardian", name: "Guardian", icon: <Shield size={16} /> },
              { id: "activity", name: "Activity", icon: <History size={16} /> },
            ] as const
          ).map((item) => (
            <button
              type="button"
              key={item.id}
              className={playClasses(tab === item.id ? "active" : "")}
              onClick={() => setTab(item.id)}
            >
              {item.icon}
              <span>{item.name}</span>
              {item.id === "activity" && receipts.length > 0 && (
                <i className="nav-count not-italic text-[10px] bg-[var(--lime)] text-[var(--ink)] rounded-[8px] p-[1px_5px]">
                  {receipts.length}
                </i>
              )}
            </button>
          ))}
        </nav>
        <div className="header-actions flex items-center gap-[13px] max-[1100px]:gap-[6px] max-[620px]:ml-auto">
          <button
            type="button"
            className="icon-button inline-flex items-center justify-center border-0 bg-transparent w-[32px] h-[32px] rounded-full p-0 [transition:background_.18s] [&:hover]:bg-[#8080801a] settings-button"
            onClick={() => setModal("settings")}
            aria-label="Demo settings"
          >
            <Settings2 size={19} />
          </button>
          <button
            type="button"
            className={playClasses(`wallet-button ${connected ? "connected" : ""}`)}
            onClick={() => setModal("wallet")}
          >
            <Wallet size={17} />
            <span>{connected ? "you.demo.testnet" : "Connect wallet"}</span>
            {connected ? <ChevronDown size={14} /> : <ArrowUpRight size={16} />}
          </button>
        </div>
      </header>
      <div className="workspace-intro flex items-center justify-between p-[31px_1px_24px] [&_.eyebrow]:text-[#82837e] [&_.eyebrow]:mb-[5px] [&_.eyebrow]:text-[9px] [&_h1]:font-[family-name:var(--font-display)] [&_h1]:text-[31px] [&_h1]:font-medium [&_h1]:tracking-[-1.4px] [&_h1]:leading-[1.2] [&_h1>span]:text-[#8a8b83] max-[820px]:[&_h1]:text-[27px] max-[620px]:p-[25px_1px_20px] max-[620px]:items-end max-[620px]:[&_.eyebrow]:text-[7px] max-[620px]:[&_.eyebrow]:mb-[6px] max-[620px]:[&_h1]:text-[25px] max-[620px]:[&_h1]:tracking-[-1.2px]">
        <div>
          <span className="eyebrow text-[9px] font-extrabold tracking-[.15em] block leading-[1.5]">
            YOUR PERSONAL DEFI OFFICE
          </span>
          <h1>
            {tab === "office" ? (
              <>
                Big plans. <span>Clear moves.</span>
              </>
            ) : tab === "guardian" ? (
              <>
                A watchful eye. <span>Your rules.</span>
              </>
            ) : (
              <>
                Good decisions. <span>On record.</span>
              </>
            )}
          </h1>
        </div>
        <div className="network-label flex items-center gap-[9px] text-[10px] font-bold [&_small]:flex [&_small]:items-center [&_small]:gap-[6px] [&_small]:text-[8px] [&_small]:tracking-[.08em] [&_small]:text-[#777e77] [&_small]:mt-[3px] [&_i]:block [&_i]:w-[5px] [&_i]:h-[5px] [&_i]:bg-[#799d62] [&_i]:rounded-full max-[820px]:text-[8px] max-[620px]:hidden">
          <span className="near-logo font-[family-name:var(--font-display)] text-[27px] transform-[skewY(-14deg)] leading-[1]">
            N
          </span>
          <span>
            Built on NEAR
            <small>
              TESTNET UI DEMO <i />
            </small>
          </span>
        </div>
      </div>
      {tab === "office" && (
        <>
          <div className="office-grid grid grid-cols-[1.15fr_1fr] gap-[18px] max-[1100px]:grid-cols-[1fr_1fr] max-[1100px]:gap-[14px] max-[620px]:grid-cols-[1fr] max-[620px]:gap-[14px]">
            <section
              className={playClasses(`character-card mood-${characterMood}`)}
              aria-label="Mr.Fund's office"
            >
              <div className="character-heading flex items-center justify-between relative z-[2] max-[1100px]:[&_.stage-number]:text-[6px] max-[820px]:[&_.stage-number]:hidden max-[620px]:[&_.stage-number]:block max-[620px]:[&_.stage-number]:text-[6px]">
                <Tag>
                  <span className="status-dot inline-block w-[5px] h-[5px] bg-[#729955] rounded-full shrink-0" />
                  MR.FUND IS IN
                </Tag>
                <span className="stage-number text-[8px] font-extrabold tracking-[.07em] text-[#8c3925]">
                  EST. 2026 / YOUR CORNER
                </span>
              </div>
              <h2>
                Money talks.
                <br />
                <span>Let's talk back.</span>
              </h2>
              <span
                className="stage-asterisk absolute right-[32px] top-[77px] text-[70px] leading-[1] text-[#ffc19e] transform-[rotate(-12deg)] pointer-events-none max-[1100px]:right-[20px] max-[1100px]:top-[80px] max-[1100px]:text-[57px] max-[620px]:top-[77px] max-[620px]:right-[24px] max-[620px]:text-[57px]"
                aria-hidden="true"
              >
                ✳
              </span>
              <OfficeScene mood={characterMood} wave={wave} />
              <div className="character-bottom absolute bottom-[24px] left-[25px] right-[25px] z-[2] flex items-center justify-between pointer-events-none max-[1100px]:left-[18px] max-[1100px]:right-[18px] max-[1100px]:bottom-[20px] max-[620px]:bottom-[20px] max-[620px]:left-[19px] max-[620px]:right-[19px]">
                <div className="mood-chip flex items-center gap-[9px] bg-[#fff3d9] [border:1px_solid_#ca532d] rounded-[10px] p-[10px_14px] shadow-[0_4px_0_#bc482b33] max-w-[calc(100%_-_50px)] [&_b]:text-[10px] [&_b]:block [&_small]:text-[8px] [&_small]:text-[#85816e] [&_small]:block [&_small]:mt-[3px] max-[1100px]:p-[9px_10px] max-[1100px]:gap-[7px] max-[1100px]:[&_b]:text-[8px] max-[1100px]:[&_small]:text-[7px] max-[820px]:[&_small]:hidden max-[820px]:[&_b]:text-[8px] max-[820px]:p-[8px] max-[820px]:gap-[6px] max-[620px]:p-[10px_12px] max-[620px]:[&_b]:text-[9px] max-[620px]:[&_small]:block max-[620px]:[&_small]:text-[7px]">
                  <span className="mood-face font-[family-name:var(--font-display)] [border:1px_solid_#b7b392] rounded-full w-[27px] h-[27px] flex items-center justify-center text-[#36421f] text-[18px] pb-[3px] max-[820px]:w-[23px] max-[820px]:h-[23px]">
                    {characterMood === "thinking"
                      ? "···"
                      : characterMood === "concerned"
                        ? "·_·"
                        : "◡"}
                  </span>
                  <span>
                    <b>
                      {characterMood === "thinking"
                        ? "Running the numbers"
                        : characterMood === "concerned"
                          ? "Let's take a closer look"
                          : characterMood === "pleased"
                            ? "Now that's a good move"
                            : "Calm. Collected. On your side."}
                    </b>
                    <small>
                      {characterMood === "thinking"
                        ? "A little math. A clearer answer."
                        : "Your DeFi manager, minus the jargon."}
                    </small>
                  </span>
                </div>
                <button
                  type="button"
                  className="wave-button [border:1px_solid_#a44027] bg-[#ff8158] w-[39px] h-[39px] rounded-full flex items-center justify-center pointer-events-auto [transition:transform_.2s] [&:hover]:transform-[rotate(15deg)] [&:hover]:bg-[#ffa07c]"
                  aria-label="Wave to Mr.Fund"
                  onClick={() => {
                    setWave((v) => v + 1);
                    setNotice("Hey there. Looking sharp yourself.");
                  }}
                >
                  <Hand size={20} />
                </button>
              </div>
              <span className="rotate-hint absolute bottom-[87px] right-[25px] text-[7px] font-extrabold tracking-[.1em] text-[#91452b] flex items-center gap-[6px] pointer-events-none [&>span]:text-[15px] max-[820px]:text-[6px] max-[820px]:right-[18px] max-[820px]:bottom-[84px] max-[620px]:bottom-[83px] max-[620px]:right-[20px]">
                DRAG TO LOOK AROUND <span>↔</span>
              </span>
            </section>
            <section className="chat-panel h-[520px] bg-[var(--paper)] [border:1px_solid_var(--line)] rounded-[21px] p-[0_22px] flex flex-col min-w-0 min-[1500px]:h-[570px] min-[1500px]:pl-[26px] min-[1500px]:pr-[26px] max-[1100px]:p-[0_16px] max-[820px]:h-[510px] max-[620px]:h-[535px] max-[620px]:p-[0_19px] max-[620px]:rounded-[17px]">
              <div className="chat-heading p-[20px_0_16px] flex items-center justify-between [border-bottom:1px_solid_#eae9e0] [&>div]:flex [&>div]:items-center [&>div]:gap-[10px] [&_b]:text-[12px] [&_b]:font-extrabold [&_small]:flex [&_small]:items-center [&_small]:gap-[5px] [&_small]:text-[8px] [&_small]:text-[#93958b] [&_small]:mt-[3px] [&_.status-dot]:w-[4px] [&_.status-dot]:h-[4px] min-[1500px]:pt-[24px] min-[1500px]:pb-[20px] min-[1500px]:[&_b]:text-[13px] max-[1100px]:[&_b]:text-[11px] max-[820px]:[&_small]:text-[7px] max-[820px]:[&>div]:gap-[7px] max-[820px]:[&_b]:text-[10px] max-[620px]:pt-[19px] max-[620px]:[&_b]:text-[12px] max-[620px]:[&_small]:text-[7px] max-[620px]:[&>div]:gap-[10px]">
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
                    <span className="message-label text-[7px] tracking-[.13em] font-extrabold text-[#979a8f] block mb-[7px]">
                      {message.role === "assistant" ? "MR.FUND" : "YOU"}
                    </span>
                    <p>{message.text}</p>
                    {message.kind === "scenario" && whatIf.ok && (
                      <div className="scenario-result [border:1px_solid_#e1d5f5] bg-[#f3edfc] p-[13px] mt-[12px] rounded-[9px] [&_.tag]:text-[#7d59a5] [&_.tag]:border-0 [&_.tag]:p-0 [&>div]:flex [&>div]:gap-[17px] [&>div]:items-center [&>div]:mt-[12px] [&>div>span]:text-[9px] [&>div>span]:flex [&>div>span]:flex-col [&>div>span]:gap-[3px] [&>div>span]:text-[#8b779d] [&_b]:font-[family-name:var(--font-display)] [&_b]:text-[22px] [&_b]:text-[#594370] [&>small]:text-[8px] [&>small]:text-[#8d7f99] [&>small]:block [&>small]:mt-[10px]">
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
                    <div className="chat-invitation p-[4px_0_19px] [&_h3]:font-[family-name:var(--font-display)] [&_h3]:text-[27px] [&_h3]:font-medium [&_h3]:leading-[1.15] [&_h3]:tracking-[-1px] [&_p]:text-[#92948a] [&_p]:text-[10px] [&_p]:mt-[9px] min-[1500px]:p-[18px_0_28px] min-[1500px]:[&_h3]:text-[34px] max-[1100px]:[&_h3]:text-[24px] max-[820px]:[&_h3]:text-[23px] max-[820px]:pb-[14px] max-[620px]:p-[8px_0_23px] max-[620px]:[&_h3]:text-[29px] max-[620px]:[&_p]:text-[10px]">
                      <h3>
                        A good question
                        <br />
                        is a good investment.
                      </h3>
                      <p>Pick a thought. We'll take it from there.</p>
                    </div>
                    <div className="prompt-grid grid grid-cols-[1fr_1fr] gap-[8px] [&_button]:bg-[#f6f6ef] [&_button]:[border:1px_solid_#e6e6db] [&_button]:p-[12px_10px] [&_button]:rounded-[9px] [&_button]:flex [&_button]:gap-[7px] [&_button]:items-center [&_button]:text-left [&_button]:text-[9px] [&_button]:font-semibold [&_button]:[transition:background_.16s,transform_.16s] [&_button]:min-w-0 [&_button>svg:first-child]:text-[#686d5f] [&_button>svg:last-child]:ml-auto [&_button>svg:last-child]:text-[#808674] [&_button:hover]:bg-[#e9eddf] [&_button:hover]:transform-[translateY(-2px)] min-[1500px]:[&_button]:p-[16px_12px] min-[1500px]:[&_button]:text-[10px] max-[1100px]:gap-[6px] max-[1100px]:[&_button]:text-[8px] max-[1100px]:[&_button]:gap-[5px] max-[1100px]:[&_button]:p-[11px_8px] max-[1100px]:[&_button>svg]:w-[13px] max-[1100px]:[&_button>svg:last-child]:w-[10px] max-[820px]:grid-cols-[1fr] max-[820px]:[&_button]:p-[9px_10px] max-[820px]:[&_button]:text-[9px] max-[620px]:grid-cols-[1fr_1fr] max-[620px]:gap-[7px] max-[620px]:[&_button]:text-[8px] max-[620px]:[&_button]:p-[13px_9px] max-[620px]:[&_button]:gap-[5px]">
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
                  <div className="thinking-message flex gap-[4px] items-center p-[8px_0_18px] [&>span]:w-[5px] [&>span]:h-[5px] [&>span]:bg-[var(--blue)] [&>span]:rounded-full [&>span]:animate-pulse [&_small]:text-[9px] [&_small]:ml-[6px] [&_small]:text-[#8e9386]">
                    <span />
                    <span />
                    <span />
                    <small>Checking the numbers…</small>
                  </div>
                )}
                {cardOpen && (
                  <div className="recommendation-card bg-[#eff2ff] [border:1px_solid_#cfd8ff] rounded-[12px] p-[15px] m-[12px_0] [&_h3]:font-[family-name:var(--font-display)] [&_h3]:text-[24px] [&_h3]:tracking-[-.9px] [&_h3]:m-[5px_0] [&>p]:text-[10px] [&>p]:text-[#737b91] [&>p]:mb-[15px] [&_details]:[border-top:1px_solid_#d6dcf4] [&_details]:pt-[10px] [&_details]:text-[8px] [&_details]:text-[#6d7895] [&_summary]:flex [&_summary]:items-center [&_summary]:justify-between [&_summary]:cursor-pointer [&_summary]:font-semibold [&_details_p]:mt-[10px] [&_details_p]:leading-[1.7]">
                    <div className="recommendation-heading flex items-center justify-between [&_.tag]:border-0 [&_.tag]:text-[var(--blue)] [&_.tag]:bg-[#e1e7ff] [&_.tag]:pl-[0]">
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
                        <div className="comparison-bars flex flex-col gap-[12px] m-[18px_0] [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:flex-wrap [&>div]:gap-[5px] [&>div]:text-[8px] [&>div]:text-[#727b94] [&_b]:text-[9px] [&_b]:text-[var(--ink)] [&_i]:block [&_i]:basis-[100%] [&_i]:h-[7px] [&_i]:rounded-[3px] [&_.repay-bar]:bg-[var(--blue)] [&_.yield-bar]:bg-[#b1bde9] [&_.yield-bar]:max-w-[66.7%]">
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
                        <div className="card-number-list tabular-nums [border-top:1px_solid_#d6dcf4] p-[6px_0] [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:p-[7px_0] [&>div]:gap-[10px] [&>div]:text-[8px] [&_span]:text-[#737d97] [&_b]:flex [&_b]:items-center [&_b]:gap-[6px] [&_b]:font-bold [&_b]:text-[9px] [&_small]:text-[7px] [&_small]:text-[#757e92]">
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
                          <label className="adjust-field flex flex-col text-[9px] gap-[7px] m-[12px_0] [&_input]:bg-white [&_input]:[border:1px_solid_#cbd5fc] [&_input]:rounded-[6px] [&_input]:p-[10px] [&_input]:w-full [&_input]:text-[12px]">
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
                            className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#bcc6a8] bg-transparent [&:hover]:bg-[#ffffff40] small"
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
                          <label className="adjust-field flex flex-col text-[9px] gap-[7px] m-[12px_0] [&_input]:bg-white [&_input]:[border:1px_solid_#cbd5fc] [&_input]:rounded-[6px] [&_input]:p-[10px] [&_input]:w-full [&_input]:text-[12px]">
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
                          className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#bcc6a8] bg-transparent [&:hover]:bg-[#ffffff40] small"
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
                    className="inline-receipt flex items-center text-left w-full [border:1px_solid_#cddfb5] bg-[#f0f7e7] p-[14px_12px] gap-[10px] rounded-[9px] m-[10px_0] [&_b]:text-[11px] [&_b]:block [&_small]:text-[8px] [&_small]:text-[#7b8971] [&_small]:block [&_small]:mt-[4px] [&>svg]:ml-auto"
                    onClick={() => setSelectedReceipt(lastRepay)}
                  >
                    <span className="receipt-check w-[32px] h-[32px] grid place-items-center bg-[var(--lime)] rounded-full text-[#426128]">
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
                  <div className="follow-up-prompts flex gap-[7px] flex-wrap mt-[14px] [&_button]:bg-transparent [&_button]:[border:1px_solid_#dedfd3] [&_button]:rounded-[6px] [&_button]:p-[7px_8px] [&_button]:text-[8px] [&_button]:flex [&_button]:gap-[5px] [&_button]:items-center">
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
                className="chat-composer flex items-center [border:1px_solid_#dedfd2] rounded-[10px] bg-[#f8f8f0] p-[6px] gap-[5px] mt-[5px] [&_input]:w-full [&_input]:min-w-0 [&_input]:p-[9px_7px] [&_input]:bg-transparent [&_input]:border-0 [&_input]:text-[10px] [&_input]:text-[var(--ink)] [&_input::placeholder]:text-[#999d91] [&_button]:w-[36px] [&_button]:h-[34px] [&_button]:rounded-[7px] [&_button]:border-0 [&_button]:flex [&_button]:items-center [&_button]:justify-center [&_button]:bg-[var(--blue)] [&_button]:text-white [&_button]:shrink-0 [&_button:disabled]:opacity-[1] [&_button:disabled]:bg-[#e6e8da] [&_button:disabled]:text-[#9ca28e] max-[820px]:[&_input]:text-[8px] max-[620px]:[&_input]:text-[10px] max-[620px]:[&_input]:p-[11px_7px]"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  _ask(input);
                }}
              >
                <input
                  aria-label="Message Mr.Fund"
                  placeholder="Ask away. Money questions welcome."
                  value={input}
                  maxLength={500}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={thinking}
                />
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
              <div className="chat-disclaimer flex items-center justify-center gap-[4px] text-[7px] text-[#9a9d90] p-[9px_0_12px] max-[820px]:text-[6px] max-[620px]:text-[7px] max-[620px]:pb-[12px]">
                <LockKeyhole size={10} />
                You approve every move. Demo chat isn't an LLM connection.
              </div>
            </section>
          </div>
          <div className="lower-grid grid grid-cols-[1.15fr_1fr] gap-[18px] mt-[18px] max-[1100px]:grid-cols-[1fr_1fr] max-[1100px]:gap-[14px] max-[820px]:grid-cols-[1fr] max-[620px]:mt-[14px] max-[620px]:gap-[14px]">
            <section className="position-card rounded-[20px] bg-[var(--ink)] text-[var(--paper)] p-[22px_25px_15px] min-w-0 max-[1100px]:p-[20px] max-[820px]:p-[22px_25px] max-[620px]:p-[20px] max-[620px]:rounded-[17px]">
              <div className="position-heading flex justify-between items-center [&_.eyebrow]:text-[8px] [&_.eyebrow]:text-[#a2a7b0] [&>div]:flex [&>div]:items-center [&>div]:gap-[7px] [&_.tag]:text-[7px] [&_.tag]:border-0 [&_.tag]:bg-[#303b35] [&_.tag]:text-[#bfda9f] [&_.tag]:p-[5px_7px] [&_.status-dot]:w-[4px] [&_.status-dot]:h-[4px] [&_.status-dot]:bg-[#badc8e] [&_.icon-button]:text-[#b0b7ba] [&_.icon-button]:w-[24px] [&_.icon-button]:h-[24px] max-[620px]:[&_.eyebrow]:text-[7px] max-[620px]:[&_.tag]:text-[6px]">
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
                  <div className="health-section tabular-nums mt-[24px] [&>div:first-child]:flex [&>div:first-child]:items-center [&>div:first-child]:gap-[10px] [&>div:first-child]:flex-wrap [&>div:first-child>span]:text-[9px] [&>div:first-child>span]:text-[#aeb2b7] [&>div:first-child>span]:flex [&>div:first-child>span]:items-center [&>div:first-child>span]:gap-[5px] [&_strong]:font-[family-name:var(--font-display)] [&_strong]:text-[19px] [&_strong]:font-medium [&_strong]:text-[var(--lime)] [&_strong]:tracking-[-.5px] [&_strong.health-warning]:text-[#ffae6b] [&_small]:ml-auto [&_small]:text-[7px] [&_small]:text-[#a0a4ac] max-[1100px]:[&_small]:text-[6px] max-[820px]:[&>div:first-child>span]:text-[10px] max-[820px]:[&_small]:text-[9px] max-[620px]:mt-[24px] max-[620px]:[&>div:first-child]:gap-[7px] max-[620px]:[&>div:first-child>span]:text-[8px] max-[620px]:[&_strong]:text-[18px] max-[620px]:[&_small]:text-[6px]">
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
                    <div className="health-labels flex justify-between mt-[9px] text-[6px] tracking-[.07em] text-[#9ca3b0] max-[620px]:text-[5px]">
                      <span>100% · LIQUIDATION</span>
                      <span>{comfort}% · COMFORT LINE</span>
                    </div>
                  </div>
                  <div className="position-footer [border-top:1px_solid_#3a4250] flex items-center justify-between gap-[12px] mt-[19px] pt-[13px] [&>span]:text-[7px] [&>span]:text-[#a9afb8] [&>span]:flex [&>span]:flex-col [&>span]:gap-[5px] [&_b]:text-[12px] [&_b]:font-semibold [&_b]:text-[#e6e9e1] max-[820px]:[&>span]:text-[9px] max-[820px]:[&_b]:text-[14px] max-[620px]:gap-[10px] max-[620px]:[&>span]:text-[6px] max-[620px]:[&>span]:gap-[6px] max-[620px]:[&_b]:text-[12px]">
                    <span>
                      Est. NEAR liquidation price{" "}
                      <b>
                        {current.liquidation ? `$${Number(current.liquidation).toFixed(2)}` : "—"}
                      </b>
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
              <span className="position-footnote text-[6px] block mt-[14px] text-[#898e9a] tracking-[.03em] max-[820px]:text-[7px] max-[620px]:text-[6px]">
                Illustrative Rhea fixture · engine-computed · wallet-held loan
              </span>
            </section>
            {guardianContent()}
          </div>
          <section className="insight-strip flex items-center gap-[15px] bg-[#e9e8e0] [border:1px_solid_#e1e0d7] rounded-[13px] mt-[18px] p-[16px_20px] [&_p]:flex [&_p]:flex-col [&_p]:gap-[4px] [&_p_b]:text-[11px] [&_p_b]:font-bold [&_p_span]:text-[9px] [&_p_span]:text-[#85877c] [&_.text-button]:ml-auto [&_.text-button]:whitespace-nowrap max-[820px]:[&_p_span]:max-w-[310px] max-[820px]:[&_p_span]:text-[8px] max-[820px]:[&_p_span]:leading-[1.6] max-[820px]:[&_p_b]:text-[10px] max-[820px]:[&_.text-button]:text-[9px]! max-[620px]:p-[15px] max-[620px]:gap-[10px] max-[620px]:flex-wrap max-[620px]:items-start max-[620px]:rounded-[11px] max-[620px]:[&_p]:flex-1 max-[620px]:[&_p_b]:text-[10px] max-[620px]:[&_p_span]:text-[8px] max-[620px]:[&_p_span]:leading-[1.7] max-[620px]:[&_p_span]:max-w-[none] max-[620px]:[&_.text-button]:ml-[38px] max-[620px]:[&_.text-button]:text-[10px]!">
            <div className="insight-icon h-[35px] w-[35px] rounded-full [border:1px_solid_#b5b5a6] grid place-items-center shrink-0 max-[620px]:w-[28px] max-[620px]:h-[28px] max-[620px]:[&_svg]:w-[16px]">
              <Sparkles size={22} />
            </div>
            <p>
              <b>A small move can make a big difference.</b>
              <span>
                Ask Mr.Fund whether your spare cash works harder earning yield or paying down debt.
              </span>
            </p>
            <button
              type="button"
              className="text-button bg-transparent border-0 text-[10px]! font-extrabold! inline-flex items-center gap-[9px]"
              onClick={() => _ask("Should I repay or earn yield?")}
            >
              Let's find out <ArrowUpRight size={17} />
            </button>
          </section>
        </>
      )}
      {tab === "guardian" && (
        <div className="guardian-page grid grid-cols-[1.15fr_1fr] gap-[20px] max-[1100px]:grid-cols-[1.15fr_1fr] max-[820px]:grid-cols-[1fr]">
          {guardianContent(true)}
          <aside className="guardian-explainer [border:1px_solid_var(--line)] rounded-[20px] bg-[var(--paper)] p-[30px] [&>.eyebrow]:text-[#959b89] [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[34px] [&_h2]:font-medium [&_h2]:tracking-[-1.4px] [&_h2]:leading-[1.1] [&_h2]:m-[15px_0_28px] [&>div]:flex [&>div]:gap-[15px] [&>div]:m-[25px_0] [&>div>span]:w-[26px] [&>div>span]:h-[26px] [&>div>span]:bg-[#eeefe5] [&>div>span]:grid [&>div>span]:place-items-center [&>div>span]:rounded-full [&>div>span]:text-[8px] [&>div>span]:text-[#8c947c] [&>div>span]:shrink-0 [&_p]:text-[11px] [&_p]:text-[#949c87] [&_p]:leading-[1.8] [&_p_b]:block [&_p_b]:text-[var(--ink)] [&_p_b]:mb-[5px] [&>.button]:mt-[15px] [&>.button]:w-full max-[1100px]:p-[25px] max-[1100px]:[&_h2]:text-[29px] max-[820px]:p-[28px] max-[820px]:[&_h2]:text-[34px] max-[820px]:[&_p]:text-[12px] max-[620px]:p-[24px_20px] max-[620px]:[&_h2]:text-[30px] max-[620px]:[&_p]:text-[11px]">
            <span className="eyebrow text-[9px] font-extrabold tracking-[.15em] block leading-[1.5]">
              PERMISSION, EXPLAINED
            </span>
            <h2>
              A watchful eye.
              <br />
              Never a blank check.
            </h2>
            <div>
              <span>01</span>
              <p>
                <b>You set the boundaries.</b>Choose a maximum repay, a lifetime cap, a reserve
                floor, and a health trigger.
              </p>
            </div>
            <div>
              <span>02</span>
              <p>
                <b>The watcher makes a request.</b>In the live design, deterministic code monitors a
                separate Guardian-held position.
              </p>
            </div>
            <div>
              <span>03</span>
              <p>
                <b>The contract has the final say.</b>The demo simulates enforcement locally. It
                does not claim deployed protection.
              </p>
            </div>
            <button
              type="button"
              className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#bcc6a8] bg-transparent [&:hover]:bg-[#ffffff40]"
              onClick={() => {
                setTab("office");
                _ask("What are my Guardian limits?");
              }}
            >
              <MessageCircle size={17} />
              Ask Mr.Fund about it
            </button>
          </aside>
          <div className="guardian-history col-[1/-1]">{activityContent()}</div>
        </div>
      )}
      {tab === "activity" && activityContent()}
      <footer className="play-footer flex items-center justify-between p-[25px_2px_7px] text-[#8b8e82] gap-[20px] [&>span]:flex [&>span]:items-center [&>span]:font-[family-name:var(--font-display)] [&>span]:text-[15px] [&>span]:tracking-[-.6px] [&>span]:text-[#4a5148] [&>span]:font-semibold [&_i]:not-italic [&_i]:text-[var(--orange)] [&_i]:ml-[3px] [&>span>span]:[font:8px_var(--font-body)] [&>span>span]:text-[#999c91] [&>span>span]:[border-left:1px_solid_#d1d2c6] [&>span>span]:ml-[14px] [&>span>span]:pl-[14px] [&>span>span]:tracking-[0] [&>div]:flex [&>div]:gap-[20px] [&>div]:items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-[8px] [&_button]:flex [&_button]:items-center [&_button]:gap-[4px] [&_button]:text-[#94988b] [&_a]:border-0 [&_a]:bg-transparent [&_a]:text-[8px] [&_a]:flex [&_a]:items-center [&_a]:gap-[4px] [&_a]:text-[#94988b] max-[820px]:[&>span>span]:hidden max-[620px]:items-start max-[620px]:pt-[23px] max-[620px]:gap-[10px] max-[620px]:[&>span]:text-[14px] max-[620px]:[&>div]:gap-[9px] max-[620px]:[&>div]:flex-col max-[620px]:[&>div]:items-end max-[620px]:[&_button]:text-[7px] max-[620px]:[&_a]:text-[7px]">
        <span>
          mr.fund <i>↗</i>
          <span>Good company for your money.</span>
        </span>
        <div>
          <button type="button" onClick={() => setModal("help")}>
            How it works <ArrowUpRight size={12} />
          </button>
          <a href="https://poly.pizza/m/JFrLIKqvCH" target="_blank" rel="noreferrer">
            3D character by Quaternius <ExternalLink size={10} />
          </a>
        </div>
      </footer>
      {latest && tab === "office" && (
        <button
          type="button"
          className="recent-activity flex items-center justify-center gap-[7px] text-[9px] bg-transparent text-[#899078]! border-0 m-[10px_auto_0]"
          onClick={() => setSelectedReceipt(latest)}
        >
          <span className="status-dot inline-block w-[5px] h-[5px] bg-[#729955] rounded-full shrink-0" />
          Latest demo event: {latest.title}
          <ArrowUpRight size={13} />
        </button>
      )}
      {notice && (
        <div
          className="play-toast fixed bottom-[25px] left-[50%] transform-[translateX(-50%)] z-[100] flex gap-[11px] items-center bg-[var(--ink)] text-white [border:1px_solid_#434b58] rounded-[12px] p-[14px_16px] text-[11px] shadow-[0_8px_40px_#1c23313b] max-w-[calc(100vw_-_30px)] w-[max-content] [&>span]:h-[25px] [&>span]:w-[25px] [&>span]:rounded-full [&>span]:bg-[var(--lime)] [&>span]:text-[var(--ink)] [&>span]:grid [&>span]:place-items-center [&>span]:shrink-0 [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-[#b6bcc5] [&_button]:ml-[10px] [&_button]:flex [&_button]:p-[3px] max-[620px]:bottom-[15px] max-[620px]:text-[10px] max-[620px]:p-[11px] max-[620px]:gap-[8px] max-[620px]:w-[calc(100vw_-_28px)] max-[620px]:leading-[1.6] max-[620px]:[&>span]:w-[22px] max-[620px]:[&>span]:h-[22px]"
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
          title={connected ? "Your mock wallet." : "Come on in."}
          close={() => setModal(null)}
        >
          <p className="modal-copy text-[12px] leading-[1.8] text-[#7a8174] m-[20px_0]! max-[620px]:text-[11px]">
            {connected
              ? "Connected to a local demo identity. These tokens are simulated balances."
              : "Try the whole experience with a mock wallet. No extension, real account, or signature needed."}
          </p>
          {connected ? (
            <>
              <div className="wallet-account flex items-center gap-[10px] p-[16px_0_24px] [&_b]:text-[12px] [&_small]:text-[10px] [&_small]:text-[#8d9581] [&_small]:block [&_small]:mt-[5px] [&_.icon-button]:ml-auto">
                <span className="wallet-avatar h-[40px] w-[40px] bg-[var(--lime)] grid place-items-center rounded-full font-[family-name:var(--font-display)] text-[21px]">
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
                className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#bcc6a8] bg-transparent [&:hover]:bg-[#ffffff40] full-width w-full"
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
                className="wallet-option flex gap-[13px] items-center w-full bg-[#f0f2e9] [border:1px_solid_#d7dccb] p-[17px_14px] rounded-[12px] text-left mt-[24px] [&>span]:w-[43px] [&>span]:h-[43px] [&>span]:bg-[var(--blue)] [&>span]:rounded-[11px] [&>span]:text-[#fff] [&>span]:grid [&>span]:place-items-center [&_b]:text-[13px] [&_small]:text-[9px] [&_small]:text-[#8a9480] [&_small]:block [&_small]:mt-[5px] [&>svg]:ml-auto [&:hover]:bg-[#e9eddf] [&:hover]:[border-color:#b7c79f]"
                onClick={() => {
                  setConnected(true);
                  setModal(null);
                  setWave((v) => v + 1);
                  setNotice("Mock wallet connected. Welcome to the office.");
                }}
              >
                <span>
                  <Wallet size={24} />
                </span>
                <div>
                  <b>Demo wallet</b>
                  <small>1,000 test USDC · instant connection</small>
                </div>
                <ArrowUpRight size={20} />
              </button>
              <div className="disabled-wallets p-[25px_0_20px] text-center [&>span]:text-[9px] [&>span]:text-[#a3a896] [&>div]:flex [&>div]:justify-center [&>div]:gap-[27px] [&>div]:mt-[16px] [&>div]:text-[#a6ab9c] [&>div]:font-[family-name:var(--font-display)] [&>div]:text-[11px]">
                <span>Real wallets arrive with the live integration</span>
                <div>
                  <b>METEOR</b>
                  <b>INTEAR</b>
                  <b>NEAR</b>
                </div>
              </div>
            </>
          )}
          <p className="fine-print text-[9px] leading-[1.8] text-[#929987] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
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
          <label className="form-field flex flex-col gap-[8px] mt-[21px] min-w-0 [&>span]:text-[10px] [&>span]:font-bold [&>span]:flex [&>span]:justify-between [&>span_small]:text-[8px] [&>span_small]:font-normal [&>span_small]:text-[#9ba18f] [&_input]:p-[12px] [&_input]:bg-[#f6f7f0] [&_input]:[border:1px_solid_#dce0d2] [&_input]:rounded-[7px] [&_input]:text-[12px] [&_input]:text-[var(--ink)] [&_input]:w-full [&_input]:min-w-0 [&_select]:p-[12px] [&_select]:bg-[#f6f7f0] [&_select]:[border:1px_solid_#dce0d2] [&_select]:rounded-[7px] [&_select]:text-[12px] [&_select]:text-[var(--ink)] [&_select]:w-full [&_select]:min-w-0 [&>small]:text-[8px] [&>small]:leading-[1.5] [&>small]:text-[#8e9783] max-[620px]:[&>span]:text-[9px] max-[620px]:[&_input]:text-[11px] max-[620px]:[&_input]:p-[11px_9px] max-[620px]:[&_select]:text-[11px] max-[620px]:[&_select]:p-[11px_9px] max-[620px]:[&>small]:text-[7px]">
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
          <label className="form-field flex flex-col gap-[8px] mt-[21px] min-w-0 [&>span]:text-[10px] [&>span]:font-bold [&>span]:flex [&>span]:justify-between [&>span_small]:text-[8px] [&>span_small]:font-normal [&>span_small]:text-[#9ba18f] [&_input]:p-[12px] [&_input]:bg-[#f6f7f0] [&_input]:[border:1px_solid_#dce0d2] [&_input]:rounded-[7px] [&_input]:text-[12px] [&_input]:text-[var(--ink)] [&_input]:w-full [&_input]:min-w-0 [&_select]:p-[12px] [&_select]:bg-[#f6f7f0] [&_select]:[border:1px_solid_#dce0d2] [&_select]:rounded-[7px] [&_select]:text-[12px] [&_select]:text-[var(--ink)] [&_select]:w-full [&_select]:min-w-0 [&>small]:text-[8px] [&>small]:leading-[1.5] [&>small]:text-[#8e9783] max-[620px]:[&>span]:text-[9px] max-[620px]:[&_input]:text-[11px] max-[620px]:[&_input]:p-[11px_9px] max-[620px]:[&_select]:text-[11px] max-[620px]:[&_select]:p-[11px_9px] max-[620px]:[&>small]:text-[7px]">
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
          <label className="switch-row flex items-center justify-between m-[25px_0] [&_b]:text-[11px] [&_small]:block [&_small]:text-[9px] [&_small]:text-[#9ba38f] [&_small]:mt-[5px] [&_input]:w-[19px] [&_input]:h-[19px] [&_input]:[accent-color:var(--blue)]">
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
            className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#bcc6a8] bg-transparent [&:hover]:bg-[#ffffff40] full-width w-full"
            onClick={reset}
          >
            <RefreshCw size={16} />
            Reset all demo activity
          </button>
          <p className="fine-print text-[9px] leading-[1.8] text-[#929987] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
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
          <div className="help-block flex gap-[14px] mt-[26px] [&_b]:text-[12px] [&_p]:text-[10px] [&_p]:text-[#8a927e] [&_p]:leading-[1.8] [&_p]:mt-[7px]">
            <span className="help-number w-[28px] h-[28px] bg-[var(--lime)] rounded-[7px] grid place-items-center text-[10px] shrink-0">
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
          <div className="help-block flex gap-[14px] mt-[26px] [&_b]:text-[12px] [&_p]:text-[10px] [&_p]:text-[#8a927e] [&_p]:leading-[1.8] [&_p]:mt-[7px]">
            <span className="help-number w-[28px] h-[28px] bg-[var(--lime)] rounded-[7px] grid place-items-center text-[10px] shrink-0">
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
          <div className="help-block flex gap-[14px] mt-[26px] [&_b]:text-[12px] [&_p]:text-[10px] [&_p]:text-[#8a927e] [&_p]:leading-[1.8] [&_p]:mt-[7px]">
            <span className="help-number w-[28px] h-[28px] bg-[var(--lime)] rounded-[7px] grid place-items-center text-[10px] shrink-0">
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
          <p className="risk-note flex gap-[9px] bg-[#f1f1e7] p-[15px] rounded-[9px] text-[9px] leading-[1.8] text-[#818a74] mt-[24px]!">
            <Shield size={18} />
            The live product aims to reduce liquidation risk within your limits. It cannot prevent
            liquidation. Guardian and Rhea have smart-contract risks; hackathon code is unaudited.
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
          <div className="setup-steps flex items-center gap-[10px] mt-[24px] [&>span]:text-[9px] [&>span]:text-[#a1aa94] [&>span]:font-semibold [&>span.current]:text-[var(--blue)] [&>i]:flex-1 [&>i]:h-[1px] [&>i]:bg-[#e1e5d7] max-[620px]:[&>span]:text-[8px]">
            <span className={playClasses(!setupReview ? "current" : "")}>01 Configure</span>
            <i />
            <span className={playClasses(setupReview ? "current" : "")}>02 Review</span>
            <i />
            <span>03 Mock approval</span>
          </div>
          <div className="setup-position flex items-center gap-[11px] bg-[#f1f4e9] p-[15px] [border:1px_solid_#dfe5d4] rounded-[9px] mt-[23px] [&>span]:flex-1 [&>span]:min-w-0 [&_b]:block [&_b]:text-[11px] [&_small]:block [&_small]:text-[8px] [&_small]:leading-[1.6] [&_small]:mt-[5px] [&_small]:text-[#909b82] [&_.tag]:text-[7px] [&_.tag]:text-[#839369] [&_.tag]:[border-color:#d6dfc7] max-[620px]:p-[12px] max-[620px]:gap-[8px] max-[620px]:[&_b]:text-[9px] max-[620px]:[&_small]:text-[7px] max-[620px]:[&_.tag]:hidden">
            <Shield size={20} />
            <span>
              <b>Guardian-held loan · NEAR / USDC</b>
              <small>Separate simulated position. Your wallet loan stays where it is.</small>
            </span>
            <Tag>G1 DEMO</Tag>
          </div>
          {!setupReview ? (
            <>
              <div className="fixed-action mt-[23px] [&_small]:text-[8px] [&_small]:tracking-[.08em] [&_small]:text-[#8b967d] [&_b]:flex [&_b]:items-center [&_b]:justify-between [&_b]:text-[11px] [&_b]:mt-[9px] [&_b]:pb-[15px] [&_b]:[border-bottom:1px_solid_var(--line)]">
                <small>ALLOWED ACTION</small>
                <b>
                  Repay USDC debt from my reserve <LockKeyhole size={14} />
                </b>
              </div>
              <div className="setup-form-grid grid grid-cols-[1fr_1fr] gap-x-[20px] max-[620px]:gap-x-[12px]">
                {field("max", "Maximum per action", "USDC", "Largest single repayment.")}
                {field("cap", "Lifetime spending cap", "USDC", "At least your per-action maximum.")}
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
                  className="field-error flex items-start gap-[6px] text-[#af5034] text-[10px] leading-[1.7] mt-[18px]!"
                  role="alert"
                >
                  <AlertTriangle size={15} />
                  {policyValidation()}
                </p>
              )}
            </>
          ) : (
            <div className="policy-summary pt-[20px] [&_p]:text-[13px] [&_p]:leading-[1.9] [&_p]:text-[#7b866e] [&_p]:mt-[13px] [&_b]:text-[var(--ink)] [&_b]:font-bold max-[620px]:[&_p]:text-[12px]">
              <p>
                When the simulated Guardian loan's health falls below <b>{policyFields.trigger}%</b>
                , it may repay up to <b>{policyFields.max} USDC</b> per action, with at least{" "}
                <b>{policyFields.cooldown} minutes</b> between actions.
              </p>
              <p>
                It will keep at least <b>{policyFields.floor} USDC</b> in reserve and spend no more
                than <b>{policyFields.cap} USDC</b> over this activation.{" "}
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
          <div className="fee-box bg-[#eff1e7] rounded-[9px] p-[15px] mt-[23px] flex flex-col gap-[11px] [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:text-[10px] [&>div]:gap-[8px] [&>div>span]:flex [&>div>span]:items-center [&>div>span]:gap-[8px] [&_.tag]:text-[6px] [&_.tag]:text-[#8c977b] [&_.tag]:p-[3px_4px] [&_b]:text-[10px] [&_b]:whitespace-nowrap [&>small]:text-[8px] [&>small]:text-[#8d987f] [&>small]:leading-[1.7] max-[620px]:p-[12px] max-[620px]:[&_.tag]:text-[5px] max-[620px]:[&_.tag]:tracking-[0] max-[620px]:[&>div]:text-[8px] max-[620px]:[&_b]:text-[8px] max-[620px]:[&>small]:text-[7px]">
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
          <p className="fine-print text-[9px] leading-[1.8] text-[#929987] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
            This flow simulates a separate Guardian account and loan. No account is created and no
            tokens move on-chain. Protection cannot prevent liquidation.
          </p>
          <div className="modal-actions flex gap-[10px] justify-end mt-[25px] [&_.button]:flex-1 [&_.button]:text-[10px]! max-[620px]:gap-[8px] max-[620px]:[&_.button]:text-[9px]! max-[620px]:[&_.button]:p-[12px_9px] max-[620px]:[&_.button]:gap-[6px]">
            <button
              type="button"
              className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#bcc6a8] bg-transparent [&:hover]:bg-[#ffffff40]"
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
          <p className="modal-copy text-[12px] leading-[1.8] text-[#7a8174] m-[20px_0]! max-[620px]:text-[11px]">
            {pending.description}
          </p>
          <div className="approval-amount flex flex-col gap-[11px] items-center bg-[#f0f3e7] p-[27px_15px] rounded-[11px] text-center [&_small]:text-[8px] [&_small]:tracking-[.1em] [&_small]:text-[#8e9c7a] [&_b]:font-[family-name:var(--font-display)] [&_b]:text-[25px] [&_b]:tracking-[-.7px] [&_span]:text-[9px] [&_span]:text-[#8d977f] max-[620px]:[&_b]:text-[23px]">
            <small>YOU AUTHORIZE IN THIS DEMO</small>
            <b>{pending.amount}</b>
            <span>Account: you.demo.testnet</span>
          </div>
          <label className="form-field flex flex-col gap-[8px] mt-[21px] min-w-0 [&>span]:text-[10px] [&>span]:font-bold [&>span]:flex [&>span]:justify-between [&>span_small]:text-[8px] [&>span_small]:font-normal [&>span_small]:text-[#9ba18f] [&_input]:p-[12px] [&_input]:bg-[#f6f7f0] [&_input]:[border:1px_solid_#dce0d2] [&_input]:rounded-[7px] [&_input]:text-[12px] [&_input]:text-[var(--ink)] [&_input]:w-full [&_input]:min-w-0 [&_select]:p-[12px] [&_select]:bg-[#f6f7f0] [&_select]:[border:1px_solid_#dce0d2] [&_select]:rounded-[7px] [&_select]:text-[12px] [&_select]:text-[var(--ink)] [&_select]:w-full [&_select]:min-w-0 [&>small]:text-[8px] [&>small]:leading-[1.5] [&>small]:text-[#8e9783] max-[620px]:[&>span]:text-[9px] max-[620px]:[&_input]:text-[11px] max-[620px]:[&_input]:p-[11px_9px] max-[620px]:[&_select]:text-[11px] max-[620px]:[&_select]:p-[11px_9px] max-[620px]:[&>small]:text-[7px]">
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
              className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#bcc6a8] bg-transparent [&:hover]:bg-[#ffffff40]"
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
          <p className="modal-copy text-[12px] leading-[1.8] text-[#7a8174] m-[20px_0]! max-[620px]:text-[11px]">
            {selectedReceipt.detail}
          </p>
          {selectedReceipt.before && (
            <div className="receipt-health flex items-center justify-between [border:1px_solid_#dde4d0] rounded-[8px] p-[14px_12px] gap-[10px] [&>span]:text-[10px] [&>span]:text-[#8b977b] [&_b]:flex [&_b]:gap-[8px] [&_b]:items-center [&_b]:font-[family-name:var(--font-display)] [&_b]:text-[15px] max-[620px]:p-[12px_9px] max-[620px]:[&>span]:text-[8px] max-[620px]:[&_b]:text-[13px]">
              <span>Position health</span>
              <b>
                {selectedReceipt.before}
                <ArrowRight size={18} />
                {selectedReceipt.after}
              </b>
            </div>
          )}
          <div className="receipt-metadata mt-[16px] [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:p-[12px_0] [&>div]:[border-bottom:1px_solid_#eaede2] [&>div]:text-[10px] [&_span]:text-[#909b81] [&_b]:text-[9px] [&~.button]:mt-[22px]">
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
          <p className="fine-print text-[9px] leading-[1.8] text-[#929987] mt-[18px]! block [&>svg]:[vertical-align:middle] [&>svg]:mr-[5px]">
            No explorer link: this is a local UI simulation. The result is computed from the updated
            demo fixture, not observed on-chain.
          </p>
          <button
            type="button"
            className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_4px_8px_#1d243214] [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] blue-button bg-[var(--blue)] text-white! [&:hover]:bg-[#183ac7] full-width w-full"
            onClick={() => {
              setSelectedReceipt(null);
              setTab("activity");
            }}
          >
            View all activity <ArrowRight size={16} />
          </button>
        </ModalFrame>
      )}
    </main>
  );
}
