/**
 * Haptic feedback utilities for mobile UX.
 * Uses the Vibration API when available.
 */

export const Haptic = {
  /** Light tap — for button presses */
  light: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  },
  /** Medium feedback — for successful actions */
  success: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([20, 30, 20]);
    }
  },
  /** Error feedback — for failures/warnings */
  error: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40, 20, 40]);
    }
  },
  /** Heavy impact — for important confirmations */
  heavy: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  },
};
