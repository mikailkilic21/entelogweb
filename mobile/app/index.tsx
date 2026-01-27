import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' }}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    if (user) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/login" />;
}
