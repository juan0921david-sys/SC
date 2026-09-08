import supabase from '../config/supabase.js';

// Crear un nuevo cliente
export const createClient = async (req, res) => {
    try {
        const { full_name, identification, phone, email, address } = req.body;

        // Validaciones
        if (!full_name || !identification) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y cédula son requeridos'
            });
        }

        // Verificar si ya existe un cliente con esa cédula
        const { data: existingClient, error: checkError } = await supabase
            .from('clients')
            .select('id')
            .eq('identification', identification)
            .single();

        if (existingClient) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un cliente con esta cédula'
            });
        }

        // Crear cliente
        const { data: client, error } = await supabase
            .from('clients')
            .insert([
                {
                    full_name,
                    identification,
                    phone: phone || null,
                    email: email || null,
                    address: address || null
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creando cliente:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al crear el cliente'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Cliente creado exitosamente',
            data: client
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener todos los clientes
export const getAllClients = async (req, res) => {
    try {
        const { data: clients, error } = await supabase
            .from('clients')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) {
            console.error('Error obteniendo clientes:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener los clientes'
            });
        }

        res.json({
            success: true,
            data: clients
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener un cliente por ID
export const getClientById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: client, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !client) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.json({
            success: true,
            data: client
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Buscar clientes por cédula o nombre
export const searchClients = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un término de búsqueda'
            });
        }

        // Buscar por cédula o nombre
        const { data: clients, error } = await supabase
            .from('clients')
            .select('*')
            .or(`identification.ilike.%${q}%,full_name.ilike.%${q}%`)
            .order('full_name', { ascending: true });

        if (error) {
            console.error('Error buscando clientes:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al buscar clientes'
            });
        }

        res.json({
            success: true,
            data: clients
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Actualizar un cliente
export const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, identification, phone, email, address } = req.body;

        // Verificar que el cliente existe
        const { data: existingClient, error: findError } = await supabase
            .from('clients')
            .select('id')
            .eq('id', id)
            .single();

        if (findError || !existingClient) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        // Construir objeto de actualización
        const updates = {};
        if (full_name) updates.full_name = full_name;
        if (identification) updates.identification = identification;
        if (phone !== undefined) updates.phone = phone;
        if (email !== undefined) updates.email = email;
        if (address !== undefined) updates.address = address;
        updates.updated_at = new Date().toISOString();

        const { data: client, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error actualizando cliente:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar el cliente'
            });
        }

        res.json({
            success: true,
            message: 'Cliente actualizado exitosamente',
            data: client
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Desactivar cliente (soft delete)
export const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: client, error } = await supabase
            .from('clients')
            .update({
                is_active: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error desactivando cliente:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al desactivar el cliente'
            });
        }

        res.json({
            success: true,
            message: 'Cliente desactivado exitosamente',
            data: client
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Reactivar cliente
export const activateClient = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: client, error } = await supabase
            .from('clients')
            .update({
                is_active: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error reactivando cliente:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al reactivar el cliente'
            });
        }

        res.json({
            success: true,
            message: 'Cliente reactivado exitosamente',
            data: client
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};