"use client";
import {
  ArrowUpRight,
  BarChart3,
  CircleHelp,
  History,
  Info,
  MessageCircle,
  Mic,
  Settings2,
  Shield,
  ShieldCheck,
  Volume2,
  VolumeX,
  Wallet,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { type ReactNode, useState } from "react";
import { ActivityPanel } from "./ActivityPanel";
import { ApprovalDialog } from "./ApprovalDialog";
import { ChatPanel } from "./ChatPanel";
import { ConsultationTabs, type DetailTab } from "./ConsultationTabs";
import { DetailContent } from "./DetailContent";
import { amount } from "./display";
import { GuardianPanel } from "./GuardianPanel";
import { GuardianSetupDialog } from "./GuardianSetupDialog";
import { ImmersiveSceneFrame } from "./ImmersiveSceneFrame";
import { ModalFrame } from "./ModalFrame";
import { PositionPanel } from "./PositionPanel";
import { ProvenanceTag } from "./ProvenanceTag";
import { ReceiptDetail } from "./ReceiptDetail";
import { SettingsDialog } from "./SettingsDialog";
import { createDemoSource } from "./source/demoSource";
import type { ConsultationSource } from "./source/types";
import { panelReveal } from "./styles";
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
    guardianView,
    policyFields,
    setPolicyFields,
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
  function guardianContent() {
    return (
      <GuardianPanel
        view={guardianView}
        port={activeSource.guardian}
        ownerAction={ownerAction}
        replay={replay}
        setup={() => {
          setSetupReview(false);
          setModal("setup");
        }}
      />
    );
  }

  function activityContent() {
    return (
      <ActivityPanel
        receipts={receipts}
        port={activeSource.execution}
        setSelectedReceipt={setSelectedReceipt}
        sendMessage={sendMessage}
      />
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
          <SettingsDialog
            dataState={dataState}
            selectDataState={selectDataState}
            comfort={comfort}
            setComfort={setComfort}
            watcherOnline={watcherOnline}
            setWatcherOnline={setWatcherOnline}
            reset={reset}
            close={() => setModal(null)}
          />
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
          <GuardianSetupDialog
            policyFields={policyFields}
            setPolicyFields={setPolicyFields}
            setupReview={setupReview}
            setSetupReview={setSetupReview}
            policyError={policyError}
            activate={activate}
            close={() => setModal(null)}
          />
        )}
        {pending && (
          <ApprovalDialog
            pending={pending}
            signing={signing}
            walletOutcome={walletOutcome}
            setWalletOutcome={setWalletOutcome}
            close={() => setPending(null)}
            setNotice={setNotice}
            confirmPending={confirmPending}
          />
        )}
        {selectedReceipt && (
          <ReceiptDetail
            receipt={selectedReceipt}
            port={activeSource.execution}
            close={() => setSelectedReceipt(null)}
            openActivity={() => {
              setSelectedReceipt(null);
              openPanel("activity");
            }}
          />
        )}
      </div>
    </main>
  );
}
