import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/styles/colors';

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sistema de Cobro</Text>
            <Text style={styles.subtitle}>App Móvil - En construcción</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textLight,
    },
});