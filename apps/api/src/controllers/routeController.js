import supabase from '../config/supabase.js';

// ============================================
// OBTENER TODAS LAS RUTAS
// ============================================
export const getAllRoutes = async (req, res) => {
    try {
        const { data: routes, error } = await supabase
            .from('routes')
            .select('*')
            .eq('is_active', true)
            .order('id', { ascending: true });

        if (error) {
            console.error('Error obteniendo rutas:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener las rutas'
            });
        }

        res.json({
            success: true,
            data: routes
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============================================
// OBTENER UNA RUTA POR ID
// ============================================
export const getRouteById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: route, error } = await supabase
            .from('routes')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !route) {
            return res.status(404).json({
                success: false,
                message: 'Ruta no encontrada'
            });
        }

        res.json({
            success: true,
            data: route
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============================================
// CREAR RUTA (solo admin)
// ============================================
export const createRoute = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la ruta es requerido'
            });
        }

        const { data: route, error } = await supabase
            .from('routes')
            .insert([{ name, description }])
            .select()
            .single();

        if (error) {
            console.error('Error creando ruta:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al crear la ruta'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Ruta creada exitosamente',
            data: route
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============================================
// ACTUALIZAR RUTA (solo admin)
// ============================================
export const updateRoute = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_active } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (is_active !== undefined) updates.is_active = is_active;
        updates.updated_at = new Date().toISOString();

        const { data: route, error } = await supabase
            .from('routes')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error actualizando ruta:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar la ruta'
            });
        }

        res.json({
            success: true,
            message: 'Ruta actualizada exitosamente',
            data: route
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============================================
// OBTENER ESTADÍSTICAS DE UNA RUTA
// ============================================
export const getRouteStats = async (req, res) => {
    try {
        const { id } = req.params;

        // Contar clientes en la ruta
        const { count: clientsCount } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('route_id', id);

        // Contar trabajadores en la ruta
        const { count: workersCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('route_id', id)
            .eq('role', 'worker');

        res.json({
            success: true,
            data: {
                route_id: id,
                total_clients: clientsCount || 0,
                total_workers: workersCount || 0
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};