import type { SpeechCue } from "../speechVisemes";

export function stripReplyMarkup(text: string): string {
  return text.replace(/\*\*/g, "").replace(/^[ \t]*(?:[-*] |\d+\. )/gm, "");
}

export function createReplyController(update: (speaking: boolean) => void) {
  const cue: { current: SpeechCue } = { current: { id: 0, text: "", charIndex: null } };
  let active: { id: number; textDone: boolean; audioDone: boolean } | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function cancel() {
    const wasActive = active !== null && !active.audioDone;
    active = null;
    clearTimeout(timer);
    timer = undefined;
    if (wasActive && typeof window !== "undefined" && window.speechSynthesis)
      window.speechSynthesis.cancel();
    update(false);
  }
  function finishAudio(id: number) {
    if (!active || active.id !== id) return;
    active.audioDone = true;
    clearTimeout(timer);
    timer = undefined;
    if (active.textDone) update(false);
  }
  function finishText(id: number) {
    if (!active || active.id !== id) return;
    active.textDone = true;
    if (active.audioDone) update(false);
  }
  function play(id: number, text: string, lang: string, sound: boolean, waitForText: boolean) {
    cancel();
    const clean = stripReplyMarkup(text);
    cue.current = { id, text: clean, charIndex: null };
    const supported =
      sound &&
      typeof window !== "undefined" &&
      !!window.speechSynthesis &&
      typeof SpeechSynthesisUtterance !== "undefined";
    active = { id, textDone: !waitForText, audioDone: !supported };
    if (waitForText || supported) update(true);
    if (!supported) return;
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.onstart = () => {
      if (active?.id === id && !active.audioDone) update(true);
    };
    utterance.onboundary = (event) => {
      if (active?.id === id && event.name === "word") cue.current.charIndex = event.charIndex;
    };
    utterance.onend = () => finishAudio(id);
    utterance.onerror = () => finishAudio(id);
    timer = setTimeout(
      () => {
        if (active?.id === id && !active.audioDone) window.speechSynthesis.cancel();
        finishAudio(id);
      },
      Math.min(90000, Math.max(10000, clean.length * 110)),
    );
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      finishAudio(id);
    }
  }
  return { cue, play, finishText, cancel };
}
