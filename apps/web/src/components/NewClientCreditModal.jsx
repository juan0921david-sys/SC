import { useState } from 'react';

export const NewClientCreditModal = ({ onSave, onClose }) => {
    // ============================================
    // ESTADO DEL FORMULARIO
    // ============================================
    const [formData, setFormData] = useState({
        // Datos del cliente
        client_full_name: '',
        client_identification: '',
        client_phone: '',
        client_email: '',
        client_address: '',

        // Datos del codeudor (opcional)
        guarantor_full_name: '',
        guarantor_identification: '',
        guarantor_phone: '',
        guarantor_email: '',

        // Datos del crédito
        amount: '',
        interest_rate: '',
        payment_frequency: 'monthly',
        number_of_installments: '',
        start_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const [simulation, setSimulation] = useState(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [simulating, setSimulating] = useState(false);

    // ============================================
    // MANEJO DE CAMBIOS
    // ============================================
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Si cambia algún dato del crédito, limpiar la simulación
        if (['amount', 'interest_rate', 'payment_frequency', 'number_of_installments', 'start_date'].includes(name)) {
            setSimulation(null);
        }
    };

    // ============================================
    // SIMULAR PLAN DE PAGOS
    // ============================================
    const handleSimulate = () => {
        setError('');

        // Validaciones
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setError('El monto del crédito es requerido');
            return;
        }
        if (!formData.number_of_installments || parseInt(formData.number_of_installments) <= 0) {
            setError('El número de cuotas es requerido');
            return;
        }
        if (!formData.start_date) {
            setError('La fecha de inicio es requerida');
            return;
        }

        setSimulating(true);

        try {
            const amount = parseFloat(formData.amount);
            const rate = parseFloat(formData.interest_rate) || 0;
            const installments = parseInt(formData.number_of_installments);
            const startDate = new Date(formData.start_date);
            const frequency = formData.payment_frequency;

            // Calcular interés simple
            const monthlyInterest = rate / 100;
            const totalInterest = amount * monthlyInterest * (installments / 12);
            const totalAmount = amount + totalInterest;
            const installmentAmount = totalAmount / installments;

            // Frecuencia en días
            const frequencyMap = {
                daily: 1,
                weekly: 7,
                biweekly: 15,
                monthly: 30,
            };
            const daysToAdd = frequencyMap[frequency] || 30;

            // Generar cuotas
            const generatedInstallments = [];
            let currentDate = new Date(startDate);
            let remainingBalance = totalAmount;

            for (let i = 1; i <= installments; i++) {
                const interest = remainingBalance * monthlyInterest / (12 / daysToAdd * 30);
                const principal = installmentAmount - interest;
                remainingBalance -= principal;

                generatedInstallments.push({
                    installment_number: i,
                    due_date: new Date(currentDate).toLocaleDateString('es-CO'),
                    amount: Math.round(installmentAmount),
                    principal: Math.round(principal),
                    interest: Math.round(interest),
                    balance: Math.round(remainingBalance > 0 ? remainingBalance : 0),
                });

                currentDate.setDate(currentDate.getDate() + daysToAdd);
            }

            setSimulation({
                total_amount: Math.round(totalAmount),
                installment_amount: Math.round(installmentAmount),
                total_interest: Math.round(totalInterest),
                installments: generatedInstallments,
            });

        } catch (error) {
            console.error('Error simulando:', error);
            setError('Error al simular el plan de pagos');
        } finally {
            setSimulating(false);
        }
    };

    // ============================================
    // GUARDAR CLIENTE Y CRÉDITO
    // ============================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validaciones
        if (!formData.client_full_name.trim()) {
            setError('El nombre del cliente es requerido');
            return;
        }
        if (!formData.client_identification.trim()) {
            setError('La cédula del cliente es requerida');
            return;
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setError('El monto del crédito es requerido');
            return;
        }
        if (!formData.number_of_installments || parseInt(formData.number_of_installments) <= 0) {
            setError('El número de cuotas es requerido');
            return;
        }

        if (!simulation) {
            setError('Debe simular el plan de pagos antes de guardar');
            return;
        }

        setSaving(true);

        // Preparar datos para enviar al backend
        const creditData = {
            // Datos del cliente
            client_full_name: formData.client_full_name.trim(),
            client_identification: formData.client_identification.trim(),
            client_phone: formData.client_phone.trim() || null,
            client_email: formData.client_email.trim() || null,
            client_address: formData.client_address.trim() || null,

            // Datos del codeudor
            guarantor_full_name: formData.guarantor_full_name.trim() || null,
            guarantor_identification: formData.guarantor_identification.trim() || null,
            guarantor_phone: formData.guarantor_phone.trim() || null,
            guarantor_email: formData.guarantor_email.trim() || null,

            // Datos del crédito
            amount: parseFloat(formData.amount),
            interest_rate: parseFloat(formData.interest_rate) || 0,
            payment_frequency: formData.payment_frequency,
            number_of_installments: parseInt(formData.number_of_installments),
            start_date: formData.start_date,
            notes: formData.notes.trim() || null,
        };

        await onSave(creditData);
        setSaving(false);
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
    // RENDER
    // ============================================
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="win-window modal-window modal-window-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="win-titlebar">
                    <span>➕ Nuevo Cliente y Crédito</span>
                    <div className="win-titlebar-controls">
                        <button className="win-titlebar-btn" onClick={onClose}>
                            ✕
                        </button>
                    </div>
                </div>

                <div className="win-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    <form onSubmit={handleSubmit}>
                        {/* ============================================ */}
                        {/* SECCIÓN 1: DATOS DEL CLIENTE */}
                        {/* ============================================ */}
                        <div className="form-section-title">👤 1. DATOS DEL CLIENTE TITULAR</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="input-label">Cédula / DNI *</label>
                                <input
                                    type="text"
                                    name="client_identification"
                                    value={formData.client_identification}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="Ej: 11102938"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="input-label">Nombre Completo *</label>
                                <input
                                    type="text"
                                    name="client_full_name"
                                    value={formData.client_full_name}
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
                                    name="client_phone"
                                    value={formData.client_phone}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="Ej: 3001234567"
                                />
                            </div>

                            <div className="form-group">
                                <label className="input-label">Email</label>
                                <input
                                    type="email"
                                    name="client_email"
                                    value={formData.client_email}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="cliente@email.com"
                                />
                            </div>

                            <div className="form-group form-full-width">
                                <label className="input-label">Dirección de Residencia</label>
                                <input
                                    type="text"
                                    name="client_address"
                                    value={formData.client_address}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="Calle / Carrera / Barrio"
                                />
                            </div>
                        </div>

                        {/* ============================================ */}
                        {/* SECCIÓN 2: DATOS DEL CODEUDOR */}
                        {/* ============================================ */}
                        <div className="form-section-title">👥 2. DATOS DEL CODEUDOR (OPCIONAL)</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="input-label">Cédula Codeudor</label>
                                <input
                                    type="text"
                                    name="guarantor_identification"
                                    value={formData.guarantor_identification}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="DNI Garante"
                                />
                            </div>

                            <div className="form-group">
                                <label className="input-label">Nombre Codeudor</label>
                                <input
                                    type="text"
                                    name="guarantor_full_name"
                                    value={formData.guarantor_full_name}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="Nombre completo"
                                />
                            </div>

                            <div className="form-group">
                                <label className="input-label">Teléfono Codeudor</label>
                                <input
                                    type="text"
                                    name="guarantor_phone"
                                    value={formData.guarantor_phone}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="Teléfono de contacto"
                                />
                            </div>

                            <div className="form-group">
                                <label className="input-label">Email Codeudor</label>
                                <input
                                    type="email"
                                    name="guarantor_email"
                                    value={formData.guarantor_email}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="codeudor@email.com"
                                />
                            </div>
                        </div>

                        {/* ============================================ */}
                        {/* SECCIÓN 3: CONDICIONES DEL CRÉDITO */}
                        {/* ============================================ */}
                        <div className="form-section-title">💰 3. CONDICIONES DEL CRÉDITO</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="input-label">Monto Solicitado ($) *</label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="Ej: 600000"
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="input-label">Tasa de Interés (%)</label>
                                <input
                                    type="number"
                                    name="interest_rate"
                                    value={formData.interest_rate}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="Ej: 20"
                                    min="0"
                                    step="0.1"
                                />
                            </div>

                            <div className="form-group">
                                <label className="input-label">Modalidad de Pago *</label>
                                <select
                                    name="payment_frequency"
                                    value={formData.payment_frequency}
                                    onChange={handleChange}
                                    className="input-retro"
                                >
                                    <option value="daily">Diario</option>
                                    <option value="weekly">Semanal</option>
                                    <option value="biweekly">Quincenal</option>
                                    <option value="monthly">Mensual</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="input-label">Número de Cuotas *</label>
                                <input
                                    type="number"
                                    name="number_of_installments"
                                    value={formData.number_of_installments}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="Ej: 12"
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="input-label">Fecha de Inicio *</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className="input-retro"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="input-label">Notas</label>
                                <input
                                    type="text"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    className="input-retro"
                                    placeholder="Observaciones (opcional)"
                                />
                            </div>
                        </div>

                        {/* Botón de simular */}
                        <div className="flex justify-end mt-3">
                            <button
                                type="button"
                                onClick={handleSimulate}
                                className="btn-retro"
                                style={{ background: '#ffff80' }}
                                disabled={simulating}
                            >
                                {simulating ? '⏳ Calculando...' : '⚡ SIMULAR PLAN DE PAGOS'}
                            </button>
                        </div>

                        {/* ============================================ */}
                        {/* SECCIÓN 4: SIMULACIÓN DEL PLAN DE PAGOS */}
                        {/* ============================================ */}
                        {simulation && (
                            <>
                                <div className="form-section-title" style={{ background: '#008000' }}>
                                    📅 4. PLAN DE PAGOS SIMULADO
                                </div>

                                {/* Resumen */}
                                <div className="alert-retro alert-info mb-3">
                                    <div className="flex justify-between w-full">
                                        <span>💰 Total a pagar:</span>
                                        <strong>{formatMoney(simulation.total_amount)}</strong>
                                    </div>
                                </div>
                                <div className="alert-retro alert-warning mb-3">
                                    <div className="flex justify-between w-full">
                                        <span>📊 Valor de cada cuota:</span>
                                        <strong>{formatMoney(simulation.installment_amount)}</strong>
                                    </div>
                                </div>
                                <div className="alert-retro alert-success mb-3">
                                    <div className="flex justify-between w-full">
                                        <span>📈 Total intereses:</span>
                                        <strong>{formatMoney(simulation.total_interest)}</strong>
                                    </div>
                                </div>

                                {/* Tabla de cuotas */}
                                <div className="table-container" style={{ maxHeight: '200px', marginBottom: '16px' }}>
                                    <table className="table-retro">
                                        <thead>
                                            <tr>
                                                <th>Cuota #</th>
                                                <th>Fecha</th>
                                                <th>Valor</th>
                                                <th>Interés</th>
                                                <th>Capital</th>
                                                <th>Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {simulation.installments.map((inst) => (
                                                <tr key={inst.installment_number}>
                                                    <td><strong>#{inst.installment_number}</strong></td>
                                                    <td>{inst.due_date}</td>
                                                    <td>{formatMoney(inst.amount)}</td>
                                                    <td>{formatMoney(inst.interest)}</td>
                                                    <td>{formatMoney(inst.principal)}</td>
                                                    <td>{formatMoney(inst.balance)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* ============================================ */}
                        {/* MENSAJE DE ERROR */}
                        {/* ============================================ */}
                        {error && (
                            <div className="alert-retro alert-danger mt-3">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* ============================================ */}
                        {/* BOTONES */}
                        {/* ============================================ */}
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
                                className="btn-retro btn-success"
                                disabled={saving || !simulation}
                            >
                                {saving ? '⏳ Guardando...' : '💾 GUARDAR CLIENTE Y CRÉDITO'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};