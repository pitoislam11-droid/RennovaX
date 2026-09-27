import { Alert, Platform, type AlertButton } from 'react-native';

/**
 * Alert.alert on iOS and Android. React Native Web has no Alert, so on web the same call maps
 * to the browser's alert / confirm / prompt dialogs.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  const text = message ? `${title}\n\n${message}` : title;
  const actions = (buttons ?? []).filter((b) => b.style !== 'cancel');
  if (actions.length <= 1 && (buttons ?? []).length <= 1) {
    window.alert(text);
    actions[0]?.onPress?.();
    return;
  }
  if (actions.length === 1) {
    if (window.confirm(text)) actions[0].onPress?.();
    return;
  }
  const choice = window.prompt(`${text}\n\n${actions.map((a, i) => `${i + 1}. ${a.text}`).join('\n')}\n\nEnter a number:`);
  const picked = actions[Number(choice) - 1];
  picked?.onPress?.();
}
