import { ArrowUpRight, Copy, LoaderCircle, LockKeyhole, LogOut, Wallet } from "lucide-react";
import Image from "next/image";
import { amount } from "./display";
import { ModalFrame } from "./ModalFrame";
import { ProvenanceTag } from "./ProvenanceTag";
import type { Port, SessionView } from "./source/types";

interface Props extends SessionView {
  stage: "welcome" | "consult";
  port: Port;
  close: () => void;
  connect: () => void;
  disconnect: () => void;
  setNotice: (text: string) => void;
}
export function WalletDialog({
  connected,
  connecting,
  walletBalance,
  stage,
  port,
  close,
  connect,
  disconnect,
  setNotice,
}: Props) {
  return (
    <ModalFrame
      wallet
      eyebrow="YOUR CONSULTATION"
      title={
        connected ? "Your mock wallet." : stage === "welcome" ? "Connect to begin." : "Come on in."
      }
      close={() => close()}
    >
      <span className="mt-5 inline-flex items-center gap-2 text-[9px] font-medium tracking-[.08em] text-[#a2a4a5]">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-[#bad7c3]" />
        <ProvenanceTag port={port} label="NETWORK · TESTNET · SIMULATED" />
      </span>
      <p className="mt-4! max-w-[320px] text-[13px] leading-[1.8] text-[#a2a4a5]">
        {connected
          ? "Connected to a local demo identity. These tokens are simulated balances."
          : "Meet Mr.Fund with a demo wallet. No setup or signature needed."}
      </p>
      {connected ? (
        <>
          <div className="wallet-account flex items-center gap-[10px] p-[16px_0_24px] [&_b]:text-[12px] [&_small]:text-[10px] [&_small]:text-[#a2a4a5] [&_small]:block [&_small]:mt-[5px] [&_.icon-button]:ml-auto">
            <span className="wallet-avatar h-[40px] w-[40px] bg-[var(--lime)] text-[#101a17]! grid place-items-center rounded-full font-[family-name:var(--font-display)] text-[21px]">
              Y
            </span>
            <div>
              <b>you.demo.testnet</b>
              <small>{amount(walletBalance)} test USDC available</small>
            </div>
            <button
              type="button"
              className="icon-button inline-flex items-center justify-center border-0 bg-transparent w-[32px] h-[32px] rounded-full p-0 [transition:background_.18s] [&:hover]:bg-[#8080801a]"
              aria-label="Copy mock account"
              onClick={() => {
                navigator.clipboard?.writeText("you.demo.testnet");
                setNotice("Mock account copied.");
              }}
            >
              <Copy size={16} />
            </button>
          </div>
          <button
            type="button"
            className="button border-0 inline-flex items-center justify-center gap-[12px] p-[13px_17px] min-h-[43px] rounded-[9px] text-[11px]! font-bold! [transition:transform_.17s,background_.17s,box-shadow_.17s] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-none [&:active:not(:disabled)]:transform-[translateY(0)] [&.small]:p-[10px_13px] [&.small]:min-h-[35px] [&.small]:text-[10px]! [&.small]:gap-[8px] [&.small]:rounded-[7px] outline-button [border:1px_solid_#313334] bg-transparent [&:hover]:bg-[#ffffff40] full-width w-full"
            onClick={disconnect}
          >
            <LogOut size={17} />
            Disconnect mock wallet
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            aria-label={connecting ? "Connecting demo wallet" : "Connect demo wallet"}
            className="group relative mt-7 flex w-full flex-col items-stretch gap-6 overflow-hidden rounded-[22px] border-0 bg-[#d3e5d7] p-5 text-left text-[#203327] transition-colors hover:bg-[#e1efe4] disabled:cursor-wait sm:p-6"
            disabled={connecting}
            onClick={connect}
          >
            <div className="flex items-start justify-between">
              {connecting ? (
                <LoaderCircle size={30} className="animate-spin" />
              ) : (
                <Wallet size={30} strokeWidth={1.4} />
              )}
              <span className="text-[9px] font-semibold uppercase tracking-[.15em] text-[#52685b]">
                Demo access / 01
              </span>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <b className="block font-[family-name:var(--font-display)] text-[25px] font-medium leading-tight tracking-[-.8px]">
                  Demo wallet
                </b>
                <small className="mt-2 block text-[11px] text-[#52685b]">
                  {connecting
                    ? "Connecting to the simulated testnet…"
                    : "1,000 test USDC · instant connection"}
                </small>
              </div>
              <ArrowUpRight
                size={26}
                strokeWidth={1.5}
                className="mb-1 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none"
              />
            </div>
          </button>
          <div className="pb-2 pt-7">
            <p className="text-center text-[11px] text-[#858d89]">Your own wallet, next.</p>
            <div className="mx-auto mt-5 grid max-w-[280px] grid-cols-3 gap-6">
              {[
                { name: "Meteor", logo: "/play/wallets/meteor.svg", treatment: "" },
                { name: "Intear", logo: "/play/wallets/intear.svg", treatment: "" },
                { name: "NEAR", logo: "/play/tokens/near.svg", treatment: "invert" },
              ].map((provider) => (
                <span
                  key={provider.name}
                  className="flex flex-col items-center gap-3 text-[11px] font-medium text-[#bbc3be]"
                >
                  <Image
                    src={provider.logo}
                    alt=""
                    width={40}
                    height={40}
                    className={`size-10 object-contain ${provider.treatment}`}
                  />
                  {provider.name}
                </span>
              ))}
            </div>
            <p className="mt-5! text-center text-[10px] text-[#747c78]">
              Coming with the live integration
            </p>
          </div>
        </>
      )}
      <p className="mt-6! flex items-center justify-center gap-2 text-[10px] leading-relaxed text-[#8b948f]">
        <LockKeyhole size={12} />
        Mr.Fund never asks for your private key.
      </p>
    </ModalFrame>
  );
}
