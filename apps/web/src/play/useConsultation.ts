"use client";
import { mood as computeMood } from "@mrfund/engine";
import { type GuardianPolicy, validatePolicy } from "@mrfund/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DetailTab } from "./ConsultationTabs";
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
export type Panel = "chat" | "voice" | "position" | "guardian" | "activity";
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
export type PolicyFields = {
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
const greeting: Message = {
  id: 0,
  role: "assistant",
  text: "Hey, I'm Mr.Fund. Your money has a lot going on. Let's make sense of it together.",
};

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
export function useConsultation() {
  const [stage, setStage] = useState<"welcome" | "consult">("welcome");
  const [panel, setPanel] = useState<Panel | null>("chat");
  const wide = useMedia("(min-width: 1280px)");
  const phone = useMedia("(max-width: 767px)") && !wide;
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
  return {
    stage,
    panel,
    speaking,
    streamingId,
    detailTab,
    setDetailTab,
    voiceOpen,
    setVoiceOpen,
    chatRevealed,
    detailsRevealed,
    setComposerFocused,
    keyboardHeight,
    setKeyboardHeight,
    sound,
    setSound,
    connected,
    setConnected,
    connecting,
    modal,
    setModal,
    dataState,
    setDataState,
    debt,
    walletBalance,
    setNow,
    messages,
    input,
    setInput,
    thinking,
    wave,
    repayAmount,
    setRepayAmount,
    adjusting,
    setAdjusting,
    cardOpen,
    setCardOpen,
    lastRepay,
    lastChange,
    receipts,
    selectedReceipt,
    setSelectedReceipt,
    pending,
    setPending,
    signing,
    walletOutcome,
    setWalletOutcome,
    guardian,
    reserve,
    guardianSpent,
    guardianDebt,
    policyFields,
    setPolicyFields,
    savedFields,
    setupReview,
    setSetupReview,
    comfort,
    setComfort,
    watcherOnline,
    setWatcherOnline,
    notice,
    setNotice,
    wide,
    phone,
    shortMobile,
    finishEntrance,
    openPanel,
    panelClose,
    scrollRef,
    speechCue,
    finishText,
    current,
    characterMood,
    card,
    comp,
    whatIf,
    unavailable,
    spendable,
    remaining,
    refresh,
    _ask,
    confirmPending,
    executeRepay,
    policyValidation,
    activate,
    ownerAction,
    replay,
    clearConversation,
    reset,
    startConsultation,
    connectDemoWallet,
    healthText,
  };
}
