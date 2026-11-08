export function chatBubbleClass(role: "assistant" | "user") {
  return `min-w-0 max-w-[92%] rounded-[22px] px-4 py-3 text-sm leading-[1.7] [overflow-wrap:anywhere] [&_p]:whitespace-pre-wrap [&_p]:font-normal [&_p]:leading-[1.7] ${role === "user" ? "rounded-br-[6px] bg-[#bad7c3] text-[#203327]" : "rounded-bl-[6px] bg-[#1f2122] text-[#d6d8d9]"}`;
}
export const chatComposerClass =
  "chat-composer mb-4 mt-3 flex shrink-0 items-end gap-1 rounded-[28px] border border-white/8 bg-[#1f2122] p-1.5 transition-colors focus-within:border-[#e4d7ba4d]";
export const chatInputClass =
  "block field-sizing-content min-h-11 max-h-32 min-w-0 flex-1 resize-none border-0 bg-transparent px-3 py-3 font-[family-name:var(--font-body)] text-base leading-5 text-[#eeeef3] outline-none! placeholder:text-[#757778] sm:text-sm";
export const chatSendClass =
  "grid size-9 place-items-center rounded-full border-0 bg-[#e4d7ba] text-[#26352a] transition-colors hover:bg-[#eee6d3] disabled:bg-[#323435] disabled:text-[#767879]";
export function ChatBrandAvatar({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-8 shrink-0 place-items-center rounded-full bg-[#e4d7ba] font-[family-name:var(--font-display)] text-lg font-bold leading-none tracking-[-1.5px] text-[#203327] ${className}`}
    >
      m.
    </span>
  );
}
