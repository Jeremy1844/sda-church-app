import { ROUTES } from '@/constants/Routes';
import { Redirect } from 'expo-router';

/** Preserve old Community hub bookmarks while keeping Home canonical. */
export default function LegacyCommunityRedirect() {
  return <Redirect href={ROUTES.home} />;
}
