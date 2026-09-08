import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rutas
import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import clientRoutes from './routes/clientRoutes.js';  // ⬅️ AGREGAR ESTA

dotenv.config();

export function createApp() {
    const app = express();

    // Middlewares
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
        app.use((req, res, next) => {
            console.log(`📝 ${req.method} ${req.path}`);
            next();
        });
    }

    // Health check
    app.get("/health", (_request, response) => {
        response.status(200).json({
            status: "ok",
            timestamp: new Date().toISOString()
        });
    });

    // Rutas
    app.use('/api/health', healthRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/clients', clientRoutes);  // ⬅️ AGREGAR ESTA

    // Ruta raíz
    app.get('/', (req, res) => {
        res.json({
            message: '🚀 API Sistema de Cobro',
            version: '1.0.0',
            endpoints: {
                health: '/health',
                api: {
                    health: '/api/health',
                    auth: {
                        register: '/api/auth/register',
                        login: '/api/auth/login',
                        profile: '/api/auth/profile'
                    },
                    admin: {
                        users: '/api/admin/users',
                        user: '/api/admin/users/:id'
                    },
                    clients: {
                        list: '/api/clients',
                        create: '/api/clients',
                        get: '/api/clients/:id',
                        update: '/api/clients/:id',
                        delete: '/api/clients/:id',
                        activate: '/api/clients/:id/activate',
                        search: '/api/clients/search?q=termino'
                    }
                }
            }
        });
    });

    // Manejador 404
    app.use((_request, response) => {
        response.status(404).json({
            error: { code: "NOT_FOUND" }
        });
    });

    // Manejador de errores
    app.use((err, req, res, next) => {
        console.error('Error no manejado:', err);
        res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Error interno del servidor"
            }
        });
    });

    return app;
}