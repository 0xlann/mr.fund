import { ArrowRight } from "lucide-react";
import { ChatBrandAvatar, chatBubbleClass } from "./chatAppearance";
import { percent } from "./display";
import { ProvenanceTag, Tag } from "./ProvenanceTag";
import { ReplyText } from "./ReplyText";
import type { Advice, Port } from "./source/types";
import type { Message } from "./useConsultation";

interface Props extends Pick<Advice, "whatIf"> {
  messages: Message[];
  streamingId: number | null;
  thinking: boolean;
  finishText: (id: number) => void;
  sendMessage: (text: string) => void;
  port: Port;
}
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
function ChatAvatar() {
  return <ChatBrandAvatar className="max-md:hidden" />;
}

export function ChatMessages({
  messages,
  streamingId,
  thinking,
  whatIf,
  finishText,
  sendMessage,
  port,
}: Props) {
  return (
    <>
      {" "}
      {messages.map((message) => (
        <div
          key={message.id}
          className={`chat-message mb-5 flex items-end gap-2.5 ${message.role === "user" ? "justify-end pl-9 max-md:pl-28" : "pr-4 sm:pr-8 max-md:pl-[88px] max-md:pr-0"}`}
        >
          {message.role === "assistant" && <ChatAvatar />}
          <div className={chatBubbleClass(message.role)}>
            <span className="sr-only">{message.role === "assistant" ? "MR.FUND" : "YOU"}</span>
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
                <Tag>
                  <ProvenanceTag port={port} label="SIMULATED WHAT-IF" />
                </Tag>
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
        <div className="prompt-grid mb-6 ml-[42px] max-md:ml-[88px] flex flex-wrap gap-2 [&_button]:inline-flex [&_button]:items-center [&_button]:gap-2 [&_button]:rounded-full [&_button]:border [&_button]:border-[#313334] [&_button]:bg-transparent [&_button]:px-3.5 [&_button]:py-2.5 [&_button]:text-left [&_button]:text-[11px] [&_button]:font-medium [&_button]:text-[#a2a4a5] [&_button]:transition-colors [&_button:hover]:bg-[#1f2122] [&_button:hover]:text-[#edf3f5]">
          {prompts.map((p) => (
            <button type="button" key={p.label} onClick={() => sendMessage(p.text)}>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      )}
      {thinking && (
        <div className="mb-5 flex items-end gap-2.5 max-md:pl-[88px]" role="status">
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
    </>
  );
}
