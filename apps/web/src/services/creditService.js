import api from './api';

export const creditService = {
    // Listar todos los créditos
    getAll: async () => {
        const response = await api.get('/credits');
        return response.data;
    },

    // Obtener un crédito por ID (con cuotas)
    getById: async (id) => {
        const response = await api.get(`/credits/${id}`);
        return response.data;
    },

    // Obtener créditos de un cliente
    getByClient: async (clientId) => {
        const response = await api.get(`/credits/client/${clientId}`);
        return response.data;
    },

    // Crear un crédito (con cliente automático)
    create: async (creditData) => {
        const response = await api.post('/credits', creditData);
        return response.data;
    },

    // Actualizar estado de un crédito
    updateStatus: async (id, status) => {
        const response = await api.patch(`/credits/${id}/status`, { status });
        return response.data;
    },
};