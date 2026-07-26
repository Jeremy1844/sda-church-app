import { GlobalHeader } from '@/components/GlobalHeader';
import { Stack } from 'expo-router';

export default function BibleStackLayout() {
  return (
    <Stack screenOptions={{ header: (props) => <GlobalHeader {...props} /> }}>
      <Stack.Screen name="index" />
      {/* Add other community sub-pages here if needed */}
    </Stack>
  );
}
