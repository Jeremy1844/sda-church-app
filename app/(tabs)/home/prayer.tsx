import { ROUTES } from '@/constants/Routes';
import { Redirect } from 'expo-router';

export default function RetiredPrayerRoute() {
  return <Redirect href={ROUTES.home} />;
}
