import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/', label: '📊 Dashboard' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar-retro">
            <div className="flex items-center gap-4">
                <span className="navbar-title">🏢 Sistema de Cobro</span>
                <div className="flex items-center gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="btn-retro btn-sm"
                            style={{
                                background: isActive(item.path) ? 'var(--y2k-yellow)' : 'var(--win-bg)',
                            }}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
            <div className="navbar-user">
                <span className="navbar-username">
                    👤 {user?.full_name || user?.email}
                </span>
                <span className="badge badge-info">
                    {user?.role === 'admin' ? 'ADMIN' : 'TRABAJADOR'}
                </span>
                <button onClick={logout} className="navbar-logout">
                    🚪 Salir
                </button>
            </div>
        </nav>
    );
};