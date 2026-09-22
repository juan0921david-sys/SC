import { useState, useEffect } from 'react';

export const ClientFormModal = ({ client, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        identification: '',
        phone: '',
        email: '',
        address: '',
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const isEditing = !!client;

    // Cargar datos del cliente si estamos editando
    useEffect(() => {
        if (client) {
            setFormData({
                full_name: client.full_name || '',
                identification: client.identification || '',
                phone: client.phone || '',
                email: client.email || '',
                address: client.address || '',
            });
        }
    }, [client]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validaciones
        if (!formData.full_name.trim()) {
            setError('El nombre es requerido');
            return;
        }
        if (!formData.identification.trim()) {
            setError('La cédula es requerida');
            return;
        }

        setSaving(true);
        await onSave(formData);
        setSaving(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="win-window modal-window"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="win-titlebar">
                    <span>
                        {isEditing ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
                    </span>
                    <div className="win-titlebar-controls">
                        <button className="win-titlebar-btn" onClick={onClose}>
                            ✕
                        </button>
                    </div>
                </div>

                <div className="win-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-section-title">
                            {isEditing ? 'DATOS DEL CLIENTE' : 'REGISTRAR NUEVO CLIENTE'}
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="input-label">Cédula / DNI *</label>
                                <input
                                    type="text"
                                    name="identification"
                                    value={formData.identification}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="Ej: 12345678"
                                    required
                                    disabled={isEditing} // No permitir cambiar la cédula
                                />
                            </div>

                            <div className="form-group">
                                <label className="input-label">Nombre Completo *</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="Nombre y Apellidos"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="input-label">Teléfono</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="Ej: 3001234567"
                                />
                            </div>

                            <div className="form-group form-full-width">
                                <label className="input-label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="cliente@email.com"
                                />
                            </div>

                            <div className="form-group form-full-width">
                                <label className="input-label">Dirección</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="Calle / Carrera / Barrio"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="alert-retro alert-danger mt-3">
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-retro"
                                disabled={saving}
                            >
                                ❌ Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn-retro btn-primary"
                                disabled={saving}
                            >
                                {saving ? '⏳ Guardando...' : '💾 Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};