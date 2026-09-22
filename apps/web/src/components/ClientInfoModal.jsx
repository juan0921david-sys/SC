import { useState, useEffect } from 'react';
import { creditService } from '../services/creditService';

export const ClientInfoModal = ({ client, onClose }) => {
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (client) {
            fetchCredits();
        }
    }, [client]);

    const fetchCredits = async () => {
        try {
            setLoading(true);
            const response = await creditService.getByClient(client.id);
            setCredits(response.data || []);
        } catch (error) {
            console.error('Error cargando créditos:', error);
        } finally {
            setLoading(false);
        }
    };

    // Formatear moneda
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    // Formatear fecha
    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-CO');
    };

    // Calcular estadísticas
    const totalCredits = credits.length;
    const activeCredits = credits.filter(c => c.status === 'active').length;
    const paidCredits = credits.filter(c => c.status === 'paid').length;

    const totalLent = credits.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const totalToPay = credits.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0);

    const totalPaid = credits.reduce((sum, c) => {
        const paid = c.installments?.reduce((s, i) => s + (parseFloat(i.paid_amount) || 0), 0) || 0;
        return sum + paid;
    }, 0);

    const totalPending = totalToPay - totalPaid;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="win-window modal-window modal-window-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="win-titlebar">
                    <span>👤 Perfil del Cliente</span>
                    <div className="win-titlebar-controls">
                        <button className="win-titlebar-btn" onClick={onClose}>✕</button>
                    </div>
                </div>

                <div className="win-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    {/* Información personal */}
                    <div className="form-section-title">👤 INFORMACIÓN PERSONAL</div>
                    <div className="form-grid mb-4">
                        <div className="form-group">
                            <label className="input-label">Nombre Completo:</label>
                            <div style={{ padding: '4px 0', fontWeight: 'bold', fontSize: '14px' }}>
                                {client.full_name}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="input-label">Cédula:</label>
                            <div style={{ padding: '4px 0', fontWeight: 'bold' }}>
                                {client.identification}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="input-label">Estado:</label>
                            <div style={{ padding: '4px 0' }}>
                                {client.is_active !== false ? (
                                    <span className="badge badge-active">ACTIVO</span>
                                ) : (
                                    <span className="badge badge-mora">INACTIVO</span>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="input-label">Teléfono:</label>
                            <div style={{ padding: '4px 0' }}>
                                {client.phone || 'No registrado'}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="input-label">Email:</label>
                            <div style={{ padding: '4px 0' }}>
                                {client.email || 'No registrado'}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="input-label">Fecha de Registro:</label>
                            <div style={{ padding: '4px 0' }}>
                                {formatDate(client.created_at)}
                            </div>
                        </div>
                        {client.address && (
                            <div className="form-group form-full-width">
                                <label className="input-label">Dirección:</label>
                                <div style={{ padding: '4px 0' }}>
                                    {client.address}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Estadísticas */}
                    <div className="form-section-title">📊 ESTADÍSTICAS</div>
                    <div className="dashboard-grid mb-4">
                        <div className="stat-card stat-card-blue">
                            <div className="stat-card-icon">📋</div>
                            <div className="stat-card-count">{totalCredits}</div>
                            <div className="stat-card-label">Total Créditos</div>
                        </div>
                        <div className="stat-card stat-card-green">
                            <div className="stat-card-icon">✅</div>
                            <div className="stat-card-count">{activeCredits}</div>
                            <div className="stat-card-label">Activos</div>
                        </div>
                        <div className="stat-card stat-card-yellow">
                            <div className="stat-card-icon">🏁</div>
                            <div className="stat-card-count">{paidCredits}</div>
                            <div className="stat-card-label">Pagados</div>
                        </div>
                    </div>

                    {/* Resumen financiero */}
                    <div className="form-section-title">💰 RESUMEN FINANCIERO</div>
                    <div className="form-grid mb-4">
                        <div className="form-group">
                            <label className="input-label">Total Prestado:</label>
                            <div style={{ padding: '4px 0', fontWeight: 'bold' }}>
                                {formatMoney(totalLent)}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="input-label">Total a Pagar:</label>
                            <div style={{ padding: '4px 0', fontWeight: 'bold' }}>
                                {formatMoney(totalToPay)}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="input-label">Total Pagado:</label>
                            <div style={{ padding: '4px 0', fontWeight: 'bold', color: 'var(--status-active)' }}>
                                {formatMoney(totalPaid)}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="input-label">Saldo Pendiente:</label>
                            <div style={{ padding: '4px 0', fontWeight: 'bold', color: totalPending > 0 ? '#ff0000' : 'var(--status-active)' }}>
                                {formatMoney(totalPending)}
                            </div>
                        </div>
                    </div>

                    {/* Lista de créditos */}
                    {!loading && credits.length > 0 && (
                        <>
                            <div className="form-section-title">📋 HISTORIAL DE CRÉDITOS</div>
                            <div className="table-container" style={{ maxHeight: '250px' }}>
                                <table className="table-retro">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Monto</th>
                                            <th>Estado</th>
                                            <th>Inicio</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {credits.map((credit, index) => (
                                            <tr key={credit.id}>
                                                <td><strong>#{credits.length - index}</strong></td>
                                                <td>{formatMoney(credit.amount)}</td>
                                                <td>
                                                    {credit.status === 'active' && <span className="badge badge-active">ACTIVO</span>}
                                                    {credit.status === 'paid' && <span className="badge badge-info">PAGADO</span>}
                                                    {credit.status === 'defaulted' && <span className="badge badge-mora">MORA</span>}
                                                    {credit.status === 'cancelled' && <span className="badge badge-gray">CANCELADO</span>}
                                                </td>
                                                <td>{formatDate(credit.start_date)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {loading && (
                        <div className="text-center p-4">
                            <span className="font-retro text-lg">⏳ Cargando estadísticas...</span>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={onClose} className="btn-retro">
                            ❌ Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};