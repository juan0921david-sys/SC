import api from './api';

export const clientService = {
    // Listar todos los clientes
    getAll: async () => {
        const response = await api.get('/clients');
        return response.data;
    },

    // Buscar clientes
    search: async (query) => {
        const response = await api.get(`/clients/search?q=${encodeURIComponent(query)}`);
        return response.data;
    },

    // Obtener un cliente por ID
    getById: async (id) => {
        const response = await api.get(`/clients/${id}`);
        return response.data;
    },

    // Crear un cliente
    create: async (clientData) => {
        const response = await api.post('/clients', clientData);
        return response.data;
    },

    // Actualizar un cliente
    update: async (id, clientData) => {
        const response = await api.put(`/clients/${id}`, clientData);
        return response.data;
    },

    // Desactivar un cliente (soft delete)
    deactivate: async (id) => {
        const response = await api.delete(`/clients/${id}`);
        return response.data;
    },

    // Reactivar un cliente
    activate: async (id) => {
        const response = await api.patch(`/clients/${id}/activate`);
        return response.data;
    },

    // Eliminar un cliente permanentemente (solo admin)
    deletePermanent: async (id) => {
        const response = await api.delete(`/clients/${id}/permanent`);
        return response.data;
    },
};