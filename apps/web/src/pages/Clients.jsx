import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { clientService } from '../services/clientService';
import { ClientFormModal } from '../components/ClientFormModal';
import { ConfirmModal } from '../components/ConfirmModal';

export const Clients = () => {
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Modales
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [clientToDelete, setClientToDelete] = useState(null);

    // Cargar clientes al inicio
    useEffect(() => {
        fetchClients();
    }, []);

    // Filtrar clientes cuando cambia la búsqueda
    useEffect(() => {
        filterClients();
    }, [searchTerm, clients]);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await clientService.getAll();
            setClients(response.data || []);
            setError('');
        } catch (error) {
            console.error('Error cargando clientes:', error);
            setError('Error al cargar los clientes');
        } finally {
            setLoading(false);
        }
    };

    const filterClients = () => {
        if (!searchTerm.trim()) {
            setFilteredClients(clients);
            return;
        }

        const search = searchTerm.toLowerCase();
        const filtered = clients.filter((client) => {
            return (
                client.full_name?.toLowerCase().includes(search) ||
                client.identification?.toLowerCase().includes(search) ||
                client.phone?.toLowerCase().includes(search) ||
                client.email?.toLowerCase().includes(search)
            );
        });
        setFilteredClients(filtered);
    };

    // Abrir modal para crear cliente
    const handleCreateClick = () => {
        setEditingClient(null);
        setShowFormModal(true);
    };

    // Abrir modal para editar cliente
    const handleEditClick = (client) => {
        setEditingClient(client);
        setShowFormModal(true);
    };

    // Guardar cliente (crear o actualizar)
    const handleSaveClient = async (clientData) => {
        try {
            if (editingClient) {
                await clientService.update(editingClient.id, clientData);
                showSuccess('✅ Cliente actualizado exitosamente');
            } else {
                await clientService.create(clientData);
                showSuccess('✅ Cliente creado exitosamente');
            }
            setShowFormModal(false);
            setEditingClient(null);
            fetchClients();
        } catch (error) {
            console.error('Error guardando cliente:', error);
            const message = error.response?.data?.message || 'Error al guardar el cliente';
            setError(message);
        }
    };

    // Abrir modal de confirmación para eliminar
    const handleDeleteClick = (client) => {
        setClientToDelete(client);
        setShowDeleteModal(true);
    };

    // Confirmar eliminación
    const handleConfirmDelete = async () => {
        try {
            await clientService.deletePermanent(clientToDelete.id);
            showSuccess('✅ Cliente eliminado exitosamente');
            setShowDeleteModal(false);
            setClientToDelete(null);
            fetchClients();
        } catch (error) {
            console.error('Error eliminando cliente:', error);
            const message = error.response?.data?.message || 'Error al eliminar el cliente';
            setError(message);
            setShowDeleteModal(false);
            setClientToDelete(null);
        }
    };

    // Ver créditos del cliente
    const handleViewCredits = (client) => {
        window.location.href = `/credits?client=${client.id}`;
    };

    // Mostrar mensaje de éxito temporal
    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    return (
        <div className="clients-page">
            <Navbar />

            <div className="clients-content" style={{ marginTop: '20px' }}>
                <h1 className="clients-header">👥 Gestión de Clientes</h1>

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
                        <span>📋 Lista de Clientes</span>
                        <button
                            onClick={handleCreateClick}
                            className="btn-retro btn-sm btn-primary"
                        >
                            ➕ NUEVO CLIENTE
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
                                    placeholder="Cédula, nombre, teléfono o email..."
                                />
                            </div>
                            <button
                                onClick={fetchClients}
                                className="btn-retro"
                            >
                                🔄 Actualizar
                            </button>
                        </div>

                        {/* Tabla */}
                        {loading ? (
                            <div className="text-center p-4">
                                <span className="font-retro text-xl">⏳ Cargando clientes...</span>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="text-center p-4">
                                <span className="font-retro text-lg">
                                    {searchTerm
                                        ? '🔍 No se encontraron clientes con ese criterio'
                                        : '📭 No hay clientes registrados aún'}
                                </span>
                            </div>
                        ) : (
                            <div className="table-container" style={{ maxHeight: '500px' }}>
                                <table className="table-retro">
                                    <thead>
                                        <tr>
                                            <th>Cédula</th>
                                            <th>Nombre</th>
                                            <th>Teléfono</th>
                                            <th>Email</th>
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
                                                <td>{client.email || '-'}</td>
                                                <td>
                                                    {client.is_active !== false ? (
                                                        <span className="badge badge-active">ACTIVO</span>
                                                    ) : (
                                                        <span className="badge badge-mora">INACTIVO</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {/* Botón Editar */}
                                                    <button
                                                        className="btn-retro btn-sm"
                                                        onClick={() => handleEditClick(client)}
                                                        title="Editar cliente"
                                                    >
                                                        ✏️
                                                    </button>
                                                    {' '}

                                                    {/* Botón Eliminar */}
                                                    <button
                                                        className="btn-retro btn-sm btn-danger"
                                                        onClick={() => handleDeleteClick(client)}
                                                        title="Eliminar cliente"
                                                    >
                                                        🗑️
                                                    </button>
                                                    {' '}

                                                    {/* Botón Ver Créditos (destacado) */}
                                                    <button
                                                        className="btn-retro btn-sm btn-credits"
                                                        onClick={() => handleViewCredits(client)}
                                                        title="Ver créditos del cliente"
                                                    >
                                                        💰 VER CRÉDITOS
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
                                📊 Mostrando <strong>{filteredClients.length}</strong> de {clients.length} clientes
                            </span>
                            <span className="status-bar-item">
                                <span className="status-indicator status-indicator-green"></span>
                                Conectado
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de formulario */}
            {showFormModal && (
                <ClientFormModal
                    client={editingClient}
                    onSave={handleSaveClient}
                    onClose={() => {
                        setShowFormModal(false);
                        setEditingClient(null);
                    }}
                />
            )}

            {/* Modal de confirmación de eliminación */}
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
        </div>
    );
};