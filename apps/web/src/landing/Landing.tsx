import {
  ArrowDownRight,
  ArrowUpRight,
  Code2,
  MessageCircle,
  Plus,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { FeatureArtwork } from "./FeatureArtwork";
import { landingFigures } from "./figures";
import { HeroChat } from "./HeroChat";
import { HeroVideo } from "./HeroVideo";
import { LandingMotion } from "./LandingMotion";
import { Mascot } from "./Mascot";

const shell = "mx-auto w-full max-w-[1440px] px-5 sm:px-10 lg:px-14";
const display = "font-[family-name:var(--font-display)]";
const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#bad7c3]";
const eyebrow = "m-0 flex items-center gap-2 text-sm font-medium tracking-[.05em] text-[#a2b2a5]";
const heading = `${display} m-0 text-[clamp(40px,5.4vw,78px)] font-medium leading-[1.06] tracking-[-.045em] text-balance`;
const cta = `group inline-flex min-h-13 items-center justify-center gap-6 rounded-[10px] bg-[#d3e5d7] px-6 py-3.5 text-base font-semibold text-[#203327] transition-[background-color,translate] duration-200 hover:-translate-y-0.5 hover:bg-[#e6efdc] [&_svg]:transition-transform [&_svg]:duration-300 hover:[&_svg]:-translate-y-0.5 hover:[&_svg]:translate-x-0.5 ${focus}`;

const navLink = `inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[.16em] text-[#d6ddd6] no-underline transition-colors hover:text-white sm:text-xs ${focus}`;

/**
 * Floating split nav: two dark pill halves and a round logo badge in the middle.
 * The bar is masked with a circle slightly larger than the badge, so the notch
 * around the badge is a real transparent cut that works over every section.
 */
function Nav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 pt-3 sm:pt-4">
      <nav
        aria-label="Main"
        className="relative mx-auto flex h-[84px] w-[calc(100%-24px)] max-w-[820px] items-center sm:w-[calc(100%-48px)]"
      >
        <div className="pointer-events-auto flex h-12 w-full items-center justify-between rounded-full border border-solid border-white/15 bg-[#535956]/75 px-5 [mask-image:radial-gradient(circle_at_center,transparent_54px,#000_54.5px)] sm:h-[52px] sm:px-6">
          <div className="flex max-w-[calc(50%-56px)] items-center gap-4 lg:gap-6">
            <a href="#experience" className={`${navLink} hidden lg:inline-flex`}>
              Meet Mr.Fund
            </a>
            <a href="#features" className={navLink}>
              How it works
            </a>
          </div>
          <div className="flex max-w-[calc(50%-56px)] items-center gap-4 lg:gap-6">
            <a href="#guardian" className={`${navLink} hidden lg:inline-flex`}>
              Guardian
            </a>
            <a href="/play" className={navLink}>
              <span className="sm:hidden">Let’s talk</span>
              <span className="hidden sm:inline">Start consultation</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
        </div>
        <a
          href="#top"
          aria-label="Mr.Fund home"
          className={`pointer-events-auto absolute left-1/2 top-1/2 grid size-[84px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#d3e5d7] text-[#203327] no-underline transition-transform duration-300 hover:scale-[1.04] motion-reduce:transition-none ${focus}`}
        >
          <Mascot size={76} className="size-[76px] rounded-full" />
        </a>
      </nav>
    </header>
  );
}

function Crosshair({ className }: { className: string }) {
  return (
    <Plus
      aria-hidden="true"
      size={20}
      strokeWidth={1.25}
      className={`pointer-events-none absolute hidden text-[#d3e5d7]/60 lg:block ${className}`}
    />
  );
}

