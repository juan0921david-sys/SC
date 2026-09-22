// ============================================
// COLORES Y2K - APP MÓVIL
// ============================================

export const Colors = {
    // Colores principales
    primary: '#D47A32',        // Naranja principal
    primaryDark: '#B85F28',    // Naranja oscuro
    primaryLight: '#E89A5A',   // Naranja claro

    // Fondos
    background: '#1a1a1a',     // Fondo oscuro
    backgroundLight: '#2a2a2a',
    backgroundCard: '#c0c0c0', // Gris ventana Windows 98

    // Texto
    text: '#000000',
    textLight: '#ffffff',
    textMuted: '#606060',

    // Estados
    success: '#80ff80',
    successDark: '#40c040',
    warning: '#ffff80',
    warningDark: '#c0c040',
    danger: '#ff8080',
    dangerDark: '#c04040',
    info: '#80c0ff',

    // Bordes retro
    borderLight: '#ffffff',
    borderDark: '#404040',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export type ColorKey = keyof typeof Colors;