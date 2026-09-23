import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/authService';
import { User } from '../services/authService';

// ============================================
// TIPOS
// ============================================
interface AuthContextData {
    user: User | null;
    token: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isWorker: boolean;
    login: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => Promise<void>;
}

interface AuthProviderProps {
    children: ReactNode;
}

// ============================================
// CLAVES DE ALMACENAMIENTO
// ============================================
const TOKEN_KEY = '@sistema-cobro:token';
const USER_KEY = '@sistema-cobro:user';

// ============================================
// CONTEXTO
// ============================================
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// ============================================
// HOOK PERSONALIZADO
// ============================================
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};

// ============================================
// PROVIDER
// ============================================
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // ============================================
    // CARGAR SESIÓN AL INICIAR
    // ============================================
    useEffect(() => {
        loadStoredSession();
    }, []);

    const loadStoredSession = async () => {
        try {
            const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
            const storedUser = await AsyncStorage.getItem(USER_KEY);

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));

                // Verificar que el token siga válido
                try {
                    const profile = await authService.getProfile();
                    setUser(profile);
                    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
                } catch (error) {
                    // Token expirado o inválido
                    console.warn('Token expirado, cerrando sesión');
                    await clearSession();
                }
            }
        } catch (error) {
            console.error('Error cargando sesión:', error);
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // LOGIN
    // ============================================
    const login = async (
        identifier: string,
        password: string
    ): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await authService.login(identifier, password);

            if (!response.success) {
                return {
                    success: false,
                    message: response.message || 'Error al iniciar sesión',
                };
            }

            const { user: userData, token: userToken } = response.data;

            // Verificar que sea worker (por ahora)
            // Los admins usan la web, no la app móvil
            if (userData.role === 'admin') {
                return {
                    success: false,
                    message: 'Los administradores deben usar la versión web',
                };
            }

            // Guardar en estado
            setUser(userData);
            setToken(userToken);

            // Guardar en almacenamiento
            await AsyncStorage.setItem(TOKEN_KEY, userToken);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));

            return { success: true };
        } catch (error: any) {
            console.error('Error en login:', error);
            return {
                success: false,
                message: error.message || 'Error de conexión',
            };
        }
    };

    // ============================================
    // LOGOUT
    // ============================================
    const logout = async (): Promise<void> => {
        await clearSession();
    };

    const clearSession = async () => {
        try {
            await AsyncStorage.removeItem(TOKEN_KEY);
            await AsyncStorage.removeItem(USER_KEY);
        } catch (error) {
            console.error('Error limpiando sesión:', error);
        } finally {
            setUser(null);
            setToken(null);
        }
    };

    // ============================================
    // VALORES DERIVADOS
    // ============================================
    const isAuthenticated = !!user && !!token;
    const isAdmin = user?.role === 'admin';
    const isWorker = user?.role === 'worker';

    // ============================================
    // VALOR DEL CONTEXTO
    // ============================================
    const value: AuthContextData = {
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        isWorker,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};