import { ArrowUpRight } from "lucide-react";
import { followUpPromptsClass, promptGridClass } from "../chatAppearance";
import type { Suggestion } from "./liveSuggestions";

/** Same chip look as the demo: large chips before the first question, small ones after. */
export function SuggestionChips({
  suggestions,
  variant,
  onSend,
  onRefresh,
}: {
  suggestions: Suggestion[];
  variant: "initial" | "follow-up";
  onSend: (text: string) => void;
  onRefresh: () => void;
}) {
  if (suggestions.length === 0) return null;
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would add form semantics and default styling to plain chips
    <div
      role="group"
      aria-label="Suggested questions"
      className={variant === "initial" ? promptGridClass : followUpPromptsClass}
    >
      {suggestions.map((s) => (
        <button
          type="button"
          key={s.label}
          onClick={() => (s.action === "send" ? onSend(s.text) : onRefresh())}
        >
          <span>{s.label}</span>
          {variant === "follow-up" && <ArrowUpRight size={12} aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}