function Hero() {
  return (
    <section
      data-hero
      id="top"
      className="relative overflow-hidden bg-[#0e1110] bg-[url(/landing/grid.svg)] px-3 pt-[100px] pb-10 sm:pt-[104px] sm:px-6 sm:pb-14 lg:px-[clamp(24px,9vw,176px)] lg:pb-20"
    >
      <div className="relative isolate mx-auto max-w-[1440px] overflow-hidden border border-solid border-white/10">
        <HeroVideo />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#0a0c0b]/60" />
        <div className="relative grid min-h-[calc(100svh-104px-80px)] items-center gap-12 px-5 py-14 sm:px-10 lg:grid-cols-[1.08fr_.92fr] lg:gap-16 lg:px-14 lg:py-20">
          <Crosshair className="left-1 top-12" />
          <Crosshair className="left-[52%] top-12" />
          <Crosshair className="left-1 bottom-24" />
          <div className="relative z-10 flex flex-col items-start">
            <p data-hero-intro className={`${eyebrow} uppercase tracking-[.2em]! text-xs!`}>
              Your DeFi manager on NEAR
              <span aria-hidden="true" className="h-0.5 w-3 bg-[#d3e5d7]" />
            </p>
            <h1
              data-hero-title
              className={`${display} m-0 mt-5 text-[clamp(48px,6.4vw,96px)] font-medium leading-[1] tracking-[-.055em] text-[#f1f3ec]`}
            >
              <span className="block overflow-hidden pb-[.06em]">
                <span data-hero-word className="block">
                  The DeFi manager
                </span>
              </span>
              <span className="block overflow-hidden pb-[.08em]">
                <span
                  data-hero-word
                  className="block font-[family-name:var(--font-editorial)] font-normal italic text-[#d9e2c5]"
                >
                  you can talk to.
                </span>
              </span>
            </h1>
            <p
              data-hero-intro
              className="m-0 mt-6 max-w-[500px] text-base leading-relaxed text-[#b3bdb5] sm:text-lg"
            >
              Mr.Fund explains your lending position in plain words, shows the smartest move, and
              acts only within limits you set.
            </p>
            <div data-hero-intro className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <a data-magnetic href="/play" className={cta}>
                Start consultation <ArrowUpRight size={20} />
              </a>
              <p className="m-0 flex items-center gap-3 text-sm leading-snug text-[#a2b0a4]">
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-solid border-white/12 bg-[#141816]">
                  <ShieldCheck size={16} className="text-[#d3e5d7]" />
                </span>
                <span>
                  Simulated demo.
                  <br />
                  Mock wallet, no real funds.
                </span>
              </p>
            </div>
            <div
              data-hero-intro
              className="mt-12 flex items-center gap-5 text-sm text-[#a2b0a4] sm:mt-16"
            >
              <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[.2em] text-[#8a9a8d]">
                Built on
                <span aria-hidden="true" className="h-0.5 w-3 bg-[#d3e5d7]" />
              </span>
              <span className="flex items-center gap-2 text-[#d6dfd6]">
                <Image
                  src="/play/tokens/near.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 invert"
                />
                NEAR
              </span>
              <span className="text-[#d6dfd6]">Rhea lending</span>
            </div>
          </div>
          <div className="relative z-10 w-full lg:max-w-[500px] lg:justify-self-end">
            <HeroChat figures={landingFigures()} />
          </div>
        </div>
      </div>
    </section>
  );
}

const featureCards = [
  {
    asset: "position-orbit",
    category: "The briefing",
    title: "The whole picture.",
    text: "Collateral, debt and your buffer. All in one conversation.",
  },
  {
    asset: "decision-route",
    category: "The next move",
    title: "A clearer next move.",
    text: "Repay or supply? Compare the numbers before you make a move.",
  },
  {
    asset: "position-tokens",
    category: "Position",
    title: "Numbers with context.",
    text: "Health, rates and balances. Connected, not scattered.",
  },
  {
    asset: "plain-words",
    category: "Conversation",
    title: "Plain words, please.",
    text: "Ask what it means. Get an explanation you can use.",
  },
  {
    asset: "guardian",
    category: "Guardian",
    title: "Your rules come first.",
    text: "Your reserve, your limits. Guardian follows your policy.",
  },
  {
    asset: "languages",
    category: "Language",
    title: "Your way of asking.",
    text: "Designed for your language. Previewed here with scripted replies.",
  },
] as const;
function Features() {
  return (
    <section
      id="features"
      className="relative bg-[#0e1110] bg-[url(/landing/grid.svg)] py-20 sm:py-28"
    >
      <div className={shell}>
        <div data-reveal className="relative mb-12 grid gap-6 pt-6 lg:grid-cols-[1fr_2fr]">
          <span
            data-rule
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px origin-left bg-[#343539]"
          />
          <p className={eyebrow}>01 / A clearer picture</p>
          <h2 className={`${heading} max-w-[810px]`}>
            Less dashboard.
            <br />
            <span className="font-[family-name:var(--font-editorial)] font-normal italic text-[#c7d9bc]">
              More understanding.
            </span>
          </h2>
        </div>
        <div data-feature-grid className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((item, index) => (
            <article
              data-feature-card
              key={item.asset}
              className="group relative flex min-w-0 flex-col overflow-hidden border border-solid border-[#343539] bg-[#17181b] p-6 sm:p-7"
            >
              <div className="flex items-center justify-between text-sm text-[#9bb09d]">
                <span className="flex items-center gap-3">
                  <span className="opacity-60">0{index + 1}</span>
                  {item.category}
                </span>
                <span aria-hidden="true" className="size-2 rounded-full bg-current opacity-50" />
              </div>
              <div data-feature-art className="relative my-5 h-[260px]">
                <FeatureArtwork kind={item.asset} figures={landingFigures()} />
              </div>
              <div className="mt-auto text-[#e7eee5]">
                <h3
                  className={`${display} m-0 text-[28px] font-medium leading-[1.1] tracking-[-.04em]`}
                >
                  {item.title}
                </h3>
                <p className="mb-0 mt-4 text-base leading-relaxed text-[#a0aea3]">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const marqueeItems = [
  { text: "Money talks.", serif: false },
  { text: "So does Mr.Fund.", serif: true },
  { text: "Plain words.", serif: false },
  { text: "Real numbers.", serif: true },
  { text: "Your limits.", serif: false },
] as const;

/** A slightly tilted sage band. Each half holds the phrases twice so the -50% loop never shows a gap on wide screens. */
function Marquee() {
  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden bg-[#0e1110] bg-[url(/landing/grid.svg)] py-10 sm:py-14"
    >
      <div className="-mx-[5%] -rotate-[1.5deg] border-0 border-y-2 border-solid border-[#203327] bg-[#c7d4bc] py-4 sm:py-5">
        <div data-marquee className="flex w-max items-center">
          {[0, 1].map((half) => (
            <div key={half} className="flex shrink-0 items-center">
              {[0, 1].flatMap((copy) =>
                marqueeItems.map((item) => (
                  <span key={`${copy}-${item.text}`} className="flex items-center">
                    <span
                      className={`whitespace-nowrap px-7 leading-none sm:px-10 ${
                        item.serif
                          ? "font-[family-name:var(--font-editorial)] text-[clamp(32px,4.4vw,62px)] italic text-[#3b5a43]"
                          : `${display} text-[clamp(28px,3.9vw,54px)] font-medium tracking-[-.045em] text-[#1b2c21]`
                      }`}
                    >
                      {item.text}
                    </span>
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#203327] font-[family-name:var(--font-display)] text-base font-semibold tracking-[-1px] text-[#c7d4bc] sm:size-12 sm:text-lg">
                      m.
                    </span>
                  </span>
                )),
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GuardianSection() {
  return (
    <section
      id="guardian"
      data-curtain
      className="relative scroll-mt-28 overflow-hidden bg-[#0e1110] bg-[url(/landing/grid.svg)] py-20 text-[#eff1e9] sm:py-28"
    >
      <div className={`${shell} grid items-center gap-12 lg:grid-cols-2 lg:gap-20`}>
        <div
          data-reveal
          className="relative order-2 rounded-[16px_16px_64px_16px] border border-solid border-[#2c332e] bg-[#151917] bg-[url(/landing/grain-dark.svg)] p-6 sm:p-9 lg:order-1"
        >
          <div className="flex items-center justify-between gap-3 border-0 border-b border-solid border-[#2c332e] pb-5 text-sm font-medium text-[#a9b8ac]">
            <span className="flex items-center gap-2">
              <ShieldCheck size={20} /> Guardian
            </span>
            <span>Your policy. By design.</span>
          </div>
          <div className="relative mx-auto aspect-[1.2] max-w-[520px]">
            <div data-float className="absolute inset-0">
              <Image
                src="/landing/guardian.png"
                alt=""
                fill
                sizes="(min-width:1024px) 520px, 90vw"
                className="object-contain"
              />
            </div>
          </div>
          <div className="relative flex flex-wrap gap-2 border-0 border-t border-solid border-[#2c332e] pt-5">
            {["Your reserve", "Your limits", "Your permission"].map((item) => (
              <span key={item} className="flex items-center gap-2 px-2 py-2 text-sm text-[#a9b8ac]">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-[#c8daae]" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <div data-reveal className="order-1 lg:order-2">
          <p className={eyebrow}>04 / Meet Guardian</p>
          <h2 className={`${heading} mt-5!`}>
            Your money.
            <br />
            <span className="font-[family-name:var(--font-editorial)] font-normal italic text-[#c7d9bc]">
              Your boundaries.
            </span>
          </h2>
          <p className="mb-0 mt-7 text-lg leading-[1.8] text-[#a6b2a8]">
            Set the reserve, repayment limits and trigger. The live design puts your policy in a
            contract, so a conversation can’t grant itself permission.
          </p>
          <div className="mt-7">
            {[
              {
                icon: MessageCircle,
                title: "The AI talks.",
                text: "Explains and proposes. Never signs or sends.",
              },
              {
                icon: Code2,
                title: "Code decides numbers.",
                text: "The engine calculates with inputs and assumptions.",
              },
              {
                icon: ShieldCheck,
                title: "Your policy sets the boundary.",
                text: "The contract design enforces who can do what.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex items-start gap-4 border-0 border-t border-solid border-[#2c332e] py-5"
              >
                <Icon size={19} className="mt-1 shrink-0 text-[#a6bd99]" />
                <div>
                  <h3 className="m-0 text-base font-semibold">{title}</h3>
                  <p className="mb-0 mt-1 text-sm leading-relaxed text-[#8f9d92]">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="relative overflow-hidden bg-[#0e1110] bg-[url(/landing/grid.svg)] py-16 text-[#eff1e9] sm:py-24">
      <div className={shell}>
        <div className="relative mb-12 flex items-center justify-between gap-5 pb-5 text-sm text-[#a2b0a4]">
          <span>One conversation away.</span>
          <span className="hidden sm:inline">Your next move starts with you.</span>
          <span
            data-rule
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-px origin-left bg-[#354238]"
          />
        </div>
        <div data-reveal className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
          <h2
            className={`${display} m-0 text-[clamp(52px,7.5vw,108px)] font-medium leading-[.98] tracking-[-.06em]`}
          >
            Make your next move
            <br />
            <span className="font-[family-name:var(--font-editorial)] font-normal italic text-[#c7d9bc]">
              a conversation.
            </span>
          </h2>
          <a
            data-magnetic
            href="/play"
            className={`group flex min-h-16 items-center justify-between gap-6 rounded-[14px_14px_4px_14px] bg-[#d3e5d7] px-6 py-5 text-lg font-medium text-[#203327] transition-colors hover:bg-[#e6efdc] lg:size-[180px] lg:flex-col lg:items-start lg:justify-between lg:rounded-full lg:p-9 ${focus}`}
          >
            <ArrowUpRight
              size={34}
              className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
            />
            <span>
              Start
              <br className="hidden lg:block" /> consultation
            </span>
          </a>
        </div>
        <p className="mb-0 mt-9 text-sm text-[#87988b]">
          Mock wallet · no real funds · no signature needed
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="overflow-hidden bg-[#0e1110] bg-[url(/landing/grid.svg)]">
      <div
        className={`${shell} flex flex-col justify-between gap-6 py-10 text-sm text-[#7f9386] sm:flex-row`}
      >
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[#acc69f]" />
          Built for the NEAR Hackathon 2026
        </span>
        <div className="flex flex-wrap items-center gap-6">
          <a href="#features" className={`text-[#a5b7aa] ${focus}`}>
            How it works
          </a>
          <a href="/play" className={`text-[#a5b7aa] ${focus}`}>
            Playground <ArrowUpRight size={14} className="ml-1 inline" />
          </a>
          <span>Simulated figures. Not financial advice.</span>
        </div>
      </div>
      <div
        aria-hidden="true"
        className={`${display} -mb-[.23em] overflow-hidden whitespace-nowrap text-center text-[clamp(110px,24vw,360px)] font-semibold leading-[.92] tracking-[-.07em] text-[#23382a]`}
      >
        mr.fund
        <ArrowDownRight className="inline size-[.48em] text-[#a2bb92]" />
      </div>
    </footer>
  );
}

export function Landing() {
  return (
    <LandingMotion>
      <a
        href="#features"
        className={`sr-only rounded-full bg-[#d3e5d7] px-5 py-3 text-[#203327] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 ${focus}`}
      >
        Skip to content
      </a>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Features />
        <GuardianSection />
        <Closing />
      </main>
      <Footer />
    </LandingMotion>
  );
}
