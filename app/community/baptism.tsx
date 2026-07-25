import { ROUTES } from '@/constants/Routes';
import { Redirect } from 'expo-router';

export default function LegacyBaptismRedirect() {
  return <Redirect href={ROUTES.baptism} />;
}
