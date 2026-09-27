import { MessageThreadsScreen } from '@/components/messages/message-threads-screen';

export default function ContractorMessagesScreen() {
  return (
    <MessageThreadsScreen
      emptyBody="After you send a private quotation, you can message the homeowner here."
      testID="contractor-messages-screen"
    />
  );
}
