import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/styles/colors';
import { RetroWindow } from '@/components/RetroWindow';
import { RetroInput } from '@/components/RetroInput';
import { RetroButton } from '@/components/RetroButton';

export default function LoginScreen() {
    const { login } = useAuth();
    const [identification, setIdentification] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        // Validaciones
        if (!identification.trim()) {
            setError('Ingrese su cédula');
            return;
        }
        if (!password.trim()) {
            setError('Ingrese su contraseña');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const result = await login(identification.trim(), password);

            if (!result.success) {
                setError(result.message || 'Error al iniciar sesión');
            }
            // Si es exitoso, el AuthContext + _layout redirigirá automáticamente
        } catch (err: any) {
            setError(err.message || 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoTitle}>SISTEMA DE COBRO</Text>
                        <Text style={styles.logoSubtitle}></Text>
                    </View>

                    {/* Ventana de Login */}
                    <RetroWindow title="Login - Cobrador">
                        {/* Marquee decorativo */}
                        <View style={styles.marquee}>
                            <Text style={styles.marqueeText}>
                                *** INGRESE SU CÉDULA Y CONTRASEÑA ***
                            </Text>
                        </View>

                        {/* Inputs */}
                        <RetroInput
                            label="Cédula:"
                            icon=""
                            value={identification}
                            onChangeText={setIdentification}
                            placeholder="Ej: 12345678"
                            keyboardType="numeric"
                            autoCapitalize="none"
                            editable={!loading}
                        />

                        <RetroInput
                            label="Contraseña:"
                            icon=""
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            secureTextEntry
                            autoCapitalize="none"
                            editable={!loading}
                        />

                        {/* Error */}
                        {error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>⚠️ {error}</Text>
                            </View>
                        ) : null}

                        {/* Botón */}
                        <RetroButton
                            title="INGRESAR"
                            icon=""
                            onPress={handleLogin}
                            loading={loading}
                            disabled={loading}
                        />

                        {/* Footer */}
                        <Text style={styles.footer}>Sistema de Cobro © 2026</Text>
                    </RetroWindow>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoTitle: {
        alignItems: 'center',
        fontSize: 26,
        fontWeight: 'bold',
        color: Colors.primary,
        letterSpacing: 2,
        textShadowColor: '#000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
    },
    logoSubtitle: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 8,
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 0,
    },
    marquee: {
        backgroundColor: '#000',
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: Colors.borderDark,
    },
    marqueeText: {
        color: '#00ff00',
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    errorBox: {
        backgroundColor: '#ffe0e0',
        borderWidth: 2,
        borderTopColor: Colors.borderLight,
        borderLeftColor: Colors.borderLight,
        borderRightColor: Colors.borderDark,
        borderBottomColor: Colors.borderDark,
        padding: 8,
        marginBottom: 12,
    },
    errorText: {
        color: Colors.dangerDark,
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    footer: {
        textAlign: 'center',
        color: Colors.textMuted,
        fontSize: 10,
        marginTop: 16,
    },
});