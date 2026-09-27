import { Redirect } from 'expo-router';

/** The Post tab opens the project flow as a modal; this route only exists to hold its tab slot. */
export default function Post() {
  return <Redirect href="/new" />;
}
