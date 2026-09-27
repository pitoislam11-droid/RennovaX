import { router } from 'expo-router';
import { useEffect } from 'react';

import { LoadingView } from '@/components/ui/state-view';
import { contractorHomeHref } from '@/lib/navigation';
import { useProfile } from '@/lib/profile';

/** Legacy route — sends contractors to setup or opportunities. */
export default function ContractorNextRedirect() {
  const profileQuery = useProfile();

  useEffect(() => {
    if (!profileQuery.data) return;
    router.replace(contractorHomeHref(profileQuery.data));
  }, [profileQuery.data]);

  return <LoadingView label="Opening contractor workspace…" testID="contractor-next-redirect" />;
}
