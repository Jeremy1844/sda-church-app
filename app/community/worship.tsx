import { ROUTES } from '@/constants/Routes';
import { Redirect } from 'expo-router';

export default function LegacyWorshipRedirect() {
  return <Redirect href={ROUTES.worship} />;
}
