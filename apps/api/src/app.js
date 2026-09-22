import express from "express";
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Importar rutas
import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import creditRoutes from './routes/creditRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
// Importar rate limiters
import { generalLimiter } from './middlewares/rateLimitMiddleware.js';

dotenv.config();

export function createApp() {
    const app = express();

    // ============================================
    // CONFIGURACIÓN DE SEGURIDAD
    // ============================================

    // Helmet - Headers de seguridad
    app.use(helmet({
        contentSecurityPolicy: false, // Deshabilitado para desarrollo
        crossOriginEmbedderPolicy: false,
    }));

    // CORS estricto
    const allowedOrigins = process.env.NODE_ENV === 'production'
        ? ['https://tudominio.com'] // Cambiar en producción
        : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

    app.use(cors({
        origin: (origin, callback) => {
            // Permitir requests sin origin (Postman, curl, mobile)
            if (!origin) return callback(null, true);

            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.warn(`🚫 CORS bloqueado para: ${origin}`);
                callback(new Error('No permitido por CORS'));
            }
        },
        credentials: true,
        optionsSuccessStatus: 200,
    }));

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting general (aplicar a /api)
    app.use('/api', generalLimiter);

    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
        app.use((req, res, next) => {
            console.log(`📝 ${req.method} ${req.path}`);
            next();
        });
    }

    // ============================================
    // RUTAS
    // ============================================

    // Health check
    app.get("/health", (_request, response) => {
        response.status(200).json({
            status: "ok",
            timestamp: new Date().toISOString()
        });
    });

    app.use('/api/health', healthRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/clients', clientRoutes);
    app.use('/api/credits', creditRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/receipts', receiptRoutes);
    app.use('/api/routes', routeRoutes);
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

    // Manejador de errores global
    app.use((err, req, res, next) => {
        console.error('Error no manejado:', err);

        // Si es error de CORS
        if (err.message === 'No permitido por CORS') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado por políticas de CORS'
            });
        }

        res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Error interno del servidor"
            }
        });
    });

    return app;
}