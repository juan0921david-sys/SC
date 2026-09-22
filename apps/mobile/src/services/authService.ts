import api from './api';

// ============================================
// TIPOS
// ============================================
export interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'worker';
    identification: string;
    route_id: number | null;
    is_active: boolean;
    routes?: {
        id: number;
        name: string;
        description: string;
    } | null;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        token: string;
    };
}

// ============================================
// LOGIN (con cédula o email)
// ============================================
export const login = async (identifier: string, password: string): Promise<LoginResponse> => {
    try {
        const response = await api.post('/auth/login', {
            identifier,
            password,
        });
        return response.data;
    } catch (error: any) {
        // Manejar errores específicos del backend
        if (error.response) {
            throw {
                success: false,
                message: error.response.data?.message || 'Error al iniciar sesión',
                status: error.response.status,
            };
        }
        // Error de red
        throw {
            success: false,
            message: 'Error de conexión. Verifique su internet.',
            status: 0,
        };
    }
};

// ============================================
// OBTENER PERFIL
// ============================================
export const getProfile = async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data.data.user;
};

// ============================================
// LOGOUT (limpiar token localmente)
// ============================================
export const logout = async (): Promise<void> => {
    // No hay endpoint de logout en el backend (JWT es stateless)
    // Solo limpiamos el token localmente
    return Promise.resolve();
};