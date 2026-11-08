import {
  ArrowDown,
  ArrowDownRight,
  ArrowUpRight,
  Code2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { ConversationPreview } from "./ConversationPreview";
import { landingFigures } from "./figures";
import { LandingMotion, MotionToggle } from "./LandingMotion";
import { Mascot } from "./Mascot";
import { PhonePreview } from "./PhonePreview";
import { ScrollJourney } from "./ScrollJourney";

const shell = "mx-auto w-full max-w-[1280px] px-5 sm:px-8";
const display = "font-[family-name:var(--font-display)]";
const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#bad7c3]";
const eyebrow = "m-0 flex items-center gap-2 text-sm font-medium tracking-[.05em] text-[#a2b2a5]";
const heading = `${display} m-0 text-[clamp(36px,4.8vw,64px)] font-medium leading-[1.06] tracking-[-.045em] text-balance`;
const cta = `group inline-flex min-h-13 items-center justify-center gap-6 rounded-full bg-[#d3e5d7] px-6 py-3.5 text-sm font-semibold text-[#203327] transition-[background-color,translate] duration-200 hover:-translate-y-0.5 hover:bg-[#e6efdc] ${focus}`;

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-0 border-b border-solid border-white/7 bg-[#0e1110] bg-[url(/landing/grain-dark.svg)]">
      <nav
        aria-label="Main"
        className={`${shell} flex h-[76px] items-center justify-between gap-3`}
      >
        <a href="#top" aria-label="Mr.Fund home" className={`flex items-center gap-2 ${focus}`}>
          <Mascot size={40} className="size-9 sm:size-10" />
          <span className={`${display} text-[23px] font-semibold tracking-[-1.2px] text-[#eff1e9]`}>
            mr.fund<span className="ml-1 align-top text-sm font-normal text-[#8b9b8e]">®</span>
          </span>
        </a>
        <div className="hidden items-center gap-7 lg:flex">
          {[
            { href: "#experience", text: "Meet Mr.Fund" },
            { href: "#how", text: "How it works" },
            { href: "#guardian", text: "Guardian" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm text-[#a9b5ac] transition-colors hover:text-[#eff1e9] ${focus}`}
            >
              {link.text}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <MotionToggle />
          <a href="/play" className={`${cta} min-h-10! gap-2! px-4! py-2.5!`}>
            <span className="sm:hidden">Let’s talk</span>
            <span className="hidden sm:inline">Start consultation</span>
            <ArrowUpRight size={16} />
          </a>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section
      data-hero
      id="top"
      className="relative isolate overflow-hidden bg-[url(/landing/grid.svg)]"
    >
      <div
        aria-hidden="true"
        data-hero-orbit
        className="pointer-events-none absolute left-1/2 top-1/4 size-[900px] -translate-x-1/2 rounded-full border border-solid border-[#3c5240]/40"
      />
      <div className={`${shell} relative pb-10 pt-10 sm:pb-12 sm:pt-12`}>
        <div className="relative z-10 mx-auto flex max-w-[1160px] flex-col items-center text-center">
          <p
            data-hero-intro
            className="m-0 flex items-center gap-2 text-sm font-medium text-[#a2b2a5]"
          >
            <span className="size-1.5 rounded-full bg-[#bad7c3]" />A familiar face for your DeFi
          </p>
          <h1
            data-hero-title
            className="mb-8 mt-6 flex flex-wrap justify-center gap-x-[.2em] font-[family-name:var(--font-display)] text-[clamp(58px,9.3vw,132px)] font-medium leading-[.98] tracking-[-.065em]"
          >
            <span className="block overflow-hidden">
              <span data-hero-word className="block">
                Let’s talk
              </span>
            </span>
            <span className="block overflow-hidden text-[#c7d9bc]">
              <span data-hero-word className="block">
                money.
              </span>
            </span>
          </h1>
        </div>
        <div data-hero-pin className="relative">
          <ConversationPreview figures={landingFigures()} />
          <div
            data-hero-intro
            className="absolute bottom-16 left-8 z-10 hidden max-w-[230px] flex-col items-start gap-5 lg:flex"
          >
            <p className="m-0 text-lg leading-relaxed text-[#334e39]">
              Your position.
              <br />
              Your next move.
              <br />
              Plain answers.
            </p>
            <a
              data-magnetic
              href="/play"
              className="group inline-flex items-center gap-4 rounded-full bg-[#203327] px-5 py-3.5 text-sm font-semibold text-[#eff2e8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#203327]"
            >
              Pull up a chair <ArrowUpRight size={18} />
            </a>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-5 text-sm text-[#849b8b]">
          <span className="flex items-center gap-2">
            <Image
              src="/play/tokens/near.svg"
              alt=""
              width={20}
              height={20}
              className="size-5 invert"
            />
            Built on NEAR
          </span>
          <a href="#features" className={`flex items-center gap-2 text-[#adbfaf] ${focus}`}>
            Scroll to discover <ArrowDown size={16} />
          </a>
          <span className="hidden sm:inline">Simulated demo · no real funds</span>
        </div>
      </div>
    </section>
  );
}

const featureCards = [
  {
    asset: "position-orbit",
    title: "The whole picture.",
    text: "Collateral, debt and the buffer between them. Get to know your position without getting lost in a dashboard.",
    span: "lg:col-span-5",
  },
  {
    asset: "decision-route",
    title: "A clearer next move.",
    text: "Compare repaying with supplying spare funds. See the numbers and the assumptions behind a proposal.",
    span: "lg:col-span-3",
  },
  {
    asset: "position-tokens",
    title: "Numbers with context.",
    text: "Your health, rates and balances, explained together. Every financial figure comes from the engine.",
    span: "lg:col-span-4",
  },
  {
    asset: "plain-words",
    title: "Plain words, please.",
    text: "APR, collateral, liquidation. Ask what it means, right where you need to understand it.",
    span: "lg:col-span-3",
  },
  {
    asset: "guardian",
    title: "Your rules come first.",
    text: "Choose limits, reserve and triggers. Guardian is designed to act only within the policy you approve.",
    span: "lg:col-span-4",
  },
  {
    asset: "languages",
    title: "Your way of asking.",
    text: "The product is designed for natural, multilingual conversation. This landing preview uses scripted examples.",
    span: "lg:col-span-5",
  },
];
function Features() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className={shell}>
        <div
          data-reveal
          className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end"
        >
          <div>
            <p className={eyebrow}>
              <Sparkles size={16} />A little less noise
            </p>
            <h2 className={`${heading} mt-5! max-w-[630px]`}>
              Everything makes
              <br />
              more sense together.
            </h2>
          </div>
          <p className="m-0 max-w-[310px] text-base leading-[1.8] text-[#94a59a]">
            A conversation in front.
            <br />
            Careful decisions underneath.
          </p>
        </div>
        <div
          data-feature-grid
          className="grid gap-3 rounded-[32px] border border-solid border-[#2a362e] bg-[#172019] bg-[url(/landing/grid.svg)] p-3 md:grid-cols-2 lg:grid-cols-12"
        >
          {featureCards.map((item, index) => (
            <article
              data-feature-card
              key={item.asset}
              className={`group relative flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-solid border-white/5 bg-[#101713] bg-[url(/landing/grain-dark.svg)] p-6 transition-colors duration-300 hover:border-[#6a846d] ${item.span}`}
            >
              <span
                aria-hidden="true"
                className="absolute right-5 top-4 font-[family-name:var(--font-display)] text-sm text-[#526958]"
              >
                0{index + 1}
              </span>
              <div data-feature-art className="relative mb-6 h-[220px] sm:h-[230px]">
                <div data-float className="relative size-full">
                  <Image
                    src={`/landing/${item.asset}.png`}
                    alt=""
                    fill
                    sizes="(min-width:1024px) 420px, (min-width:768px) 45vw, 90vw"
                    className="object-contain transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transform-none"
                  />
                </div>
              </div>
              <h3
                className={`${display} m-0 text-[26px] font-medium leading-tight tracking-[-1px] text-[#e7eee5]`}
              >
                {item.title}
              </h3>
              <p className="mb-1 mt-3 text-sm leading-[1.85] text-[#9aa99e]">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = ["Your questions", "Your position", "Your next move", "Your peace of mind"];
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-0 border-y border-solid border-[#40513f] bg-[#19271d] py-6"
    >
      <div data-marquee className="flex w-max items-center">
        {[0, 1].map((repeat) => (
          <div key={repeat} className="flex shrink-0 items-center">
            {items.map((text) => (
              <span
                key={text}
                className={`flex items-center gap-8 pr-8 ${display} text-[clamp(24px,3.6vw,48px)] font-medium tracking-[-1.3px] text-[#b6cbb2]`}
              >
                {text}
                <span className="size-3 rotate-45 rounded-[3px] border border-solid border-[#758e6b]" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Walkthrough() {
  return (
    <section
      id="how"
      data-curtain
      className="relative scroll-mt-20 rounded-t-[40px] bg-[#eff0e3] bg-[url(/landing/grain-light.svg)] py-20 text-[#203327] sm:rounded-t-[64px] sm:py-28"
    >
      <div className={shell}>
        <div data-reveal className="mb-14 max-w-[720px]">
          <p className="m-0 flex items-center gap-2 text-sm font-medium text-[#73816a]">
            <span className="size-1.5 rounded-full bg-[#69815b]" />
            Less staring. More understanding.
          </p>
          <h2 className={`${heading} mt-5!`}>
            It starts with
            <br />a simple question.
          </h2>
          <p className="mb-0 mt-6 max-w-[520px] text-lg leading-[1.8] text-[#7b8872]">
            Ask naturally. Understand the numbers. Make the call.
          </p>
        </div>
        <div>
          <ScrollJourney f={landingFigures()} />
        </div>
      </div>
    </section>
  );
}

function PhoneSection() {
  return (
    <section
      id="mobile"
      className="relative overflow-hidden bg-[#111713] bg-[url(/landing/grid.svg)] py-20 sm:py-28"
    >
      <div className={`${shell} grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-24`}>
        <div data-reveal className="max-w-[540px]">
          <p className={eyebrow}>
            <MessageCircle size={17} />A conversation you can carry
          </p>
          <h2 className={`${heading} mt-5!`}>
            Small screen.
            <br />
            <span className="text-[#c1d5b5]">Same Mr.Fund.</span>
          </h2>
          <p className="mb-0 mt-7 text-lg leading-[1.8] text-[#9aab9f]">
            Mr.Fund, your questions, and a little more clarity. Wherever you are.
          </p>
          <a href="/play" className={`${cta} mt-7`}>
            Meet him on your screen <ArrowUpRight size={18} />
          </a>
        </div>
        <div data-phone-stage className="relative mx-auto w-full max-w-[430px]">
          <div
            aria-hidden="true"
            className="absolute inset-x-[-25%] top-1/4 aspect-square rounded-full border border-solid border-[#344d3a]"
          />
          <div
            aria-hidden="true"
            data-orbit
            className="pointer-events-none absolute inset-x-[-12%] top-[30%] aspect-square rounded-full border border-dashed border-[#2d4432]"
          >
            <span className="absolute right-0 top-1/3 size-4 rounded-full bg-[#a6bd99]" />
          </div>
          <PhonePreview figures={landingFigures()} />
        </div>
      </div>
    </section>
  );
}

function GuardianSection() {
  return (
    <section
      id="guardian"
      data-curtain
      className="relative scroll-mt-20 overflow-hidden bg-[#e1e7d6] bg-[url(/landing/grain-light.svg)] py-20 text-[#203327] sm:py-28"
    >
      <div className={`${shell} grid items-center gap-12 lg:grid-cols-2 lg:gap-20`}>
        <div data-reveal className="relative order-2 lg:order-1">
          <div className="relative mx-auto aspect-[1.2] max-w-[520px]">
            <div
              aria-hidden="true"
              className="absolute inset-[8%] rounded-full border border-solid border-[#bbc9ad]"
            />
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
          <div className="relative -mt-5 flex flex-wrap justify-center gap-3">
            {["Your reserve", "Your limits", "Your permission"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-solid border-[#b4c1a6] px-4 py-2.5 text-sm text-[#607654]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <div data-reveal className="order-1 lg:order-2">
          <p className="m-0 flex items-center gap-2 text-sm font-medium text-[#708164]">
            <ShieldCheck size={18} />
            Meet Guardian
          </p>
          <h2 className={`${heading} mt-5!`}>
            Boundaries.
            <br />
            Built in.
          </h2>
          <p className="mb-0 mt-7 text-lg leading-[1.8] text-[#6e7f63]">
            Set the reserve, repayment limits and trigger. The live design puts your policy in a
            contract, so a conversation can’t grant itself permission.
          </p>
          <div className="mt-7 space-y-4">
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
              <div key={title} className="flex items-start gap-3">
                <Icon size={19} className="mt-1 shrink-0 text-[#687e5c]" />
                <div>
                  <h3 className="m-0 text-base font-semibold">{title}</h3>
                  <p className="mb-0 mt-1 text-sm leading-relaxed text-[#7a8c70]">{text}</p>
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
    <section className="relative overflow-hidden rounded-t-[40px] bg-[#eee8d8] bg-[url(/landing/grain-light.svg)] py-20 text-center text-[#263a2c] sm:rounded-t-[64px] sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 size-[460px] rounded-full border border-solid border-[#ccd1bc]"
      />
      <div
        aria-hidden="true"
        data-orbit
        className="pointer-events-none absolute -bottom-52 -right-32 size-[600px] rounded-full border border-dashed border-[#c3ccb5]"
      >
        <span className="absolute left-10 top-20 size-7 rounded-full bg-[#b8c8a9]" />
      </div>
      <div data-reveal className={`${shell} relative flex flex-col items-center`}>
        <Mascot size={110} className="mb-5 size-24" />
        <p className="m-0 text-sm font-medium text-[#7b8b6e]">Your next move starts here</p>
        <h2
          className={`${display} my-6 text-[clamp(44px,6vw,84px)] font-medium leading-[1.03] tracking-[-.05em]`}
        >
          Say hello to
          <br />
          clearer thinking.
        </h2>
        <p className="m-0 max-w-[520px] text-lg leading-[1.8] text-[#7f8d73]">
          A little less guessing. A little more understanding.
          <br />
          Pull up a chair. Mr.Fund is here.
        </p>
        <a
          href="/play"
          className={`group mt-8 inline-flex min-h-14 items-center gap-7 rounded-full bg-[#203327] px-7 py-4 text-base font-semibold text-[#edf2e3] transition-transform hover:-translate-y-1 ${focus}`}
        >
          Start consultation <ArrowUpRight size={20} />
        </a>
        <p className="mb-0 mt-5 text-sm text-[#87917c]">
          Mock wallet · no real funds · no signature needed
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="overflow-hidden">
      <div
        className={`${shell} flex flex-col justify-between gap-6 py-10 text-sm text-[#7f9386] sm:flex-row`}
      >
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[#acc69f]" />
          Built for the NEAR Hackathon 2026
        </span>
        <div className="flex flex-wrap items-center gap-6">
          <a href="#how" className={`text-[#a5b7aa] ${focus}`}>
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
        <Walkthrough />
        <PhoneSection />
        <GuardianSection />
        <Closing />
      </main>
      <Footer />
    </LandingMotion>
  );
}
