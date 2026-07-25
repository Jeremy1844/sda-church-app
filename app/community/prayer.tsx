import { ROUTES } from '@/constants/Routes';
import { Redirect } from 'expo-router';

export default function LegacyPrayerRedirect() {
  return <Redirect href={ROUTES.prayer} />;
}
