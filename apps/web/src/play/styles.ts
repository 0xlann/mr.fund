const recipes: Record<string, string> = {
  "wallet-button":
    "wallet-button bg-[var(--lime)] text-[#101a17]! border-0 rounded-[9px] p-[12px_15px] flex items-center gap-[10px] text-[11px]! font-extrabold! [transition:transform_.18s,background_.18s] [&:hover]:transform-[translateY(-2px)] [&:hover]:bg-[#c8ea70] [&.connected]:bg-[#343f34] [&.connected]:text-[var(--lime)]! max-[1100px]:text-[10px]! max-[1100px]:p-[11px] max-[820px]:p-[10px] max-[820px]:gap-[7px] max-[820px]:[&_svg:last-child]:hidden max-[820px]:[&.connected_span]:max-w-[82px] max-[820px]:[&.connected_span]:overflow-hidden max-[820px]:[&.connected_span]:text-ellipsis max-[620px]:text-[9px]! max-[620px]:p-[10px_11px]",
  tag: "tag inline-flex items-center gap-[6px] [border:1px_solid_currentColor] rounded-[5px] p-[5px_7px] text-[8px] leading-[1.2] tracking-[.07em] font-extrabold whitespace-nowrap",
  "status-dot": "status-dot inline-block w-[5px] h-[5px] bg-[#729955] rounded-full shrink-0",
  "chat-message":
    "chat-message mb-6 [&_p]:text-sm [&_p]:leading-[1.85] [&_p]:font-normal [&_p]:text-[#d6d8d9] [&.user]:ml-auto [&.user]:max-w-[88%] [&.user]:rounded-[20px_20px_5px_20px] [&.user]:border [&.user]:border-[#e4d7ba1a] [&.user]:bg-[#282a2b] [&.user]:px-4 [&.user]:py-3 [&.user_.message-label]:text-[#b2b4b5]",
  "loading-state": "loading-state opacity-[.3] animate-pulse",
  "guardian-card":
    "guardian-card bg-[#1a2c25] text-[#edf3f5] [border:1px_solid_#d7f8a422] rounded-[20px] p-[23px_23px_21px] overflow-hidden relative min-w-0 [&.expanded]:p-[28px] [&.expanded]:self-start max-[1100px]:p-[20px] max-[820px]:p-[23px_25px] max-[620px]:p-[21px_20px] max-[620px]:rounded-[17px] max-[620px]:[&.expanded]:p-[23px_20px]",
  "play-modal":
    "play-modal fixed inset-0 m-auto w-[min(460px,calc(100vw_-_28px))] max-h-[calc(100dvh_-_42px)] p-0 [border:1px_solid_#313334] bg-[var(--paper)] rounded-[28px] text-[var(--ink)] shadow-none overflow-auto overscroll-contain font-[family-name:var(--font-body)] [&.wide]:w-[min(700px,calc(100vw_-_28px))] [&::backdrop]:bg-[#1d1f205c] ",
  "receipt-banner":
    "receipt-banner flex items-center gap-[12px] bg-[#1c1e1f] p-[17px] rounded-[10px] mt-[25px] [&>span]:text-[#a2a4a5] [&_b]:block [&_b]:text-[13px] [&_small]:block [&_small]:text-[8px] [&_small]:text-[#a2a4a5] [&_small]:mt-[6px] [&_small]:tracking-[.04em] [&.rejected]:bg-[#1c1e1f] [&.failed]:bg-[#1c1e1f] [&.partial]:bg-[#1c1e1f] [&.rejected>span]:text-[#c07a46] [&.failed>span]:text-[#c07a46] [&.partial>span]:text-[#c07a46]",
  expanded:
    "expanded [&_.guardian-body]:pt-[24px] [&_.guardian-body]:min-h-[190px] [&_.guardian-body_h2]:text-[33px] [&_.guardian-body_p]:text-[11px] [&_.guardian-body_p]:max-w-[340px] [&_.guardian-visual]:transform-[scale(1.2)_rotate(-10deg)] [&_.guardian-numbers]:mt-[22px] max-[820px]:[&_.guardian-visual]:transform-[rotate(-10deg)] max-[620px]:[&_.guardian-body_h2]:text-[29px] max-[620px]:[&_.guardian-body_p]:text-[9px] max-[620px]:[&_.guardian-visual]:transform-[scale(.9)_rotate(-10deg)]",
  "receipt-icon":
    "receipt-icon h-[40px] w-[40px] bg-[#1c1e1f] rounded-[11px] text-[#a2a4a5] grid place-items-center shrink-0 [&.rejected]:bg-[#1c1e1f] [&.rejected]:text-[#bd8054] [&.failed]:bg-[#1c1e1f] [&.failed]:text-[#bd8054] [&.partial]:bg-[#1c1e1f] [&.partial]:text-[#bd8054] max-[620px]:w-[33px] max-[620px]:h-[33px]",
  spin: "spin animate-spin",
  muted: "muted bg-[#aaa77c]",
};

export function playClasses(value: string) {
  return value
    .split(/\s+/)
    .map((token) => recipes[token] ?? token)
    .join(" ");
}

/** Unfold from the horizontal centre without stretching text or changing panel layout. */
export function panelReveal(open: boolean) {
  return `[contain:paint] will-change-[clip-path,opacity] transition-[clip-path,opacity] duration-[700ms] ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none ${open ? "[clip-path:inset(0_0)] opacity-100" : "[clip-path:inset(50%_0)] opacity-0 pointer-events-none"}`;
}
