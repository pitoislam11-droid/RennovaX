import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { FadeInDown, useReducedMotion } from 'react-native-reanimated';

/** Occasional first-paint entrance — skip when reduced motion is on. */
export function useQuietEntrance() {
  const reduceMotion = useReducedMotion();
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReduceMotion);
    return () => sub.remove();
  }, []);

  const quiet = reduceMotion || systemReduceMotion;

  const enter = (delay = 0) =>
    quiet ? undefined : FadeInDown.delay(delay).duration(400).springify().damping(24);

  return { quiet, enter };
}
