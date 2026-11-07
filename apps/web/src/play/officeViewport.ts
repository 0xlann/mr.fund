export type HudLayout = { panelOpen: boolean; positionColumn: boolean; stacked: boolean };
export type Reserve = { side: number; bottom: number };

/** Screen area covered by HUD panels: side columns on wide screens, a bottom sheet on phones. */
export function hudReserve(width: number, height: number, hud: HudLayout): Reserve {
  if (hud.stacked) return { side: 0, bottom: height * (hud.panelOpen ? 0.56 : 0.2) };
  const toolWidth = hud.positionColumn
    ? Math.min(620, Math.max(440, width * 0.32))
    : Math.min(560, width * 0.48);
  const positionWidth = Math.min(500, Math.max(380, width * 0.28));
  const tool = hud.panelOpen ? toolWidth + 32 : 0;
  return { side: tool + (hud.positionColumn ? positionWidth + 24 : 0), bottom: 0 };
}

/** Pull the camera back until the station fits the area the HUD leaves visible, and centre it there. */
export function officeFraming(
  width: number,
  height: number,
  reserve: Reserve,
  station: "office" | "chat",
  viewHeight: number,
) {
  const stageWidth = Math.max(1, width - reserve.side);
  const stageHeight = Math.max(1, height - reserve.bottom);
  const span = { office: { x: 3.2, y: 4.4 }, chat: { x: 2.2, y: 2.2 } }[station];
  const visibleWidth = (viewHeight * stageWidth) / Math.max(height, 1);
  const visibleHeight = (viewHeight * stageHeight) / Math.max(height, 1);
  return {
    shift: reserve.side / (2 * Math.max(width, 1)),
    shiftY: reserve.bottom / (2 * Math.max(height, 1)),
    pull: Math.max(1, span.x / visibleWidth, span.y / visibleHeight) * (height <= 600 ? 1.12 : 1),
  };
}
