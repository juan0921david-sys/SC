import supabase from '../config/supabase.js';

// Obtener todos los usuarios
export const getAllUsers = async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, full_name, role, is_active, created_at, updated_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error obteniendo usuarios:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener los usuarios'
            });
        }

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener un usuario por ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, full_name, role, is_active, created_at, updated_at')
            .eq('id', id)
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Actualizar usuario
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, full_name, role, is_active } = req.body;

        // Verificar que el usuario existe
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('id')
            .eq('id', id)
            .single();

        if (findError || !existingUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Construir objeto de actualización
        const updates = {};
        if (email) updates.email = email;
        if (full_name !== undefined) updates.full_name = full_name;
        if (role) updates.role = role;
        if (is_active !== undefined) updates.is_active = is_active;
        updates.updated_at = new Date().toISOString();

        const { data: user, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select('id, email, full_name, role, is_active, created_at, updated_at')
            .single();

        if (error) {
            console.error('Error actualizando usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar el usuario'
            });
        }

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: user
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Desactivar usuario (soft delete)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el usuario existe
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('id')
            .eq('id', id)
            .single();

        if (findError || !existingUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Desactivar usuario en lugar de eliminar
        const { data: user, error } = await supabase
            .from('users')
            .update({
                is_active: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('id, email, full_name, role, is_active')
            .single();

        if (error) {
            console.error('Error desactivando usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al desactivar el usuario'
            });
        }

        res.json({
            success: true,
            message: 'Usuario desactivado exitosamente',
            data: user
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Reactivar usuario
export const activateUser = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: user, error } = await supabase
            .from('users')
            .update({
                is_active: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('id, email, full_name, role, is_active')
            .single();

        if (error) {
            console.error('Error reactivando usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al reactivar el usuario'
            });
        }

        res.json({
            success: true,
            message: 'Usuario reactivado exitosamente',
            data: user
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};