const recipes: Record<string, string> = {
  "wallet-button":
    "wallet-button bg-[var(--lime)] border-0 rounded-[9px] p-[12px_15px] flex items-center gap-[10px] text-[var(--ink)]! text-[11px]! font-extrabold! [transition:transform_.18s,background_.18s] [&:hover]:transform-[translateY(-2px)] [&:hover]:bg-[#e7ffab] [&.connected]:bg-[#343f34] [&.connected]:text-[var(--lime)]! max-[1100px]:text-[10px]! max-[1100px]:p-[11px] max-[820px]:p-[10px] max-[820px]:gap-[7px] max-[820px]:[&_svg:last-child]:hidden max-[820px]:[&.connected_span]:max-w-[82px] max-[820px]:[&.connected_span]:overflow-hidden max-[820px]:[&.connected_span]:text-ellipsis max-[620px]:text-[9px]! max-[620px]:p-[10px_11px]",
  tag: "tag inline-flex items-center gap-[6px] [border:1px_solid_currentColor] rounded-[5px] p-[5px_7px] text-[8px] leading-[1.2] tracking-[.07em] font-extrabold whitespace-nowrap",
  "status-dot": "status-dot inline-block w-[5px] h-[5px] bg-[#729955] rounded-full shrink-0",
  "chat-message":
    "chat-message mb-[16px] [&_p]:text-[12px] [&_p]:leading-[1.85] [&_p]:font-medium [&_p]:max-w-[440px] [&_p]:text-[#4a4e50] [&.user]:ml-auto [&.user]:max-w-[86%] [&.user]:bg-[#eff0e8] [&.user]:rounded-[12px_12px_3px_12px] [&.user]:p-[12px_15px] [&.user_.message-label]:text-[#7b8470] [&.user_p]:text-[11px] min-[1500px]:[&_p]:text-[13px] max-[1100px]:[&_p]:text-[11px] max-[820px]:[&_p]:text-[10px] max-[620px]:[&_p]:text-[12px]",
  "position-values":
    "position-values grid grid-cols-[1.1fr_1fr] gap-[20px] mt-[19px] [&>div>span]:flex [&>div>span]:items-center [&>div>span]:gap-[6px] [&>div>span]:text-[9px] [&>div>span]:text-[#aeb2b7] [&_strong]:block [&_strong]:font-[family-name:var(--font-display)] [&_strong]:font-medium [&_strong]:text-[35px] [&_strong]:leading-[1.3] [&_strong]:tracking-[-1.6px] [&_strong]:mt-[4px] [&_strong>span]:text-[#7e8592] [&_small]:flex [&_small]:items-center [&_small]:gap-[5px] [&_small]:text-[8px] [&_small]:text-[#d3d7da] [&_small]:mt-[6px] [&_small_b]:font-normal [&_small_b]:text-[#8f96a2] [&_small_b]:text-[7px] min-[1500px]:[&_strong]:text-[41px] max-[1100px]:gap-[12px] max-[1100px]:[&_strong]:text-[31px] max-[1100px]:[&_small_b]:hidden max-[820px]:[&_strong]:text-[41px] max-[820px]:[&_small]:text-[10px] max-[820px]:[&_small_b]:[display:inline] max-[820px]:[&_small_b]:text-[9px] max-[620px]:gap-[10px] max-[620px]:mt-[22px] max-[620px]:grid-cols-[1.05fr_1fr] max-[620px]:[&>div>span]:text-[8px] max-[620px]:[&_strong]:text-[34px] max-[620px]:[&_small]:text-[8px] max-[620px]:[&_small]:gap-[4px] max-[620px]:[&_small_b]:hidden",
  token:
    "token w-[15px] h-[15px] inline-flex items-center justify-center rounded-full text-[9px] font-bold shrink-0 [&.near]:text-[var(--ink)] [&.near]:bg-[#e3e7df] [&.near]:font-[family-name:var(--font-display)] [&.usdc]:text-[#fff] [&.usdc]:bg-[#4089db]",
  "loading-state": "loading-state opacity-[.3] animate-pulse",
  "guardian-card":
    "guardian-card bg-[var(--lime)] [border:1px_solid_#cce77b] rounded-[20px] p-[23px_23px_21px] overflow-hidden relative min-w-0 [&.expanded]:p-[28px] [&.expanded]:self-start max-[1100px]:p-[20px] max-[820px]:p-[23px_25px] max-[620px]:p-[21px_20px] max-[620px]:rounded-[17px] max-[620px]:[&.expanded]:p-[23px_20px]",
  "play-modal":
    "play-modal fixed inset-0 m-auto w-[min(460px,calc(100vw_-_28px))] max-h-[calc(100dvh_-_42px)] p-0 [border:1px_solid_#d8d9ce] bg-[var(--paper)] rounded-[19px] text-[var(--ink)] shadow-[0_30px_110px_#11192755] overflow-auto overscroll-contain font-[family-name:var(--font-body)] [&.wide]:w-[min(700px,calc(100vw_-_28px))] [&::backdrop]:bg-[#111b365c] [&::backdrop]:backdrop-filter-[blur(6px)]",
  "receipt-banner":
    "receipt-banner flex items-center gap-[12px] bg-[#eaf1db] p-[17px] rounded-[10px] mt-[25px] [&>span]:text-[#799451] [&_b]:block [&_b]:text-[13px] [&_small]:block [&_small]:text-[8px] [&_small]:text-[#8c9c77] [&_small]:mt-[6px] [&_small]:tracking-[.04em] [&.rejected]:bg-[#fae9db] [&.failed]:bg-[#fae9db] [&.partial]:bg-[#fae9db] [&.rejected>span]:text-[#c07a46] [&.failed>span]:text-[#c07a46] [&.partial>span]:text-[#c07a46]",
  expanded:
    "expanded [&_.guardian-body]:pt-[24px] [&_.guardian-body]:min-h-[190px] [&_.guardian-body_h2]:text-[33px] [&_.guardian-body_p]:text-[11px] [&_.guardian-body_p]:max-w-[340px] [&_.guardian-visual]:transform-[scale(1.2)_rotate(-10deg)] [&_.guardian-numbers]:mt-[22px] max-[820px]:[&_.guardian-visual]:transform-[rotate(-10deg)] max-[620px]:[&_.guardian-body_h2]:text-[29px] max-[620px]:[&_.guardian-body_p]:text-[9px] max-[620px]:[&_.guardian-visual]:transform-[scale(.9)_rotate(-10deg)]",
  "receipt-icon":
    "receipt-icon h-[40px] w-[40px] bg-[#edf4df] rounded-[11px] text-[#8b9f6a] grid place-items-center shrink-0 [&.rejected]:bg-[#f8e9dd] [&.rejected]:text-[#bd8054] [&.failed]:bg-[#f8e9dd] [&.failed]:text-[#bd8054] [&.partial]:bg-[#f8e9dd] [&.partial]:text-[#bd8054] max-[620px]:w-[33px] max-[620px]:h-[33px]",
  spin: "spin animate-spin",
  muted: "muted bg-[#aaa77c]",
};

export function playClasses(value: string) {
  return value
    .split(/\s+/)
    .map((token) => recipes[token] ?? token)
    .join(" ");
}
