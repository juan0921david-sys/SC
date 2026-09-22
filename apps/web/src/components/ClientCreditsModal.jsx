import { useState, useEffect } from 'react';
import { creditService } from '../services/creditService';

export const ClientCreditsModal = ({ client, onClose }) => {
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCredit, setSelectedCredit] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

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
            setError('');
        } catch (error) {
            console.error('Error cargando créditos:', error);
            setError('Error al cargar los créditos del cliente');
        } finally {
            setLoading(false);
        }
    };

    // Ver detalle de un crédito
    const handleViewDetail = async (creditId) => {
        try {
            const response = await creditService.getById(creditId);
            setSelectedCredit(response.data);
            setShowDetail(true);
        } catch (error) {
            console.error('Error cargando detalle:', error);
            setError('Error al cargar el detalle del crédito');
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

    // Obtener badge según estado
    const getStatusBadge = (status) => {
        const badges = {
            active: { class: 'badge-active', label: 'ACTIVO' },
            paid: { class: 'badge-info', label: 'PAGADO' },
            defaulted: { class: 'badge-mora', label: 'EN MORA' },
            cancelled: { class: 'badge-gray', label: 'CANCELADO' },
        };
        const badge = badges[status] || { class: 'badge-gray', label: status };
        return <span className={`badge ${badge.class}`}>{badge.label}</span>;
    };

    // Calcular progreso
    const calculateProgress = (credit) => {
        if (!credit.installments || credit.installments.length === 0) return 0;
        const paid = credit.installments.filter((i) => i.status === 'paid').length;
        return Math.round((paid / credit.installments.length) * 100);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="win-window modal-window modal-window-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="win-titlebar">
                    <span>💰 Créditos del Cliente</span>
                    <div className="win-titlebar-controls">
                        <button className="win-titlebar-btn" onClick={onClose}>✕</button>
                    </div>
                </div>

                <div className="win-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    {/* Información del cliente */}
                    <div className="alert-retro alert-info mb-3">
                        <div className="flex justify-between w-full">
                            <span>👤 Cliente:</span>
                            <strong>{client.full_name}</strong>
                        </div>
                    </div>
                    <div className="alert-retro alert-info mb-3">
                        <div className="flex justify-between w-full">
                            <span>🆔 Cédula:</span>
                            <strong>{client.identification}</strong>
                        </div>
                    </div>

                    {error && (
                        <div className="alert-retro alert-danger mb-3">
                            ⚠️ {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center p-4">
                            <span className="font-retro text-xl">⏳ Cargando créditos...</span>
                        </div>
                    ) : credits.length === 0 ? (
                        <div className="text-center p-4">
                            <span className="font-retro text-lg">
                                📭 Este cliente no tiene créditos registrados
                            </span>
                        </div>
                    ) : (
                        <>
                            <div className="form-section-title">
                                📋 HISTORIAL DE CRÉDITOS ({credits.length})
                            </div>

                            {!showDetail ? (
                                <div className="table-container" style={{ maxHeight: '400px' }}>
                                    <table className="table-retro">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Monto</th>
                                                <th>Cuotas</th>
                                                <th>Progreso</th>
                                                <th>Estado</th>
                                                <th>Inicio</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {credits.map((credit, index) => (
                                                <tr key={credit.id}>
                                                    <td><strong>#{credits.length - index}</strong></td>
                                                    <td>{formatMoney(credit.amount)}</td>
                                                    <td>
                                                        {credit.installments?.filter(i => i.status === 'paid').length || 0} / {credit.number_of_installments}
                                                    </td>
                                                    <td>
                                                        <div style={{
                                                            background: '#e0e0e0',
                                                            height: '16px',
                                                            border: '1px solid #000',
                                                            position: 'relative',
                                                        }}>
                                                            <div style={{
                                                                background: 'var(--status-active)',
                                                                height: '100%',
                                                                width: `${calculateProgress(credit)}%`,
                                                            }}></div>
                                                            <span style={{
                                                                position: 'absolute',
                                                                top: '0',
                                                                left: '50%',
                                                                transform: 'translateX(-50%)',
                                                                fontSize: '10px',
                                                                fontWeight: 'bold',
                                                                lineHeight: '14px',
                                                            }}>
                                                                {calculateProgress(credit)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>{getStatusBadge(credit.status)}</td>
                                                    <td>{formatDate(credit.start_date)}</td>
                                                    <td>
                                                        <button
                                                            className="btn-retro btn-sm"
                                                            onClick={() => handleViewDetail(credit.id)}
                                                            title="Ver detalle"
                                                        >
                                                            👁️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <>
                                    {/* Botón volver */}
                                    <div className="mb-3">
                                        <button
                                            className="btn-retro btn-sm"
                                            onClick={() => {
                                                setShowDetail(false);
                                                setSelectedCredit(null);
                                            }}
                                        >
                                            ← Volver a la lista
                                        </button>
                                    </div>

                                    {/* Detalle del crédito */}
                                    <div className="form-section-title">📄 DETALLE DEL CRÉDITO</div>
                                    <div className="form-grid mb-4">
                                        <div className="form-group">
                                            <label className="input-label">Monto:</label>
                                            <div style={{ padding: '4px 0', fontWeight: 'bold' }}>
                                                {formatMoney(selectedCredit.amount)}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Tasa:</label>
                                            <div style={{ padding: '4px 0' }}>
                                                {selectedCredit.interest_rate}%
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Frecuencia:</label>
                                            <div style={{ padding: '4px 0', textTransform: 'capitalize' }}>
                                                {selectedCredit.payment_frequency}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Total a Pagar:</label>
                                            <div style={{ padding: '4px 0', fontWeight: 'bold' }}>
                                                {formatMoney(selectedCredit.total_amount)}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Fecha Inicio:</label>
                                            <div style={{ padding: '4px 0' }}>
                                                {formatDate(selectedCredit.start_date)}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Fecha Fin:</label>
                                            <div style={{ padding: '4px 0' }}>
                                                {formatDate(selectedCredit.end_date)}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Estado:</label>
                                            <div style={{ padding: '4px 0' }}>
                                                {getStatusBadge(selectedCredit.status)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Codeudor */}
                                    {selectedCredit.guarantors && (
                                        <>
                                            <div className="form-section-title">👥 CODEUDOR</div>
                                            <div className="form-grid mb-4">
                                                <div className="form-group">
                                                    <label className="input-label">Nombre:</label>
                                                    <div style={{ padding: '4px 0' }}>
                                                        {selectedCredit.guarantors.full_name}
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label className="input-label">Cédula:</label>
                                                    <div style={{ padding: '4px 0' }}>
                                                        {selectedCredit.guarantors.identification}
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label className="input-label">Teléfono:</label>
                                                    <div style={{ padding: '4px 0' }}>
                                                        {selectedCredit.guarantors.phone || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Tabla de cuotas */}
                                    <div className="form-section-title">📅 PLAN DE PAGOS</div>
                                    <div className="table-container" style={{ maxHeight: '300px' }}>
                                        <table className="table-retro">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Vencimiento</th>
                                                    <th>Valor</th>
                                                    <th>Pagado</th>
                                                    <th>Saldo</th>
                                                    <th>Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedCredit.installments?.map((inst) => (
                                                    <tr key={inst.id}>
                                                        <td><strong>#{inst.installment_number}</strong></td>
                                                        <td>{formatDate(inst.due_date)}</td>
                                                        <td>{formatMoney(inst.amount)}</td>
                                                        <td>{formatMoney(inst.paid_amount)}</td>
                                                        <td>{formatMoney(inst.amount - (inst.paid_amount || 0))}</td>
                                                        <td>{getStatusBadge(inst.status)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </>
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