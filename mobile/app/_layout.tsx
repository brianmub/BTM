import { Slot } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { TenantProvider } from '../context/TenantContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <TenantProvider>
                    <Slot />
                </TenantProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
