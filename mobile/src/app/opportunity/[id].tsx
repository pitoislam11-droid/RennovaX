import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassIconButton } from '@/components/Glass';
import { relativeTime } from '@/components/marketplace';
import { Avatar, Badge, Button, Card, EmptyState, Header, KeyValue, Notice, Photo, Row, Screen, Section } from '@/components/ui';
import { getCategory } from '@/data/categories';
import { formatAnswer, questionsFor } from '@/data/questionFlows';
import { newId } from '@/data/reducer';
import {
  canRequestCall,
  canReviseQuote,
  canSeeHomeownerContact,
  canSubmitQuote,
  contractorQuoteStatusLabel,
  formatPrice,
  isOpenOpportunity,
  visibleQuotes,
} from '@/data/rules';
import { useStore } from '@/data/store';
import { showAlert } from '@/lib/dialog';
import { askToBlock, askToReport } from '@/lib/safety';
import { colors, GUTTER, space, type } from '@/theme';

export default function Opportunity() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, viewer, myBusiness, project: getProject, dispatch } = useStore();
  const insets = useSafeAreaInsets();
  const project = getProject(id);
  const [width, setWidth] = useState(Dimensions.get('window').width);

  const myQuote = project ? visibleQuotes(viewer, project, state.quotes)[0] : undefined;
  if (!project || (!isOpenOpportunity(project, myBusiness) && !myQuote)) {
    return (
      <Screen>
        <Header />
        <EmptyState icon="briefcase-outline" title="Project unavailable" body="This project is no longer open for quotes." />
      </Screen>
    );
  }

  const owner = state.homeowners.find((h) => h.id === project.ownerId)!;
  const cat = getCategory(project.categoryId);
  const questions = questionsFor(project.categoryId).filter((q) => project.answers[q.id] !== undefined);
  const showContact = canSeeHomeownerContact(viewer, project);
  const invited = project.invitedContractorIds.includes(myBusiness.id);
  const chat = () => router.push({ pathname: '/chat/[projectId]/[contractorId]', params: { projectId: project.id, contractorId: myBusiness.id } });

  const requestCall = () => {
    if (!canRequestCall(myBusiness.id, project, state.callRequests)) {
      showAlert('Call already requested', `Waiting for ${owner.firstName} to respond.`);
      return;
    }
    dispatch({ type: 'requestCall', id: newId('cr'), projectId: project.id, contractorId: myBusiness.id, note: `${myBusiness.name} would like a quick call about your project.`, at: new Date().toISOString() });
    showAlert('Request sent', `${owner.firstName} will be asked to approve. Their number stays hidden unless they do.`);
  };

  const footer = myQuote ? (
    <Row>
      <View style={{ flex: 1 }}>
        <Text style={type.bodyStrong}>Your quote · {formatPrice(myQuote.price)}</Text>
        <Text style={type.meta}>{contractorQuoteStatusLabel(myQuote)}</Text>
      </View>
      {canReviseQuote(myQuote, project) ? (
        <Button label="Revise" variant="secondary" small onPress={() => router.push({ pathname: '/submit-quote/[projectId]', params: { projectId: project.id } })} />
      ) : (
        <Button label="Message" variant="secondary" small onPress={chat} />
      )}
    </Row>
  ) : canSubmitQuote(myBusiness.id, project, state.quotes) ? (
    <>
      <Button label="Write a quote" onPress={() => router.push({ pathname: '/submit-quote/[projectId]', params: { projectId: project.id } })} />
      <Row gap={8}>
        <Button label="Ask a question" icon="chatbubble-outline" variant="secondary" small style={{ flex: 1 }} onPress={chat} />
        <Button label="Request call" icon="call-outline" variant="secondary" small style={{ flex: 1 }} onPress={requestCall} />
      </Row>
    </>
  ) : undefined;

  return (
    <Screen contentStyle={{ paddingTop: 0 }} footer={footer}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {(project.photos.length ? project.photos : ['']).map((uri, i) => (
            <Photo key={`${uri}-${i}`} uri={uri} style={{ width, height: 300 }} />
          ))}
        </ScrollView>
        <Row style={{ position: 'absolute', top: insets.top + 8, left: GUTTER, right: GUTTER, justifyContent: 'space-between' }}>
          <GlassIconButton icon="chevron-back" label="Back" variant="clear" onPress={() => router.back()} />
          <GlassIconButton
            icon="ellipsis-horizontal"
            label="More options"
            variant="clear"
            onPress={() =>
              showAlert(project.title, undefined, [
                { text: 'Report this project', onPress: () => askToReport(dispatch, 'project', project.id, 'this project') },
                { text: `Block ${owner.firstName}`, style: 'destructive', onPress: () => askToBlock(dispatch, owner.id, owner.firstName, () => router.back()) },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
          />
        </Row>
        {project.photos.length > 1 ? (
          <View style={{ position: 'absolute', bottom: 14, right: 14 }}>
            <Badge label={`${project.photos.length} photos · swipe`} tone="dark" />
          </View>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: GUTTER, marginTop: space.xl, gap: 8 }}>
        <Row gap={6}>
          {invited ? <Badge label={`${owner.firstName} invited you`} tone="green" /> : null}
          <Badge label={cat.name} />
        </Row>
        <Text style={type.title}>{project.title}</Text>
        <Row gap={4}>
          <Ionicons name="location-outline" size={14} color={colors.ink3} />
          <Text style={type.meta}>{project.location.area} · {project.location.postcode} · Posted {relativeTime(project.publishedAt ?? project.createdAt)}</Text>
        </Row>
        {project.description ? <Text style={[type.body, { marginTop: 6 }]}>{project.description}</Text> : null}
      </View>

      <Section>
        <Card>
          <Row>
            <Avatar initials={owner.firstName[0]} color="#5B6270" />
            <View style={{ flex: 1 }}>
              <Text style={type.bodyStrong}>{owner.firstName}</Text>
              <Text style={type.meta}>Homeowner · Phone verified</Text>
            </View>
          </Row>
          {showContact ? (
            <View style={{ marginTop: 12 }}>
              <KeyValue label="Address" value={project.location.addressLine || project.location.area} />
              <KeyValue label="Phone" value={owner.phone} last />
            </View>
          ) : (
            <View style={{ marginTop: 12 }}>
              <Notice>Full address and phone are shared if {owner.firstName} chooses you.</Notice>
            </View>
          )}
        </Card>
      </Section>

      <Section title="Scope">
        <Card style={{ paddingVertical: 4 }}>
          {questions.map((q, i) => (
            <KeyValue key={q.id} label={q.summaryLabel} value={formatAnswer(project.answers[q.id])} last={i === questions.length - 1} />
          ))}
        </Card>
      </Section>

      <Section>
        <Notice icon="eye-off-outline">Your quote is private. Other contractors never see your price, and you won't see theirs.</Notice>
      </Section>
    </Screen>
  );
}
