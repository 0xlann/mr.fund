import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import Image from "next/image";
import type { LandingFigures } from "./figures";

export function ScrollJourney({ f }: { f: LandingFigures }) {
  return (
    <div data-stack-pin className="relative space-y-5">
      <article
        data-stack-card
        className="relative grid min-h-[480px] items-center gap-6 overflow-hidden rounded-[16px] border border-solid border-[#bfcbb1] bg-[#e3e8d8] bg-[url(/landing/grain-light.svg)] p-7 md:grid-cols-2 md:p-12 lg:min-h-[540px]"
      >
        <div>
          <p className="m-0 text-sm font-medium tracking-[.08em] text-[#657b58]">01 / UNDERSTAND</p>
          <h3 className="mb-5 mt-7 font-[family-name:var(--font-display)] text-[clamp(36px,4.5vw,60px)] font-medium leading-[1.04] tracking-[-.04em] text-[#203327]">
            Know where
            <br />
            you stand.
          </h3>
          <p className="m-0 max-w-[350px] text-base leading-relaxed text-[#617555]">
            Your position, explained before your next move.
          </p>
          <div className="mt-8 flex items-baseline gap-3">
            <b className="font-[family-name:var(--font-display)] text-[52px] font-medium tracking-[-2px] text-[#203327]">
              {f.health}
            </b>
            <span className="text-sm text-[#667b5a]">Position health · demo</span>
          </div>
        </div>
        <div className="relative mx-auto aspect-[1.35] w-full max-w-[450px]">
          <Image
            src="/landing/position-orbit.png"
            alt=""
            fill
            sizes="(min-width:1024px) 450px, 85vw"
            className="object-contain"
          />
        </div>
      </article>
      <article
        data-stack-card
        className="relative grid min-h-[480px] items-center gap-6 overflow-hidden rounded-[16px] border border-solid border-[#cabd9f] bg-[#eee5cf] bg-[url(/landing/grain-light.svg)] p-7 md:grid-cols-2 md:p-12 lg:min-h-[540px]"
      >
        <div>
          <p className="m-0 text-sm font-medium tracking-[.08em] text-[#7d7059]">02 / COMPARE</p>
          <h3 className="mb-5 mt-7 font-[family-name:var(--font-display)] text-[clamp(36px,4.5vw,60px)] font-medium leading-[1.04] tracking-[-.04em] text-[#3d3b2b]">
            Less guessing.
            <br />
            See the math.
          </h3>
          <p className="m-0 max-w-[350px] text-base leading-relaxed text-[#746e59]">
            Repay or supply? Compare the same amount over one year.
          </p>
          <div className="mt-8 flex items-baseline gap-4">
            <b className="font-[family-name:var(--font-display)] text-[52px] font-medium tracking-[-2px] text-[#3d3b2b]">
              {f.repaySaves}
            </b>
            <span className="text-sm text-[#746e59]">vs {f.yieldEarns} USDC · demo</span>
          </div>
        </div>
        <div className="relative mx-auto aspect-[1.35] w-full max-w-[450px]">
          <Image
            src="/landing/decision-route.png"
            alt=""
            fill
            sizes="(min-width:1024px) 450px, 85vw"
            className="object-contain"
          />
        </div>
      </article>
      <article
        data-stack-card
        className="relative grid min-h-[480px] items-center gap-6 overflow-hidden rounded-[16px] border border-solid border-[#405440] bg-[#203327] bg-[url(/landing/grain-dark.svg)] p-7 text-[#e6eddf] md:grid-cols-2 md:p-12 lg:min-h-[540px]"
      >
        <div>
          <p className="m-0 flex items-center gap-2 text-sm font-medium tracking-[.08em] text-[#b1c4a8]">
            <ShieldCheck size={17} />
            03 / YOU DECIDE
          </p>
          <h3 className="mb-5 mt-7 font-[family-name:var(--font-display)] text-[clamp(36px,4.5vw,60px)] font-medium leading-[1.04] tracking-[-.04em]">
            Good to know.
            <br />
            Your call to act.
          </h3>
          <p className="m-0 max-w-[350px] text-base leading-relaxed text-[#b2c3a8]">
            Review the proposal. Keep control of the approval.
          </p>
          <a
            href="/play"
            className="mt-8 inline-flex items-center gap-6 rounded-full bg-[#d3e5d7] px-5 py-3.5 text-sm font-semibold text-[#203327] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#bad7c3]"
          >
            Try the consultation <ArrowRight size={17} />
          </a>
          <p className="mb-0 mt-4 flex items-center gap-2 text-sm text-[#adbea3]">
            <Check size={15} />
            Mock wallet. No real funds.
          </p>
        </div>
        <div className="relative mx-auto aspect-[1.35] w-full max-w-[450px]">
          <Image
            src="/landing/guardian.png"
            alt=""
            fill
            sizes="(min-width:1024px) 450px, 85vw"
            className="object-contain"
          />
        </div>
      </article>
    </div>
  );
}
