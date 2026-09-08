import bcrypt from 'bcryptjs';
import supabase from '../config/supabase.js';
import { generateToken } from '../utils/jwt.js';
import { validateEmail, validatePassword } from '../utils/validation.js';

export const register = async (req, res) => {
    try {
        const { email, password, full_name, role = 'worker' } = req.body;

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

        // Verificar si el usuario ya existe
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

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Crear usuario
        const { data: user, error } = await supabase
            .from('users')
            .insert([
                {
                    email,
                    password_hash: passwordHash,
                    full_name: full_name || null,
                    role: role
                }
            ])
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

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        if (user.is_active === false) {
            return res.status(403).json({
                success: false,
                message: 'Usuario desactivado'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const token = generateToken(user.id, user.email, user.role);
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

export const getProfile = async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, full_name, role, is_active, created_at')
            .eq('id', req.user.userId)
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