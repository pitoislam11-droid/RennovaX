import { Alert, Platform, type AlertButton } from 'react-native';

export interface DialogRequest {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

type Listener = (request: DialogRequest) => void;
let listener: Listener | null = null;

/** Registered by <DialogHost />, which draws dialogs on web. */
export function setDialogListener(fn: Listener | null): void {
  listener = fn;
}

/**
 * Alert.alert on iOS and Android. React Native Web has no Alert (and embedded browsers often
 * block window.confirm), so on web the same call is drawn in-app by <DialogHost />.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  listener?.({ title, message, buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }] });
}
