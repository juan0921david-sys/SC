import bcrypt from 'bcryptjs';
import supabase from '../config/supabase.js';
import { generateToken } from '../utils/jwt.js';
import { validateEmail, validatePassword } from '../utils/validation.js';

// ============================================
// REGISTRAR NUEVO USUARIO
// ============================================
export const register = async (req, res) => {
    try {
        const { email, password, full_name, role = 'worker', identification, route_id } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email inválido'
            });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar si el usuario ya existe (por email)
        const { data: existingUser } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Este email ya está registrado'
            });
        }

        // Verificar si la cédula ya existe (si se proporciona)
        if (identification) {
            const { data: existingId } = await supabase
                .from('users')
                .select('identification')
                .eq('identification', identification)
                .single();

            if (existingId) {
                return res.status(409).json({
                    success: false,
                    message: 'Esta cédula ya está registrada'
                });
            }
        }

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Preparar datos del usuario
        const userData = {
            email,
            password_hash: passwordHash,
            full_name: full_name || null,
            role: role
        };

        // Agregar campos opcionales si se proporcionan
        if (identification) userData.identification = identification;
        if (route_id) userData.route_id = route_id;

        // Crear usuario
        const { data: user, error } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();

        if (error) {
            console.error('Error insertando usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al crear el usuario'
            });
        }

        const token = generateToken(user.id, user.email, user.role);
        const { password_hash, ...userWithoutPassword } = user;

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: userWithoutPassword,
                token
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============================================
// INICIAR SESIÓN (ACEPTA EMAIL O CÉDULA)
// ============================================
export const login = async (req, res) => {
    try {
        // Aceptar tanto "email" como "identifier" (cédula o email)
        const identifier = req.body.email || req.body.identifier || req.body.identification;
        const { password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña son requeridos'
            });
        }

        // Determinar si es email o cédula
        const isEmail = validateEmail(identifier);

        let userQuery;
        if (isEmail) {
            // Buscar por email
            userQuery = supabase
                .from('users')
                .select('*')
                .eq('email', identifier.toLowerCase())
                .single();
        } else {
            // Buscar por cédula
            userQuery = supabase
                .from('users')
                .select('*')
                .eq('identification', identifier)
                .single();
        }

        const { data: user, error: findError } = await userQuery;

        if (findError || !user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar si el usuario está activo
        if (user.is_active === false) {
            return res.status(403).json({
                success: false,
                message: 'Usuario desactivado'
            });
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token
        const token = generateToken(user.id, user.email, user.role);

        // Respuesta
        const { password_hash, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                user: userWithoutPassword,
                token
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============================================
// OBTENER PERFIL DEL USUARIO AUTENTICADO
// ============================================
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const { data: user, error } = await supabase
            .from('users')
            .select(`
                id, 
                email, 
                full_name, 
                role, 
                is_active, 
                created_at,
                identification,
                route_id,
                routes:route_id (
                    id,
                    name,
                    description
                )
            `)
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Error en perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};