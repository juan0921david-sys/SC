import api from './api';

// ============================================
// TIPOS
// ============================================
export interface Client {
    id: string;
    full_name: string;
    identification: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    route_id: number | null;
    is_active: boolean;
    created_at: string;
}

// ============================================
// LISTAR CLIENTES (de la ruta del worker)
// ============================================
export const getAllClients = async (): Promise<Client[]> => {
    try {
        const response = await api.get('/clients');
        return response.data.data || [];
    } catch (error: any) {
        console.error('Error obteniendo clientes:', error);
        throw {
            success: false,
            message: error.response?.data?.message || 'Error al obtener clientes',
        };
    }
};

// ============================================
// BUSCAR CLIENTES
// ============================================
export const searchClients = async (query: string): Promise<Client[]> => {
    try {
        const response = await api.get(`/clients/search?q=${encodeURIComponent(query)}`);
        return response.data.data || [];
    } catch (error: any) {
        console.error('Error buscando clientes:', error);
        throw {
            success: false,
            message: error.response?.data?.message || 'Error al buscar clientes',
        };
    }
};

// ============================================
// OBTENER UN CLIENTE POR ID
// ============================================
export const getClientById = async (id: string): Promise<Client> => {
    const response = await api.get(`/clients/${id}`);
    return response.data.data;
};