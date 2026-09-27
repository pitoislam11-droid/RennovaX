import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { colors, typefaces } from '@/lib/design/tokens';
import { launchContacts } from '@/lib/launch';

function Section({ title, body }: { title: string; body: string }) {
  return (
    <View className="mb-7">
      <Text className="text-[18px] tracking-[-0.2px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{title}</Text>
      <Text className="mt-2 text-[15px] leading-6" style={{ color: colors.muted, fontFamily: typefaces.regular }}>{body}</Text>
    </View>
  );
}

/** Public privacy policy — available before sign-in (App Store requirement). */
export default function PublicPrivacyScreen() {
  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ backgroundColor: colors.canvas }} testID="public-privacy-screen">
      <ScreenHeader title="Privacy" subtitle="How Rennova looks after your data" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text className="mb-6 text-[15px] leading-6" style={{ color: colors.ink, fontFamily: typefaces.regular }}>
          Rennova is built for UK homeowners and contractors. We keep personal and project information only as needed to run the service.
        </Text>
        <Section
          title="What we collect"
          body="Account details (name, email), project briefs and photos you upload, quotations, messages, call requests and in-app notifications. Contractors also share business profile and portfolio information."
        />
        <Section
          title="How we use it"
          body="To create contractor-ready briefs, share published projects with suitable contractors, deliver private quotations to homeowners, support messaging and call approvals, and improve the product experience."
        />
        <Section
          title="Private quotations"
          body="Contractors never see each other’s quotes. Only the homeowner for that project can compare quotations and select a contractor."
        />
        <Section
          title="Photos & media"
          body="Project and portfolio photos are stored so the people on that job can review them. Do not upload images of people without their consent."
        />
        <Section
          title="Your choices"
          body={`After you sign in, you can delete your account from More → Delete account. You can also email ${launchContacts.supportEmail}.`}
        />
        <Section
          title="Contact"
          body={`Questions about privacy: ${launchContacts.privacyEmail}. ${launchContacts.userOwnedNote}`}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
