import { Stack } from 'expo-router';
import { Colors } from '@/styles/colors';

export default function AppLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
            }}
        >
            <Stack.Screen name="dashboard" />
        </Stack>
    );
}