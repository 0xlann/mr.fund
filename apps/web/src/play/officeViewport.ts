/** Reserve the same right-hand tool width as the Tailwind shell, then fit the actor's station. */
export function officeFraming(
  width: number,
  height: number,
  panelOpen: boolean,
  station: "office" | "guardian" | "chat" | "activity",
  viewHeight: number,
) {
  const panelWidth = panelOpen ? Math.min(460, width * 0.44) : 0;
  const reserved = panelOpen ? panelWidth + 40 : 0;
  const stageWidth = Math.max(1, width - reserved);
  const minimumSpan = { office: 3.2, guardian: 4.6, chat: 2.2, activity: 3.0 }[station];
  return {
    shift: reserved / (2 * Math.max(width, 1)),
    pull:
      Math.max(1, minimumSpan / ((viewHeight * stageWidth) / Math.max(height, 1))) *
      (height <= 600 ? 1.12 : 1),
  };
}
