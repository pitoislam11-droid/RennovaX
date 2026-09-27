import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';

import { setDialogListener, type DialogRequest } from '@/lib/dialog';
import { colors, radius, type } from '@/theme';

/** Web-only stand-in for the native alert sheet. */
export function DialogHost() {
  const [request, setRequest] = useState<DialogRequest | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    setDialogListener(setRequest);
    return () => setDialogListener(null);
  }, []);

  if (!request) return null;
  const close = () => setRequest(null);
  // Primary actions first, cancel last, like an iOS action sheet.
  const ordered = [...request.buttons.filter((b) => b.style !== 'cancel'), ...request.buttons.filter((b) => b.style === 'cancel')];

  return (
    <Modal transparent animationType="fade" onRequestClose={close}>
      <Pressable onPress={close} accessibilityLabel="Close dialog" style={{ flex: 1, backgroundColor: 'rgba(14,15,18,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Pressable onPress={() => undefined} style={{ width: '100%', maxWidth: 340, backgroundColor: colors.surface, borderRadius: radius.xl, padding: 20, gap: 14 }}>
          <View style={{ gap: 6 }}>
            <Text style={[type.subheading, { textAlign: 'center' }]}>{request.title}</Text>
            {request.message ? <Text style={[type.body, { textAlign: 'center' }]}>{request.message}</Text> : null}
          </View>
          <View style={{ gap: 8 }}>
            {ordered.map((b, i) => {
              const primary = i === 0 && b.style !== 'cancel';
              return (
                <Pressable
                  key={`${b.text}-${i}`}
                  accessibilityRole="button"
                  onPress={() => {
                    close();
                    b.onPress?.();
                  }}
                  style={{ height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: primary ? colors.black : colors.sunk }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: primary ? '#fff' : b.style === 'destructive' ? colors.danger : colors.ink }}>{b.text}</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
