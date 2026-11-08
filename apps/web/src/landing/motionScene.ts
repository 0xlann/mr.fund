import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

/** One scroll clock for this route; every pin, listener and ticker is released on exit. */
export function mountLandingMotion(root: HTMLElement, progress: HTMLElement | null) {
  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({
    autoRaf: false,
    lerp: 0.085,
    smoothWheel: true,
    syncTouch: false,
    anchors: { offset: -92 },
    allowNestedScroll: true,
  });
  const tick = (time: number) => lenis.raf(time * 1000);
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(tick);
  const media = gsap.matchMedia();
  const releases: (() => void)[] = [];
  const loops: { tween: gsap.core.Tween; trigger: ScrollTrigger }[] = [];
  let disposed = false;
  const context = gsap.context(() => {
    const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
    intro
      .fromTo(
        "[data-hero-word]",
        { yPercent: 115, rotate: 3 },
        { yPercent: 0, rotate: 0, duration: 1.25, stagger: 0.14 },
      )
      .fromTo(
        "[data-hero-intro]",
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.75, stagger: 0.08 },
        0.45,
      );
    for (const el of root.querySelectorAll<HTMLElement>("[data-reveal]")) {
      gsap.fromTo(
        el,
        { y: 64, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.95,
          ease: "power3.out",
          clearProps: "transform,opacity,visibility",
          scrollTrigger: { trigger: el, start: "top 91%", once: true },
        },
      );
    }
    for (const rule of root.querySelectorAll<HTMLElement>("[data-rule]"))
      gsap.fromTo(
        rule,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: { trigger: rule, start: "top 92%", once: true },
        },
      );
    const seal = root.querySelector("[data-hero-seal]");
    if (seal)
      gsap.to(seal, {
        rotation: 10,
        y: -24,
        ease: "none",
        scrollTrigger: { trigger: seal, start: "top 30%", end: "+=600", scrub: 0.8 },
      });
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-feature-card]"));
    for (const [index, card] of cards.entries()) {
      gsap.fromTo(
        card,
        { y: 110, scale: 0.94, autoAlpha: 0, rotate: index % 2 ? 2 : -2 },
        {
          y: 0,
          scale: 1,
          rotate: 0,
          autoAlpha: 1,
          delay: (index % 3) * 0.07,
          duration: 1.05,
          ease: "power3.out",
          clearProps: "transform,opacity,visibility",
          scrollTrigger: { trigger: card, start: "top 94%", once: true },
        },
      );
      const art = card.querySelector("[data-feature-art]");
      if (art)
        gsap.fromTo(
          art,
          { y: 16 },
          {
            y: -24,
            ease: "none",
            scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 0.7 },
          },
        );
    }
    for (const el of root.querySelectorAll<HTMLElement>(
      "[data-float], [data-orbit], [data-marquee]",
    )) {
      const marquee = el.hasAttribute("data-marquee"),
        orbit = el.hasAttribute("data-orbit");
      const tween = gsap.to(
        el,
        marquee
          ? { xPercent: -50, duration: 30, ease: "none", repeat: -1, paused: true }
          : orbit
            ? { rotation: 360, duration: 48, ease: "none", repeat: -1, paused: true }
            : {
                y: -13,
                rotation: 1.5,
                duration: 3.1 + (loops.length % 3),
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1,
                paused: true,
              },
      );
      const trigger = ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onToggle: (state) => {
          if (state.isActive && !document.hidden) tween.play();
          else tween.pause();
        },
      });
      if (trigger.isActive) tween.play();
      loops.push({ tween, trigger });
    }
    for (const section of root.querySelectorAll<HTMLElement>("[data-curtain]"))
      gsap.fromTo(
        section,
        { clipPath: "inset(0 4% 0 4% round 54px)" },
        {
          clipPath: "inset(0 0% 0 0% round 0px)",
          ease: "none",
          scrollTrigger: { trigger: section, start: "top 94%", end: "top 18%", scrub: 0.7 },
        },
      );
    if (progress)
      gsap.fromTo(
        progress,
        { scaleX: 0 },
        { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } },
      );
    media.add(
      {
        large: "(min-width: 1024px) and (min-height: 760px)",
        small: "(max-width: 1023px), (max-height: 759px)",
      },
      (ctx) => {
        const large = ctx.conditions?.large;
        const hero = root.querySelector<HTMLElement>("[data-hero]"),
          heroWindow = root.querySelector<HTMLElement>("[data-hero-window]"),
          visual = root.querySelector<HTMLElement>("[data-hero-pin]");
        if (hero) {
          gsap.to("[data-hero-title]", {
            y: large ? 90 : 36,
            opacity: 0.15,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "center top", scrub: 0.7 },
          });
          const orbit = root.querySelector("[data-hero-orbit]");
          if (orbit)
            gsap.to(orbit, {
              rotation: 70,
              scale: 1.25,
              ease: "none",
              scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1 },
            });
        }
        if (large && visual && heroWindow) {
          const canPin = visual.offsetHeight + 128 <= window.innerHeight;
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: visual,
              start: canPin ? "top 104px" : "top 25%",
              end: "+=360",
              pin: canPin,
              scrub: 0.8,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
          timeline
            .to(heroWindow, { scale: 1.025, duration: 1, ease: "none" }, 0)
            .fromTo("[data-hero-chat]", { y: 20 }, { y: -12, duration: 1, ease: "none" }, 0);
        }
        const pin = root.querySelector<HTMLElement>("[data-stack-pin]");
        if (pin) {
          const layers = Array.from(pin.querySelectorAll<HTMLElement>("[data-stack-card]"));
          if (large) {
            gsap.set(pin, { height: "min(600px, calc(100svh - 144px))" });
            gsap.set(layers, {
              position: "absolute",
              inset: 0,
              margin: 0,
              minHeight: 0,
              transformOrigin: "50% 0%",
            });
            for (const [index, layer] of layers.entries())
              gsap.set(layer, { yPercent: index === 0 ? 0 : 112, zIndex: index + 1 });
            const timeline = gsap.timeline({
              scrollTrigger: {
                trigger: pin,
                start: "top 104px",
                end: () => `+=${window.innerHeight * 1.8}`,
                pin: true,
                scrub: 0.8,
                anticipatePin: 1,
                invalidateOnRefresh: true,
              },
            });
            for (let index = 1; index < layers.length; index++) {
              const current = layers[index],
                previous = layers[index - 1];
              if (!current || !previous) continue;
              timeline
                .to(current, { yPercent: 0, duration: 1, ease: "power1.inOut" }, index - 1)
                .to(previous, { scale: 0.94, yPercent: -4, opacity: 0.55, duration: 1 }, index - 1);
            }
          } else
            for (const layer of layers)
              gsap.fromTo(
                layer,
                { y: 65, scale: 0.96 },
                {
                  y: 0,
                  scale: 1,
                  ease: "none",
                  scrollTrigger: { trigger: layer, start: "top 97%", end: "top 42%", scrub: 0.5 },
                },
              );
        }
        const phone = root.querySelector<HTMLElement>("[data-phone-stage]");
        if (phone)
          gsap.fromTo(
            phone,
            { y: 90, rotation: large ? 7 : 0 },
            {
              y: -20,
              rotation: large ? -3 : 0,
              ease: "none",
              scrollTrigger: {
                trigger: phone,
                start: "top bottom",
                end: "center center",
                scrub: 0.9,
              },
            },
          );
      },
    );
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      for (const el of root.querySelectorAll<HTMLElement>("[data-magnetic]")) {
        const x = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" }),
          y = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
        const move = (event: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          x((event.clientX - rect.left - rect.width / 2) * 0.15);
          y((event.clientY - rect.top - rect.height / 2) * 0.2);
        };
        const leave = () => {
          x(0);
          y(0);
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        releases.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      }
  }, root);
  const visibility = () => {
    for (const loop of loops)
      loop.trigger.isActive && !document.hidden ? loop.tween.play() : loop.tween.pause();
  };
  document.addEventListener("visibilitychange", visibility);
  const refresh = () => {
    if (!disposed) ScrollTrigger.refresh();
  };
  document.fonts?.ready.then(refresh);
  const refreshFrame = requestAnimationFrame(refresh);
  return () => {
    disposed = true;
    cancelAnimationFrame(refreshFrame);
    document.removeEventListener("visibilitychange", visibility);
    for (const release of releases) release();
    media.revert();
    context.revert();
    lenis.off("scroll", ScrollTrigger.update);
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}
