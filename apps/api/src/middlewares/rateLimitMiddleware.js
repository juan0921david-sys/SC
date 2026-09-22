import rateLimit from 'express-rate-limit';

// ============================================
// RATE LIMITER PARA LOGIN
// Máximo 5 intentos cada 15 minutos por IP
// ============================================
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos por ventana
    message: {
        success: false,
        message: 'Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Contar solo intentos fallidos
    skipSuccessfulRequests: true,
    // Personalizar la clave (IP + email)
    keyGenerator: (req) => {
        const email = req.body?.email || 'unknown';
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        return `${ip}-${email}`;
    },
    // Log cuando se excede el límite
    handler: (req, res) => {
        console.warn(`🚫 Rate limit excedido para: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 15 minutos.'
        });
    }
});

// ============================================
// RATE LIMITER PARA REGISTRO
// Máximo 3 registros por hora por IP
// ============================================
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 registros por hora
    message: {
        success: false,
        message: 'Demasiados registros desde esta IP. Intente más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`🚫 Rate limit de registro excedido para: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Demasiados registros desde esta IP. Intente más tarde.'
        });
    }
});

// ============================================
// RATE LIMITER GENERAL (para todas las rutas API)
// Máximo 1000 requests por 15 minutos
// ============================================
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // 1000 requests por ventana
    message: {
        success: false,
        message: 'Demasiadas peticiones. Por favor, espere un momento.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // No aplicar en desarrollo para no molestar
    skip: (req) => {
        return process.env.NODE_ENV !== 'production' && req.path === '/health';
    }
});