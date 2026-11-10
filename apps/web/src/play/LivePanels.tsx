import { useEffect, useRef } from "react";
import { ChatComposer } from "./ChatComposer";
import { formatAtomic } from "./source/formatAtomic";
import type { useLiveConsultation } from "./useLiveConsultation";

type Live = ReturnType<typeof useLiveConsultation>;
export function LivePositionPanel({ live }: { live: Live }) {
  const data = live.state.status === "ready" ? live.state.position : null;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-5">
      <section className="rounded-[24px] border border-[#e4d7ba1a] bg-[#1f2122] p-5">
        <div className="flex items-center justify-between">
          <span>Position health</span>
          <button
            type="button"
            onClick={live.refresh}
            className="rounded-full border border-white/10 px-3 py-2"
          >
            Refresh
          </button>
        </div>
        {live.state.status === "loading" && <p role="status">Loading position…</p>}
        {live.state.status === "network_mismatch" && (
          <p role="alert">Wallet and server networks do not match. Chat is disabled.</p>
        )}
        {live.state.status === "empty" && <p>No lending position found for this account.</p>}
        {live.state.status === "stale" && <p>Position data is stale. Refresh before acting.</p>}
        {live.state.status === "unavailable" && (
          <p>Position data is unavailable. Try refreshing.</p>
        )}
        {data && (
          <>
            <strong className="mt-3 block text-4xl tabular-nums">
              {data.health.kind === "no_debt"
                ? "No debt"
                : `${(data.health.bps / 100).toFixed(2)}%`}
            </strong>
            <p className="mt-3 text-xs text-[#a4a6a7]">Data age at read: {data.dataAgeMs} ms</p>
          </>
        )}
      </section>
      {data &&
        (
          [
            ["Collateral", data.collateral],
            ["Debt", data.debt],
            ["Supplied", data.supplied],
          ] as const
        ).map(([label, items]) => (
          <section key={label}>
            <h3 className="mb-3 mt-6 text-xs uppercase text-[#898b8c]">{label}</h3>
            {items.map((item) => (
              <p
                key={item.tokenId}
                className="mb-2 rounded-full border border-white/10 bg-[#1e2123] p-4"
              >
                {formatAtomic(item.atomic, item.decimals)} {item.symbol}
              </p>
            ))}
          </section>
        ))}
    </div>
  );
}

export function LiveChatPanel({
  live,
  phone,
  setComposerFocused,
  setKeyboardHeight,
  openPanel,
}: {
  live: Live;
  phone: boolean;
  setComposerFocused: (v: boolean) => void;
  setKeyboardHeight: (v: number | null) => void;
  openPanel: (v: "chat" | "voice" | "position" | "guardian" | "activity" | null) => void;
}) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (live.error) root.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus();
  }, [live.error]);
  return (
    <section
      ref={root}
      className={`chat-panel flex min-h-0 flex-1 flex-col px-4 text-[#edf3f5] sm:px-5 ${phone ? "bg-transparent" : "bg-[#121415] bg-[url(/play/chat-texture.svg)] bg-repeat"}`}
    >
      <div className="max-md:hidden shrink-0 pb-2 pt-5 text-center text-sm font-semibold">
        mr.fund
      </div>
      <div
        className="min-h-0 flex-1 space-y-4 overflow-y-auto py-6"
        aria-live="polite"
        aria-busy={live.busy}
      >
        <p>Ask about your Rhea position.</p>
        {live.messages.map((message) => (
          <p
            key={message.id}
            className={
              message.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl bg-[#304438] p-3"
                : "max-w-[90%] rounded-2xl bg-[#1f2122] p-3"
            }
          >
            {message.content}
          </p>
        ))}
        {live.partial && <p className="rounded-2xl bg-[#1f2122] p-3">{live.partial}</p>}
        {live.busy && <p role="status">{live.progress}</p>}
        {live.error && <p role="alert">{live.error}</p>}
        {live.card && (
          <article className="recommendation-card rounded-xl border border-[#313334] bg-[#1c1e1f] p-4">
            <h3>{live.card.headline}</h3>
            <p>{live.card.reason}</p>
            <dl>
              {live.card.numbers.map((n) => (
                <div key={`${n.label}-${n.unit}`}>
                  <dt>{n.label}</dt>
                  <dd>
                    {n.before} {n.after ? `→ ${n.after}` : ""} {n.unit}
                  </dd>
                </div>
              ))}
            </dl>
            {live.card.fees.map((fee) => (
              <p key={`${fee.label}-${fee.recipientId}`}>
                {fee.label}: {String(fee.amount)} atomic units of {fee.tokenId} → {fee.recipientId}{" "}
                ({fee.when})
              </p>
            ))}
            <p>Data age at request: {live.card.dataAgeMs} ms</p>
            <p>Action: {live.card.action}</p>
            {live.card.payload?.map((tx) => (
              <p key={tx.receiverId}>
                To {tx.receiverId}: {tx.actions.map((action) => action.methodName).join(", ")}
              </p>
            ))}
            <button type="button" disabled>
              Execute now
            </button>
            <p>Wallet execution is the next step.</p>
            {live.state.status === "stale" && (
              <button type="button" onClick={live.refresh}>
                Refresh position
              </button>
            )}
          </article>
        )}
      </div>
      <ChatComposer
        input={live.input}
        thinking={live.busy}
        disabled={live.state.status === "loading" || live.state.status === "network_mismatch"}
        allowDuringThinking
        maxLength={4000}
        streamingId={null}
        setInput={live.setInput}
        sendMessage={(text) => {
          void live.send(text);
        }}
        setComposerFocused={setComposerFocused}
        setKeyboardHeight={setKeyboardHeight}
        clearConversation={live.clear}
        openPanel={openPanel}
      />
    </section>
  );
}
