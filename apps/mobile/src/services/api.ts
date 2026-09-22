import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// CONFIGURACIÓN DE LA API
// ============================================
// ⚠️ IMPORTANTE: Cambiar por la IP de tu PC cuando pruebes en celular físico
// Para emulador Android: http://10.0.2.2:5000/api
// Para celular físico: http://192.168.1.8:5000/api
// Para iOS simulador: http://localhost:5000/api

const API_BASE_URL = 'http://192.168.1.8:5000/api';

// ============================================
// CREAR INSTANCIA DE AXIOS
// ============================================
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 segundos
});

// ============================================
// INTERCEPTOR DE PETICIONES (agregar token)
// ============================================
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('@sistema-cobro:token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error obteniendo token:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================
// INTERCEPTOR DE RESPUESTAS (manejo de errores)
// ============================================
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Token expirado o inválido (401)
        if (error.response?.status === 401) {
            console.warn('🔒 Sesión expirada');
            await AsyncStorage.removeItem('@sistema-cobro:token');
            await AsyncStorage.removeItem('@sistema-cobro:user');

            // El AuthContext se encargará de redirigir al login
        }

        // Sin permisos (403)
        if (error.response?.status === 403) {
            console.warn('🚫 Sin permisos');
        }

        // Rate limit (429)
        if (error.response?.status === 429) {
            console.warn('⏱️ Demasiadas peticiones');
        }

        return Promise.reject(error);
    }
);

export default api;
export { API_BASE_URL };