import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================
// INTERCEPTOR DE RESPUESTAS - Manejo de errores
// ============================================
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si el token expiró (401)
        if (error.response?.status === 401) {
            console.warn('🔒 Sesión expirada');

            // Limpiar datos
            localStorage.removeItem('token');
            localStorage.removeItem('loginTime');

            // Redirigir al login
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        // Si no tiene permisos (403)
        if (error.response?.status === 403) {
            console.warn('🚫 Sin permisos');
        }

        // Si excede rate limit (429)
        if (error.response?.status === 429) {
            console.warn('⏱️ Rate limit excedido');
        }

        return Promise.reject(error);
    }
);

export default api;