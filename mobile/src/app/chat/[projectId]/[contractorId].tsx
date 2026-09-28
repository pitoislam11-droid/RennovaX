import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassIconButton } from '@/components/Glass';
import { relativeTime } from '@/components/marketplace';
import { Avatar, Button, EmptyState, Header, Row, Screen } from '@/components/ui';
import { newId } from '@/data/reducer';
import { canRequestCall, canSeeHomeownerContact, contractorMayCall } from '@/data/rules';
import { useStore } from '@/data/store';
import { showAlert } from '@/lib/dialog';
import { askToBlock, askToReport } from '@/lib/safety';
import { colors, GUTTER, radius, type } from '@/theme';

export default function Conversation() {
  const { projectId, contractorId } = useLocalSearchParams<{ projectId: string; contractorId: string }>();
  const { state, viewer, dispatch, project: getProject, contractor } = useStore();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const [text, setText] = useState('');
  const project = getProject(projectId);
  const c = contractor(contractorId);
  const thread = state.threads.find((t) => t.projectId === projectId && t.contractorId === contractorId);
  const messages = thread?.messages ?? [];

  useEffect(() => {
    scroll.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  if (!project || !c) {
    return (
      <Screen>
        <Header />
        <EmptyState icon="chatbubbles-outline" title="Conversation not found" body="" />
      </Screen>
    );
  }

  const me = state.session.role;
  const owner = state.homeowners.find((h) => h.id === project.ownerId)!;
  const isAllowed = me === 'homeowner' ? viewer.role === 'homeowner' && viewer.homeownerId === project.ownerId : viewer.role === 'contractor' && viewer.contractorId === contractorId;
  if (!isAllowed) {
    return (
      <Screen>
        <Header />
        <EmptyState icon="lock-closed-outline" title="Private conversation" body="Only the homeowner and this contractor can see it." />
      </Screen>
    );
  }

  const requests = state.callRequests.filter((r) => r.projectId === project.id && r.contractorId === c.id);
  const pending = requests.find((r) => r.status === 'pending');
  const mayCall = contractorMayCall(c.id, project, state.callRequests);

  const send = () => {
    dispatch({ type: 'sendMessage', id: newId('m'), projectId: project.id, contractorId: c.id, from: me, text, at: new Date().toISOString() });
    setText('');
  };

  const onCall = () => {
    if (me === 'homeowner') {
      // The homeowner can always choose to call a contractor themselves.
      Linking.openURL(`tel:${c.phone.replace(/\s/g, '')}`).catch(() => showAlert(`Call ${c.name}`, c.phone));
      return;
    }
    if (mayCall && canSeeHomeownerContact(viewer, project)) {
      Linking.openURL(`tel:${owner.phone.replace(/\s/g, '')}`).catch(() => showAlert(`Call ${owner.firstName}`, owner.phone));
      return;
    }
    if (mayCall) {
      showAlert('Call approved', `${owner.firstName} approved a call. In the live app this connects through a masked number, so their real number stays private.`);
      return;
    }
    if (pending) {
      showAlert('Call requested', `Waiting for ${owner.firstName} to respond. You can keep messaging meanwhile.`);
      return;
    }
    if (!canRequestCall(c.id, project, state.callRequests)) return;
    showAlert(`Request a call with ${owner.firstName}?`, `${owner.firstName} will be asked to approve. Their number stays hidden unless they do.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Request call',
        onPress: () =>
          dispatch({ type: 'requestCall', id: newId('cr'), projectId: project.id, contractorId: c.id, note: `${c.name} would like a quick call about your project.`, at: new Date().toISOString() }),
      },
    ]);
  };

  const title = me === 'homeowner' ? c.name : owner.firstName;
  // The other person in this conversation, as a member id.
  const otherId = me === 'homeowner' ? c.ownerId : owner.id;
  const blocked = state.blockedIds.includes(otherId);

  const more = () =>
    showAlert(title, undefined, [
      {
        text: `Report ${title}`,
        onPress: () => (me === 'homeowner' ? askToReport(dispatch, 'contractor', c.id, c.name) : askToReport(dispatch, 'profile', owner.id, owner.firstName)),
      },
      blocked
        ? { text: `Unblock ${title}`, onPress: () => dispatch({ type: 'unblock', profileId: otherId }) }
        : { text: `Block ${title}`, style: 'destructive' as const, onPress: () => askToBlock(dispatch, otherId, title) },
      { text: 'Cancel', style: 'cancel' as const },
    ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top + 8, backgroundColor: colors.bg }}>
        <Row style={{ paddingHorizontal: GUTTER, paddingBottom: 12 }}>
          <GlassIconButton icon="chevron-back" label="Back" onPress={() => router.back()} />
          <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => me === 'homeowner' && router.push(`/contractor/${c.id}`)}>
            {me === 'homeowner' ? <Avatar initials={c.initials} color={c.logoColor} size={38} /> : <Avatar initials={owner.firstName[0]} color="#5B6270" size={38} />}
            <View style={{ flex: 1 }}>
              <Text style={type.bodyStrong} numberOfLines={1}>{title}</Text>
              <Text style={type.caption} numberOfLines={1}>{project.title}</Text>
            </View>
          </Pressable>
          <GlassIconButton
            icon={me === 'contractor' && !mayCall ? (pending ? 'hourglass-outline' : 'call-outline') : 'call'}
            label={me === 'contractor' && !mayCall ? 'Request call' : 'Call'}
            onPress={onCall}
          />
          <GlassIconButton icon="ellipsis-horizontal" label="More options" onPress={more} />
        </Row>
      </View>

      <ScrollView ref={scroll} contentContainerStyle={{ padding: GUTTER, gap: 8 }} keyboardDismissMode="interactive">
        <Row gap={6} style={{ justifyContent: 'center', marginBottom: 8 }}>
          <Ionicons name="lock-closed-outline" size={13} color={colors.ink3} />
          <Text style={type.caption}>
            {me === 'homeowner' ? 'Your number is hidden. You decide who can call.' : `${owner.firstName}'s number is shared only if they approve a call or choose you.`}
          </Text>
        </Row>
        {messages.map((m) => {
          const mine = m.from === me;
          return (
            <Pressable
              key={m.id}
              onLongPress={mine ? undefined : () => askToReport(dispatch, 'message', m.id, 'this message')}
              accessibilityHint={mine ? undefined : 'Long press to report'}
              style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%', gap: 2 }}>
              <View
                style={{
                  backgroundColor: mine ? colors.black : colors.surface,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 20,
                  borderBottomRightRadius: mine ? 6 : 20,
                  borderBottomLeftRadius: mine ? 20 : 6,
                }}>
                <Text style={{ fontSize: 15, lineHeight: 21, color: mine ? '#fff' : colors.ink }}>{m.text}</Text>
              </View>
              <Text style={[type.caption, { alignSelf: mine ? 'flex-end' : 'flex-start' }]}>{relativeTime(m.at)}</Text>
            </Pressable>
          );
        })}
        {(blocked ? [] : requests).map((r) => (
          <View key={r.id} style={{ alignSelf: 'center', backgroundColor: colors.sunk, borderRadius: radius.md, padding: 12, marginTop: 4 }}>
            <Text style={[type.meta, { textAlign: 'center' }]}>
              {r.status === 'pending' && (me === 'homeowner' ? `${c.name} asked to call you.` : 'You requested a call. Waiting for a response.')}
              {r.status === 'approved' && 'Call approved.'}
              {r.status === 'declined' && (me === 'homeowner' ? 'You declined a call request.' : 'Call request declined. Keep chatting here.')}
              {r.status === 'message_instead' && `${me === 'homeowner' ? 'You' : owner.firstName} chose to message instead.`}
            </Text>
            {r.status === 'pending' && me === 'homeowner' ? (
              <Button label="Review request" small variant="secondary" onPress={() => router.push(`/call/${r.id}`)} style={{ marginTop: 8 }} />
            ) : null}
          </View>
        ))}
      </ScrollView>

      {blocked ? (
        <View style={{ padding: GUTTER, paddingBottom: Math.max(insets.bottom, 16), gap: 10, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line }}>
          <Text style={[type.meta, { textAlign: 'center' }]}>You blocked {title}. Neither of you can send messages here.</Text>
          <Button label={`Unblock ${title}`} variant="secondary" small onPress={() => dispatch({ type: 'unblock', profileId: otherId })} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={`Message ${title}`}
            placeholderTextColor={colors.ink3}
            multiline
            accessibilityLabel="Message"
            style={{ flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 16, color: colors.ink }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            disabled={!text.trim()}
            onPress={send}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: text.trim() ? colors.black : colors.line, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-up" size={22} color="#fff" />
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
