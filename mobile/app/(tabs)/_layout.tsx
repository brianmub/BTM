import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../lib/theme';
import { Home, Compass, Users, User as UserIcon, Radio } from 'lucide-react-native';

export default function TabLayout() {
    const { user, profile } = useAuth();

    if (!user) {
        return <Redirect href="/login" />;
    }

    const isFacilitator = profile?.role === 'facilitator' || profile?.role === 'admin';

    return (
        <Tabs
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.colors.card,
                },
                headerTintColor: theme.colors.text,
                tabBarStyle: {
                    backgroundColor: theme.colors.card,
                    borderTopColor: theme.colors.border,
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textMuted,
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color }) => <Home color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="programs"
                options={{
                    title: 'Programs',
                    tabBarIcon: ({ color }) => <Compass color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="broadcasts"
                options={{
                    title: 'Media',
                    tabBarIcon: ({ color }) => <Radio color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="groups"
                options={{
                    title: 'Cell Groups',
                    tabBarIcon: ({ color }) => <Users color={color} size={24} />,
                    href: isFacilitator ? '/(tabs)/groups' : null,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <UserIcon color={color} size={24} />,
                }}
            />
        </Tabs>
    );
}
