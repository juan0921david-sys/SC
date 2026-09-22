import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { clientService } from '../services/clientService';
import { creditService } from '../services/creditService';
import { NewClientCreditModal } from '../components/NewClientCreditModal';
import { ClientCreditsModal } from '../components/ClientCreditsModal';
import { ClientInfoModal } from '../components/ClientInfoModal';
import { ClientFormModal } from '../components/ClientFormModal';
import { ConfirmModal } from '../components/ConfirmModal';

export const Dashboard = () => {
    const [clients, setClients] = useState([]);
    const [clientsWithCredits, setClientsWithCredits] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Modales
    const [showNewCreditModal, setShowNewCreditModal] = useState(false);
    const [showCreditsModal, setShowCreditsModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);

    // Datos seleccionados
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [warningMessage, setWarningMessage] = useState('');

    // Cargar clientes al inicio
    useEffect(() => {
        fetchClients();
    }, []);

    // Filtrar clientes cuando cambia la búsqueda
    useEffect(() => {
        filterClients();
    }, [searchTerm, clientsWithCredits]);

    // ============================================
    // CARGAR CLIENTES CON SUS CRÉDITOS
    // ============================================
    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await clientService.getAll();
            const clientsData = response.data || [];
            setClients(clientsData);

            const clientsWithCreditInfo = await Promise.all(
                clientsData.map(async (client) => {
                    try {
                        const creditsResponse = await creditService.getByClient(client.id);
                        const credits = creditsResponse.data || [];
                        const activeCredit = credits.find(c => c.status === 'active');

                        return {
                            ...client,
                            credits,
                            activeCredit,
                            totalCredits: credits.length,
                        };
                    } catch (err) {
                        return {
                            ...client,
                            credits: [],
                            activeCredit: null,
                            totalCredits: 0,
                        };
                    }
                })
            );

            setClientsWithCredits(clientsWithCreditInfo);
            setError('');
        } catch (error) {
            console.error('Error cargando clientes:', error);
            setError('Error al cargar los clientes');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // FILTRAR CLIENTES
    // ============================================
    const filterClients = () => {
        if (!searchTerm.trim()) {
            setFilteredClients(clientsWithCredits);
            return;
        }

        const search = searchTerm.toLowerCase();
        const filtered = clientsWithCredits.filter((client) => {
            return (
                client.full_name?.toLowerCase().includes(search) ||
                client.identification?.toLowerCase().includes(search) ||
                client.phone?.toLowerCase().includes(search)
            );
        });
        setFilteredClients(filtered);
    };

    // ============================================
    // ABRIR MODAL DE NUEVO CLIENTE Y CRÉDITO
    // ============================================
    const handleNewClientCredit = () => {
        setShowNewCreditModal(true);
    };

    // ============================================
    // GUARDAR NUEVO CLIENTE Y CRÉDITO
    // ============================================
    const handleSaveNewClientCredit = async (creditData) => {
        try {
            await creditService.create(creditData);
            showSuccess('✅ Cliente y crédito registrados exitosamente');
            setShowNewCreditModal(false);
            fetchClients();
        } catch (error) {
            console.error('Error guardando:', error);
            const message = error.response?.data?.message || 'Error al guardar';
            setError(message);
        }
    };

    // ============================================
    // VER CRÉDITOS DEL CLIENTE
    // ============================================
    const handleViewCredits = (client) => {
        setSelectedClient(client);
        setShowCreditsModal(true);
    };

    // ============================================
    // VER PERFIL DEL CLIENTE
    // ============================================
    const handleViewInfo = (client) => {
        setSelectedClient(client);
        setShowInfoModal(true);
    };

    // ============================================
    // EDITAR CLIENTE
    // ============================================
    const handleEditClick = (client) => {
        if (client.activeCredit) {
            setWarningMessage(
                `El cliente ${client.full_name} aún tiene un crédito activo por pagar (${formatMoney(client.activeCredit.amount)}). ¿Deseas editarlo de todas formas?`
            );
            setSelectedClient(client);
            setShowWarningModal(true);
            return;
        }

        setSelectedClient(client);
        setShowEditModal(true);
    };

    const handleConfirmEdit = () => {
        setShowWarningModal(false);
        setShowEditModal(true);
    };

    const handleSaveEdit = async (clientData) => {
        try {
            await clientService.update(selectedClient.id, clientData);
            showSuccess('✅ Cliente actualizado exitosamente');
            setShowEditModal(false);
            setSelectedClient(null);
            fetchClients();
        } catch (error) {
            console.error('Error actualizando:', error);
            const message = error.response?.data?.message || 'Error al actualizar';
            setError(message);
        }
    };

    // ============================================
    // ELIMINAR CLIENTE
    // ============================================
    const handleDeleteClick = (client) => {
        if (client.activeCredit) {
            setWarningMessage(
                `No se puede eliminar a ${client.full_name} porque aún tiene un crédito activo por pagar. Debes esperar a que termine de pagar o cancelar el crédito primero.`
            );
            setShowWarningModal(true);
            return;
        }

        if (client.totalCredits > 0) {
            setWarningMessage(
                `El cliente ${client.full_name} tiene ${client.totalCredits} crédito(s) en su historial. No se puede eliminar permanentemente. Si quieres ocultarlo, usa la opción de desactivar.`
            );
            setShowWarningModal(true);
            return;
        }

        setClientToDelete(client);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await clientService.deletePermanent(clientToDelete.id);
            showSuccess('✅ Cliente eliminado exitosamente');
            setShowDeleteModal(false);
            setClientToDelete(null);
            fetchClients();
        } catch (error) {
            console.error('Error eliminando:', error);
            const message = error.response?.data?.message || 'Error al eliminar el cliente';
            setError(message);
            setShowDeleteModal(false);
            setClientToDelete(null);
        }
    };

    // ============================================
    // MENSAJES
    // ============================================
    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    // ============================================
    // FORMATEAR MONEDA
    // ============================================
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    // ============================================
    // CALCULAR PROGRESO DEL CRÉDITO
    // ============================================
    const calculateProgress = (credit) => {
        if (!credit.installments || credit.installments.length === 0) return 0;
        const paid = credit.installments.filter((i) => i.status === 'paid').length;
        return Math.round((paid / credit.installments.length) * 100);
    };

    // ============================================
    // OBTENER CLASE DE PROGRESO
    // ============================================
    const getProgressClass = (percentage) => {
        if (percentage < 33) return 'progress-low';
        if (percentage < 66) return 'progress-mid';
        return 'progress-high';
    };

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="dashboard">
            <Navbar />

            <div className="dashboard-content" style={{ marginTop: '20px' }}>
                <h1 className="dashboard-header">📊 Dashboard - Gestión de Clientes</h1>

                {/* Mensajes */}
                {successMessage && (
                    <div className="alert-retro alert-success mb-3">
                        {successMessage}
                    </div>
                )}
                {error && (
                    <div className="alert-retro alert-danger mb-3">
                        ⚠️ {error}
                        <button
                            onClick={() => setError('')}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Sección principal */}
                <div className="dashboard-table-section">
                    <div className="dashboard-table-header">
                        <span>📋 Gestión de Clientes</span>
                        <button
                            onClick={handleNewClientCredit}
                            className="btn-retro btn-sm btn-primary"
                        >
                            ➕ NUEVO CLIENTE Y CRÉDITO
                        </button>
                    </div>

                    <div className="dashboard-table-body">
                        {/* Barra de búsqueda */}
                        <div className="top-toolbar">
                            <div className="search-box">
                                <label>🔍 Buscar:</label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input-retro search-input"
                                    placeholder="Cédula, nombre o teléfono..."
                                />
                            </div>
                            <button onClick={fetchClients} className="btn-retro">
                                🔄 Actualizar
                            </button>
                        </div>

                        {/* Tabla */}
                        {loading ? (
                            <div className="loading-state">
                                <span>⏳ Cargando clientes...</span>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <div className="empty-state-text">
                                    {searchTerm
                                        ? 'No se encontraron clientes con ese criterio'
                                        : 'No hay clientes registrados aún'}
                                </div>
                            </div>
                        ) : (
                            <div className="table-container" style={{ maxHeight: '500px' }}>
                                <table className="table-retro">
                                    <thead>
                                        <tr>
                                            <th>Cédula</th>
                                            <th>Nombre</th>
                                            <th>Teléfono</th>
                                            <th>Crédito Activo</th>
                                            <th>Progreso</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredClients.map((client) => (
                                            <tr key={client.id}>
                                                <td>{client.identification}</td>
                                                <td>{client.full_name}</td>
                                                <td>{client.phone || '-'}</td>
                                                <td>
                                                    {client.activeCredit ? (
                                                        <strong style={{ color: 'var(--win-blue)' }}>
                                                            {formatMoney(client.activeCredit.amount)}
                                                        </strong>
                                                    ) : (
                                                        <span style={{ color: '#999' }}>Sin crédito</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {client.activeCredit ? (
                                                        <div className="progress-bar-container">
                                                            <div
                                                                className={`progress-bar-fill ${getProgressClass(calculateProgress(client.activeCredit))}`}
                                                                style={{ width: `${calculateProgress(client.activeCredit)}%` }}
                                                            ></div>
                                                            <span className="progress-bar-text">
                                                                {calculateProgress(client.activeCredit)}%
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#999' }}>-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {client.is_active !== false ? (
                                                        <span className="badge badge-active">ACTIVO</span>
                                                    ) : (
                                                        <span className="badge badge-mora">INACTIVO</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn-retro btn-sm btn-profile"
                                                        onClick={() => handleViewInfo(client)}
                                                        title="Ver perfil completo"
                                                    >
                                                        👤 PERFIL
                                                    </button>
                                                    {' '}
                                                    <button
                                                        className="btn-retro btn-sm"
                                                        onClick={() => handleEditClick(client)}
                                                        title="Editar cliente"
                                                    >
                                                        ✏️
                                                    </button>
                                                    {' '}
                                                    <button
                                                        className="btn-retro btn-sm btn-danger"
                                                        onClick={() => handleDeleteClick(client)}
                                                        title="Eliminar cliente"
                                                    >
                                                        🗑️
                                                    </button>
                                                    {' '}
                                                    <button
                                                        className="btn-retro btn-sm btn-credits"
                                                        onClick={() => handleViewCredits(client)}
                                                        title="Ver créditos del cliente"
                                                    >
                                                        💰 CRÉDITOS
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Barra de estado */}
                        <div className="status-bar">
                            <span className="status-bar-item">
                                📊 Mostrando <strong>{filteredClients.length}</strong> de {clientsWithCredits.length} clientes
                            </span>
                            <span className="status-bar-item">
                                <span className="status-indicator status-indicator-green"></span>
                                Conectado
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================ */}
            {/* MODALES */}
            {/* ============================================ */}

            {showNewCreditModal && (
                <NewClientCreditModal
                    onSave={handleSaveNewClientCredit}
                    onClose={() => setShowNewCreditModal(false)}
                />
            )}

            {showCreditsModal && selectedClient && (
                <ClientCreditsModal
                    client={selectedClient}
                    onClose={() => {
                        setShowCreditsModal(false);
                        setSelectedClient(null);
                    }}
                />
            )}

            {showInfoModal && selectedClient && (
                <ClientInfoModal
                    client={selectedClient}
                    onClose={() => {
                        setShowInfoModal(false);
                        setSelectedClient(null);
                    }}
                />
            )}

            {showEditModal && selectedClient && (
                <ClientFormModal
                    client={selectedClient}
                    onSave={handleSaveEdit}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedClient(null);
                    }}
                />
            )}

            {showDeleteModal && clientToDelete && (
                <ConfirmModal
                    title="🗑️ Eliminar Cliente"
                    message={`¿Estás seguro de eliminar permanentemente a ${clientToDelete.full_name}? Esta acción NO se puede deshacer.`}
                    confirmText="🗑️ Eliminar"
                    onConfirm={handleConfirmDelete}
                    onCancel={() => {
                        setShowDeleteModal(false);
                        setClientToDelete(null);
                    }}
                    danger={true}
                />
            )}

            {showWarningModal && (
                <div className="modal-overlay" onClick={() => setShowWarningModal(false)}>
                    <div
                        className="win-window modal-window modal-window-sm modal-warning"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="win-titlebar">
                            <span>⚠️ Aviso del Sistema</span>
                            <div className="win-titlebar-controls">
                                <button className="win-titlebar-btn" onClick={() => setShowWarningModal(false)}>
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="win-body">
                            <div style={{ padding: '20px 0', textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                                <p style={{ fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>{warningMessage}</p>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowWarningModal(false)}
                                    className="btn-retro"
                                >
                                    Cerrar
                                </button>
                                {selectedClient?.activeCredit && warningMessage.includes('¿Deseas editarlo') && (
                                    <button
                                        onClick={handleConfirmEdit}
                                        className="btn-retro btn-warning"
                                    >
                                        Sí, editar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};