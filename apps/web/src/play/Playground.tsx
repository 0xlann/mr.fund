"use client";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Check,
  CheckCheck,
  CircleHelp,
  History,
  Info,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  Mic,
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
} from "lucide-react";
import dynamic from "next/dynamic";
import { type ReactNode, useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { ConsultationTabs, type DetailTab } from "./ConsultationTabs";
import { DetailContent } from "./DetailContent";
import { amount } from "./display";
import { ImmersiveSceneFrame } from "./ImmersiveSceneFrame";
import { ModalFrame } from "./ModalFrame";
import { PositionPanel } from "./PositionPanel";
import { ProvenanceTag, Tag } from "./ProvenanceTag";
import { createDemoSource } from "./source/demoSource";
import type { ConsultationSource, DataState, PolicyFields, WalletOutcome } from "./source/types";
import { panelReveal, playClasses } from "./styles";
import { type Panel, useConsultation } from "./useConsultation";
import { VoicePanel } from "./VoicePanel";
import { WalletDialog } from "./WalletDialog";

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
export function Playground({ source }: { source?: ConsultationSource } = {}) {
  const [defaultSource] = useState(() => source ?? createDemoSource());
  const activeSource = source ?? defaultSource;
  const {
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
    disconnect,
    connecting,
    modal,
    setModal,
    dataState,
    selectDataState,
    debt,
    walletBalance,
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
    figures,
    characterMood,
    card,
    comp,
    whatIf,
    unavailable,
    spendable,
    remaining,
    refresh,
    sendMessage,
    confirmPending,
    executeCard,
    policyError,
    activate,
    ownerAction,
    replay,
    clearConversation,
    reset,
    startConsultation,
    connect,
    healthText,
  } = useConsultation(activeSource);
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
              <ProvenanceTag
                port={activeSource.guardian}
                label="Opt-in · Simulated policy preview"
              />
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
                sendMessage("Should I repay or earn yield?");
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
      <PositionPanel
        port={activeSource.position}
        figures={figures}
        state={dataState}
        health={healthText}
        debt={amount(debt)}
        liquidation={current.liquidation ? `$${Number(current.liquidation).toFixed(2)}` : "—"}
        comfort={comfort}
        noDebt={current.health === "no_debt"}
        change={lastChange}
        onRefresh={refresh}
        onSettings={() => setModal("settings")}
        onExplain={() => sendMessage("Explain my position")}
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
            onClick={() => sendMessage("What are my Guardian limits?")}
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
      {phone && stage === "consult" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[#121415] bg-[url(/play/chat-texture.svg)] bg-repeat"
        />
      )}
      <h1 className="sr-only">Mr.Fund — your personal DeFi companion</h1>
      <div className="absolute inset-0 flex flex-col">
        {stage === "consult" && (
          <header
            inert={!chatRevealed}
            aria-hidden={!chatRevealed}
            className={`relative z-20 mx-auto flex h-[76px] w-full max-w-[1920px] shrink-0 items-center justify-between gap-3 px-4 md:h-[88px] md:px-8 transition-opacity duration-500 ${chatRevealed ? "opacity-100" : "opacity-0"} ${phone || keyboardHeight || shortMobile ? "h-14!" : ""}`}
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
                  <ProvenanceTag
                    port={activeSource.position}
                    label="SIMULATED · PnL unavailable"
                    className="col-span-2 text-xs text-[#a2a4a5] 2xl:col-span-1"
                  />
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
          className={`mx-auto grid min-h-0 w-full max-w-[1920px] flex-1 ${phone ? "grid-cols-1 grid-rows-[minmax(0,1fr)] gap-0 px-0 pb-[96px]" : `gap-4 px-4 md:gap-5 md:px-8 ${keyboardHeight || shortMobile ? `grid-cols-1 grid-rows-[minmax(0,1fr)] ${keyboardHeight ? "pb-4" : "pb-[88px]"}` : "grid-rows-[164px_minmax(0,1fr)] pb-[100px] md:grid-cols-[.7fr_1.3fr] md:grid-rows-1 xl:grid-cols-[.8fr_1.45fr_1fr] xl:pb-6"}`}`}
        >
          <section
            aria-label="Your companion"
            hidden={
              chatRevealed &&
              (keyboardHeight !== null ||
                (!phone && shortMobile) ||
                (phone && panel !== "chat" && panel !== null))
            }
            className={
              phone ? "absolute inset-0" : "relative col-start-1 row-start-1 min-h-0 min-w-0"
            }
          >
            <ImmersiveSceneFrame
              immersive={!chatRevealed || phone}
              transparent={phone && stage === "consult"}
            >
              <CharacterPortrait
                mood={characterMood}
                speaking={speaking}
                mobile={phone}
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
              className={`relative z-10 col-start-1 ${phone || keyboardHeight || shortMobile ? "row-start-1" : "row-start-2"} flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[#121415] md:col-start-2 md:row-start-1 [&_.chat-panel]:flex-1 ${phone ? `rounded-none! border-0! ${panel === "chat" ? "bg-transparent!" : ""}` : ""} ${panel === "position" ? "bg-[url(/play/chat-texture.svg)] bg-repeat" : ""} ${panelReveal(chatRevealed)}`}
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
                <ChatPanel
                  phone={phone}
                  scrollRef={scrollRef}
                  thinking={thinking}
                  messages={messages}
                  streamingId={streamingId}
                  whatIf={whatIf}
                  finishText={finishText}
                  sendMessage={sendMessage}
                  port={activeSource.position}
                  cardOpen={cardOpen}
                  card={card}
                  comp={comp}
                  repayAmount={repayAmount}
                  adjusting={adjusting}
                  unavailable={unavailable}
                  setRepayAmount={setRepayAmount}
                  setAdjusting={setAdjusting}
                  setCardOpen={setCardOpen}
                  executeCard={executeCard}
                  refresh={refresh}
                  lastRepay={lastRepay}
                  setSelectedReceipt={setSelectedReceipt}
                  input={input}
                  setInput={setInput}
                  setComposerFocused={setComposerFocused}
                  setKeyboardHeight={setKeyboardHeight}
                  clearConversation={clearConversation}
                  openPanel={openPanel}
                />
              )}
              {panel === "voice" && (
                <VoicePanel
                  busy={thinking || streamingId !== null}
                  onSend={sendMessage}
                  onNotice={setNotice}
                />
              )}
              {panel !== "chat" && panel !== "voice" && (
                <DetailContent key={`${panel}-${chatRevealed}`}>{toolContent(panel)}</DetailContent>
              )}
            </aside>
          )}
        </div>
        {stage === "consult" && chatRevealed && !wide && (phone || keyboardHeight === null) && (
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
              sendMessage(question);
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
          <WalletDialog
            connected={connected}
            connecting={connecting}
            walletBalance={walletBalance}
            stage={stage}
            port={activeSource.session}
            close={() => setModal(null)}
            connect={connect}
            disconnect={disconnect}
            setNotice={setNotice}
          />
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
                  selectDataState(e.target.value as DataState);
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
                {policyError && (
                  <p
                    className="field-error flex items-start gap-[6px] text-[#ffb18c] text-[10px] leading-[1.7] mt-[18px]!"
                    role="alert"
                  >
                    <AlertTriangle size={15} />
                    {policyError}
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
                disabled={!!policyError}
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
                onChange={(e) => setWalletOutcome(e.target.value as WalletOutcome)}
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
