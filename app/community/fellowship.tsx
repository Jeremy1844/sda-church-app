import { ROUTES } from '@/constants/Routes';
import { Redirect } from 'expo-router';

export default function LegacyFellowshipRedirect() {
  return <Redirect href={ROUTES.fellowship} />;
}
