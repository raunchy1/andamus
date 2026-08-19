"use client";

import { useEffect, useRef, useState } from "react";

export interface VisualViewportState {
  /** Height of the visual viewport (area not covered by the on-screen keyboard). */
  height: number | null;
  /** Offset of the visual viewport from the top of the layout viewport. */
  offsetTop: number;
  /** True while the on-screen keyboard (or another interactive widget) is shown. */
  keyboardOpen: boolean;
  /** Pixels the keyboard eats from the tallest viewport observed while active. */
  keyboardHeight: number;
}

const KEYBOARD_THRESHOLD = 150;

/**
 * Tallest visual viewport seen in this document. Kept at module level so a
 * sheet that opens with the keyboard already up still has a keyboard-free
 * reference to compare against.
 */
let sessionBaseline = 0;

/**
 * Tracks the visual viewport so overlays can be sized against the space that is
 * actually visible instead of the layout viewport.
 *
 * The keyboard is detected against the tallest viewport seen since `active`
 * became true rather than against `window.innerHeight`: with
 * `interactive-widget: resizes-content` the layout viewport shrinks together
 * with the visual one, so comparing the two never reports an open keyboard.
 */
export function useVisualViewport(active: boolean): VisualViewportState {
  const baselineRef = useRef<number | null>(null);
  const [state, setState] = useState<VisualViewportState>({
    height: null,
    offsetTop: 0,
    keyboardOpen: false,
    keyboardHeight: 0,
  });

  useEffect(() => {
    if (!active) {
      baselineRef.current = null;
      const vvIdle = typeof window !== "undefined" ? window.visualViewport : undefined;
      if (vvIdle) sessionBaseline = Math.max(sessionBaseline, vvIdle.height);
      setState({ height: null, offsetTop: 0, keyboardOpen: false, keyboardHeight: 0 });
      return;
    }

    const vv = typeof window !== "undefined" ? window.visualViewport : undefined;
    if (!vv) return;

    const measure = () => {
      const height = vv.height;
      const baseline = Math.max(baselineRef.current ?? 0, sessionBaseline, height);
      baselineRef.current = baseline;
      sessionBaseline = baseline;

      const keyboardHeight = Math.max(0, baseline - height);
      setState({
        height,
        offsetTop: vv.offsetTop,
        keyboardOpen: keyboardHeight > KEYBOARD_THRESHOLD,
        keyboardHeight,
      });
    };

    measure();
    vv.addEventListener("resize", measure);
    vv.addEventListener("scroll", measure);
    return () => {
      vv.removeEventListener("resize", measure);
      vv.removeEventListener("scroll", measure);
    };
  }, [active]);

  return state;
}
