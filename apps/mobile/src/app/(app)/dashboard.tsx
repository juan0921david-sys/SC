import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/styles/colors';

export default function DashboardScreen() {
    const { user, logout } = useAuth();

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>🏢 Mi Ruta</Text>
                    <Text style={styles.headerSubtitle}>
                        {user?.routes?.name || 'Sin ruta asignada'}
                    </Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>🚪 Salir</Text>
                </TouchableOpacity>
            </View>

            {/* Contenido temporal */}
            <View style={styles.content}>
                <Text style={styles.welcome}>¡Bienvenido!</Text>
                <Text style={styles.userName}>{user?.full_name || 'Usuario'}</Text>
                <Text style={styles.userInfo}>Cédula: {user?.identification}</Text>
                <Text style={styles.userInfo}>Rol: {user?.role}</Text>

                <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>
                        📋 Dashboard en construcción
                    </Text>
                    <Text style={styles.placeholderSub}>
                        Aquí verás tus clientes y sus cuotas
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textLight,
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 0,
    },
    headerSubtitle: {
        fontSize: 11,
        color: Colors.textLight,
        marginTop: 2,
    },
    logoutBtn: {
        backgroundColor: '#000',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderWidth: 2,
        borderTopColor: Colors.borderLight,
        borderLeftColor: Colors.borderLight,
        borderRightColor: Colors.borderDark,
        borderBottomColor: Colors.borderDark,
    },
    logoutText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    welcome: {
        fontSize: 14,
        color: Colors.textLight,
        marginBottom: 4,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 16,
    },
    userInfo: {
        fontSize: 13,
        color: Colors.textLight,
        marginBottom: 4,
    },
    placeholder: {
        marginTop: 40,
        padding: 20,
        backgroundColor: Colors.backgroundCard,
        borderWidth: 2,
        borderTopColor: Colors.borderLight,
        borderLeftColor: Colors.borderLight,
        borderRightColor: Colors.borderDark,
        borderBottomColor: Colors.borderDark,
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    placeholderSub: {
        fontSize: 12,
        color: '#404040',
        textAlign: 'center',
    },
});
