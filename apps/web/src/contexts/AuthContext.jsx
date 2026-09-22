import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// ============================================
// CONFIGURACIÓN DE SESIÓN
// ============================================
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 horas en milisegundos
const WARNING_TIME = 5 * 60 * 1000; // 5 minutos antes de expirar (aviso)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const timeoutRef = useRef(null);
    const warningTimeoutRef = useRef(null);

    // ============================================
    // CARGAR PERFIL AL INICIO
    // ============================================
    useEffect(() => {
        if (token) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, [token]);

    // ============================================
    // CONFIGURAR TIMEOUT DE SESIÓN
    // ============================================
    useEffect(() => {
        if (!token) return;

        // Limpiar timers anteriores
        clearSessionTimers();

        // Configurar aviso 5 minutos antes
        warningTimeoutRef.current = setTimeout(() => {
            const continuar = window.confirm(
                '⚠️ Tu sesión expirará en 5 minutos por inactividad.\n\n¿Deseas continuar conectado?'
            );

            if (continuar) {
                resetSessionTimer();
            } else {
                logout();
            }
        }, SESSION_TIMEOUT - WARNING_TIME);

        // Configurar logout automático
        timeoutRef.current = setTimeout(() => {
            alert('⏰ Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.');
            logout();
        }, SESSION_TIMEOUT);

        // Resetear timer en actividad del usuario
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        const resetTimer = () => resetSessionTimer();

        events.forEach(event => document.addEventListener(event, resetTimer));

        return () => {
            clearSessionTimers();
            events.forEach(event => document.removeEventListener(event, resetTimer));
        };
    }, [token]);

    // ============================================
    // FUNCIONES DE SESIÓN
    // ============================================
    const clearSessionTimers = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
            warningTimeoutRef.current = null;
        }
    };

    const resetSessionTimer = () => {
        clearSessionTimers();

        // Aviso 5 minutos antes
        warningTimeoutRef.current = setTimeout(() => {
            const continuar = window.confirm(
                '⚠️ Tu sesión expirará en 5 minutos por inactividad.\n\n¿Deseas continuar conectado?'
            );

            if (continuar) {
                resetSessionTimer();
            } else {
                logout();
            }
        }, SESSION_TIMEOUT - WARNING_TIME);

        // Logout automático
        timeoutRef.current = setTimeout(() => {
            alert('⏰ Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.');
            logout();
        }, SESSION_TIMEOUT);
    };

    // ============================================
    // OBTENER PERFIL
    // ============================================
    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/profile');
            setUser(response.data.data.user);
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            // Si el token expiró o es inválido
            if (error.response?.status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // LOGIN
    // ============================================
    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { user, token } = response.data.data;

            localStorage.setItem('token', token);
            setToken(token);
            setUser(user);

            // Guardar timestamp del login
            localStorage.setItem('loginTime', Date.now().toString());

            return { success: true, user };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Error al iniciar sesión'
            };
        }
    };

    // ============================================
    // LOGOUT
    // ============================================
    const logout = () => {
        clearSessionTimers();
        localStorage.removeItem('token');
        localStorage.removeItem('loginTime');
        setToken(null);
        setUser(null);
    };

    // ============================================
    // VALOR DEL CONTEXTO
    // ============================================
    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isWorker: user?.role === 'worker',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};