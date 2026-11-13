"use client";

import { useEffect, useRef, useState } from "react";
import { createReplyController } from "./replyController";

export { stripReplyMarkup } from "./replyController";

export function useReplySpeech(sound: boolean) {
  const [speaking, setSpeaking] = useState(false);
  const controller = useRef(createReplyController(setSpeaking)).current;
  useEffect(() => {
    if (!sound) controller.cancel();
  }, [controller, sound]);
  useEffect(() => () => controller.cancel(), [controller]);
  return { ...controller, speaking };
}

export function useLiveReplySpeech(
  message: { id: number; text: string; lang: string } | null,
  sound: boolean,
) {
  const speech = useReplySpeech(sound);
  const seen = useRef(new Set<number>());
  useEffect(
    () => () => {
      seen.current.clear();
    },
    [],
  );
  const id = message?.id;
  const text = message?.text;
  const lang = message?.lang;
  const { play, cancel } = speech;
  useEffect(() => {
    if (id === undefined || text === undefined || lang === undefined) {
      cancel();
      return;
    }
    if (seen.current.has(id)) return;
    seen.current.add(id);
    if (!sound) return;
    play(id, text, lang, true, false);
  }, [id, text, lang, sound, play, cancel]);
  return { speaking: speech.speaking, cue: speech.cue };
}
