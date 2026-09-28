import type { Action } from '@/data/reducer';
import type { ReportTarget } from '@/data/types';

import { showAlert } from './dialog';

const REASONS = ['Spam or scam', 'Abusive or offensive', 'Fake or misleading', 'Something else'];

/** Asks why, files the report, and confirms. Rennova's moderators see it; the other person doesn't. */
export function askToReport(dispatch: (a: Action) => void, targetType: ReportTarget, targetId: string, what: string) {
  showAlert(`Report ${what}?`, 'What’s wrong? The person isn’t told who reported them.', [
    ...REASONS.map((reason) => ({
      text: reason,
      onPress: () => {
        dispatch({ type: 'report', targetType, targetId, reason });
        showAlert('Thanks for telling us', 'Our team reviews every report within 24 hours. You can also block them.');
      },
    })),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}

export function askToBlock(dispatch: (a: Action) => void, profileId: string, name: string, onDone?: () => void) {
  showAlert(`Block ${name}?`, `${name} won’t be able to message you, request a call or quote on your projects. They aren’t told.`, [
    {
      text: 'Block',
      style: 'destructive',
      onPress: () => {
        dispatch({ type: 'block', profileId });
        onDone?.();
      },
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
