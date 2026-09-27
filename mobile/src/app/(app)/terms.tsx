import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { colors, typefaces } from '@/lib/design/tokens';

function Section({ title, body }: { title: string; body: string }) {
  return (
    <View className="mb-7">
      <Text className="text-[18px] tracking-[-0.2px]" style={{ color: colors.ink, fontFamily: typefaces.demi }}>{title}</Text>
      <Text className="mt-2 text-[15px] leading-6" style={{ color: colors.muted, fontFamily: typefaces.regular }}>{body}</Text>
    </View>
  );
}

export default function TermsScreen() {
  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ backgroundColor: colors.canvas }} testID="terms-screen">
      <ScreenHeader title="Terms of use" subtitle="Using Rennova fairly" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text className="mb-6 text-[15px] leading-6" style={{ color: colors.ink, fontFamily: typefaces.regular }}>
          By using Rennova you agree to these terms. They are written for clarity while you prepare for App Store launch; replace with counsel-reviewed copy before public release.
        </Text>
        <Section
          title="The service"
          body="Rennova helps homeowners describe work and receive private quotations from contractors. We are a marketplace layer, not a party to your building contract unless separately agreed in writing."
        />
        <Section
          title="Accurate information"
          body="Homeowners should describe work honestly. Contractors should keep profiles, insurance claims, and quotes accurate. Misleading listings or unsafe requests may be removed."
        />
        <Section
          title="Quotes & selection"
          body="Quotations are private to the homeowner. Selecting a contractor in-app records your choice; the legal contract for the works remains between you and that contractor."
        />
        <Section
          title="Safety"
          body="Never climb roofs or take dangerous photos for the app. Rennova will not ask for unsafe capture. Follow UK building and health & safety rules on site."
        />
        <Section
          title="Acceptable use"
          body="No harassment, spam, scraped contacts, reverse-engineering others’ quotes, or using the service to undercut with fake bids."
        />
        <Section
          title="Liability"
          body="Rennova is provided as available. We are not responsible for the quality of works performed by contractors or for disputes between users, except where UK consumer law says otherwise."
        />
      </ScrollView>
    </SafeAreaView>
  );
}
