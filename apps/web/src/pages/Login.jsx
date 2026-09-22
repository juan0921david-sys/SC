import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);
        if (!result.success) {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <div className="login-container">
            <div className="login-logo">
                <h1></h1>
                <p></p>
            </div>

            <div className="win-window login-box">
                <div className="win-titlebar">
                    <span>[ Admin Login ]</span>
                    <div className="win-titlebar-controls">
                        <button className="win-titlebar-btn">_</button>
                        <button className="win-titlebar-btn">□</button>
                        <button className="win-titlebar-btn">✕</button>
                    </div>
                </div>

                <div className="win-body">
                    {/* Marquee Retro */}
                    <div className="marquee-retro">
                        <marquee>
                            *** ACCESO RESTRINGIDO - INGRESE SUS CREDENCIALES DE ADMINISTRADOR ***
                        </marquee>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="input-group mb-3">
                            <label className="input-label"> Correo Electrónico:</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-retro"
                                placeholder="Ingrese su correo electrónico"
                                required
                            />
                        </div>

                        <div className="input-group mb-3">
                            <label className="input-label">Contraseña:</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-retro"
                                    placeholder="Ingrese su contraseña"
                                    style={{ paddingRight: '60px' }}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="btn-retro btn-sm"
                                    style={{
                                        position: 'absolute',
                                        right: '4px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        padding: '2px 6px',
                                    }}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="alert-retro alert-danger mb-3">
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-retro btn-primary btn-block btn-lg"
                        >
                            {loading ? 'CARGANDO...' : 'INGRESAR AL PANEL'}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>
                            ¿Olvidó su contraseña?{' '}
                            <a href="#" onClick={(e) => e.preventDefault()}>
                                Contacte al administrador
                            </a>
                        </p>
                        <p style={{ marginTop: '8px', color: '#808080' }}>
                            © 2026 Sistema de Cobro - Todos los derechos reservados
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};