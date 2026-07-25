import { ROUTES } from '@/constants/Routes';
import { Redirect } from 'expo-router';

export default function RetiredBulletinRoute() {
  return <Redirect href={ROUTES.home} />;
}
