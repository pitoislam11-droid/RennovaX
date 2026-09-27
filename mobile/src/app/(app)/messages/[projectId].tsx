import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ErrorState, LoadingView } from '@/components/ui/state-view';
import { api } from '@/lib/api/api';
import type { Message, MessageThread } from '@/lib/contracts';
import { colors, typefaces } from '@/lib/design/tokens';
import { useProfile } from '@/lib/profile';
import { queryKeys } from '@/lib/query-keys';

export default function MessageThreadScreen() {
  const params = useLocalSearchParams<{ projectId?: string | string[] }>();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] ?? '' : params.projectId ?? '';
  const profileQuery = useProfile();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');

  const threadQuery = useQuery({
    queryKey: queryKeys.messageThread(projectId),
    queryFn: () => api.get<MessageThread>(`/api/messages/project/${projectId}`),
    enabled: Boolean(projectId),
    refetchInterval: 8000,
  });

  const sendMutation = useMutation({
    mutationFn: (message: string) => api.post<Message, { body: string }>(`/api/messages/project/${projectId}`, { body: message }),
    onSuccess: async () => {
      setBody('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.messageThread(projectId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.messageThreads });
    },
  });

  if (threadQuery.isLoading) return <LoadingView label="Opening conversation…" testID="message-thread-loading" />;
  if (threadQuery.isError || !threadQuery.data) {
    return (
      <SafeAreaView className="flex-1 justify-center px-6" style={{ backgroundColor: colors.canvas }}>
        <ErrorState message={threadQuery.error?.message ?? 'This conversation could not be opened.'} onRetry={() => void threadQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const messages = threadQuery.data.messages;
  const myId = profileQuery.data?.id;

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ backgroundColor: colors.canvas }} testID="message-thread-screen">
      <ScreenHeader subtitle="Project chat" title="Messages" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1" keyboardVerticalOffset={8}>
        <FlatList
          contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 12 }}
          data={messages}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-center text-base" style={{ color: colors.muted, fontFamily: typefaces.medium }}>
                Start the conversation about this project.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.senderId === myId;
            return (
              <View
                className={`mb-3 max-w-[82%] rounded-[22px] px-4 py-3 ${mine ? 'self-end bg-[#1D1D1B]' : 'self-start bg-[#FFFDF8] border border-[#E3DED2]'}`}
                testID={`message-bubble-${item.id}`}
              >
                <Text style={{ color: mine ? colors.paper : colors.ink, fontFamily: typefaces.regular }}>{item.body}</Text>
              </View>
            );
          }}
        />
        <View className="border-t border-[#E8E3D8] bg-[#FFFDF8] px-4 pb-3 pt-3">
          <TextInput
            className="mb-3 min-h-12 rounded-2xl border border-[#E3DED2] px-4 text-base"
            multiline
            onChangeText={setBody}
            placeholder="Write a message"
            placeholderTextColor="#9A958A"
            style={{ color: colors.ink, fontFamily: typefaces.regular, maxHeight: 120 }}
            testID="message-body-input"
            value={body}
          />
          {sendMutation.error ? (
            <Text className="mb-2 text-sm" style={{ color: colors.red, fontFamily: typefaces.medium }}>{sendMutation.error.message}</Text>
          ) : null}
          <Button
            disabled={body.trim().length === 0}
            icon={Send}
            label="Send"
            loading={sendMutation.isPending}
            onPress={() => sendMutation.mutate(body.trim())}
            testID="send-message-button"
            variant="primary"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
