import supabase from '../config/supabase.js';
import { generateReceiptPDF } from '../services/pdfService.js';

// ============================================
// FUNCIÓN: Generar número de comprobante
// ============================================
const generateReceiptNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `REC-${year}${month}${day}-${random}`;
};

// ============================================
// FUNCIÓN: Generar y guardar comprobante
// ============================================
const generateAndSaveReceipt = async (payment, installment, credit, client, user) => {
    try {
        const receiptNumber = generateReceiptNumber();

        // Calcular saldo restante
        const totalPaid = (installment.paid_amount || 0);
        const remainingBalance = installment.amount - totalPaid;

        const receiptData = {
            receipt_number: receiptNumber,
            client_name: client.full_name,
            client_identification: client.identification,
            client_phone: client.phone || 'N/A',
            client_email: client.email || 'N/A',
            credit_id: credit.id,
            credit_amount: credit.amount,
            installment_number: installment.installment_number,
            due_date: installment.due_date,
            amount: payment.amount,
            payment_type: payment.payment_type,
            payment_method: payment.payment_method,
            received_by: user?.full_name || 'Sistema',
            notes: payment.notes || '',
            remaining_balance: remainingBalance > 0 ? remainingBalance : 0,
            date: new Date().toLocaleString('es-CO')
        };

        // Generar PDF
        const pdfBuffer = await generateReceiptPDF(receiptData);

        // Guardar comprobante en la base de datos
        const { data: receipt, error } = await supabase
            .from('receipts')
            .insert([{
                payment_id: payment.id,
                receipt_number: receiptNumber,
                receipt_data: receiptData
            }])
            .select()
            .single();

        if (error) {
            console.error('Error guardando comprobante:', error);
            return null;
        }

        return {
            receipt,
            pdfBuffer,
            receiptNumber,
            publicUrl: `/api/receipts/public/${receiptNumber}`
        };

    } catch (error) {
        console.error('Error generando comprobante:', error);
        return null;
    }
};

// ============================================
// 1. REGISTRAR PAGO DE UNA CUOTA ESPECÍFICA
// ============================================
export const payInstallment = async (req, res) => {
    try {
        const { creditId, installmentId } = req.params;
        const { payment_method, notes } = req.body;

        // 1. Verificar que la cuota existe y está pendiente
        const { data: installment, error: installmentError } = await supabase
            .from('installments')
            .select(`
                *,
                credits:credit_id (
                    *,
                    clients:client_id (*)
                )
            `)
            .eq('id', installmentId)
            .eq('credit_id', creditId)
            .single();

        if (installmentError || !installment) {
            return res.status(404).json({
                success: false,
                message: 'Cuota no encontrada'
            });
        }

        if (installment.status === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Esta cuota ya está pagada'
            });
        }

        // 2. Registrar el pago
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert([{
                credit_id: creditId,
                installment_id: installmentId,
                client_id: installment.credits.client_id,
                amount: installment.amount,
                payment_type: 'full',
                payment_method: payment_method || 'cash',
                received_by: req.user?.userId || null,
                notes: notes || null
            }])
            .select()
            .single();

        if (paymentError) {
            console.error('Error registrando pago:', paymentError);
            return res.status(500).json({
                success: false,
                message: 'Error al registrar el pago'
            });
        }

        // 3. Actualizar la cuota
        const { data: updatedInstallment, error: updateError } = await supabase
            .from('installments')
            .update({
                status: 'paid',
                paid_amount: installment.amount,
                paid_at: new Date().toISOString()
            })
            .eq('id', installmentId)
            .select()
            .single();

        if (updateError) {
            console.error('Error actualizando cuota:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar la cuota'
            });
        }

        // 4. Generar comprobante
        const credit = installment.credits;
        const client = credit.clients;
        const user = req.user;

        const receiptResult = await generateAndSaveReceipt(
            payment,
            updatedInstallment,
            credit,
            client,
            user
        );

        // 5. Respuesta
        res.status(201).json({
            success: true,
            message: 'Pago registrado exitosamente',
            data: {
                payment,
                installment: updatedInstallment,
                receipt: receiptResult ? {
                    id: receiptResult.receipt.id,
                    receipt_number: receiptResult.receiptNumber,
                    download_url: receiptResult.publicUrl
                } : null
            }
        });

    } catch (error) {
        console.error('Error en payInstallment:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============================================
// 2. REGISTRAR ABONO (PAGO PARCIAL)
// ============================================
export const registerPartialPayment = async (req, res) => {
    try {
        const { creditId } = req.params;
        const { amount, payment_method, notes } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto del abono es requerido'
            });
        }

        // 1. Verificar que el crédito existe y está activo
        const { data: credit, error: creditError } = await supabase
            .from('credits')
            .select('*, clients:client_id(*)')
            .eq('id', creditId)
            .eq('status', 'active')
            .single();

        if (creditError || !credit) {
            return res.status(404).json({
                success: false,
                message: 'Crédito no encontrado o no está activo'
            });
        }

        // 2. Obtener la primera cuota pendiente (la más antigua)
        const { data: pendingInstallments, error: installmentsError } = await supabase
            .from('installments')
            .select('*')
            .eq('credit_id', creditId)
            .eq('status', 'pending')
            .order('due_date', { ascending: true })
            .limit(1);

        if (installmentsError || !pendingInstallments || pendingInstallments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hay cuotas pendientes para este crédito'
            });
        }

        const installment = pendingInstallments[0];

        // 3. Registrar el abono
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert([{
                credit_id: creditId,
                installment_id: installment.id,
                client_id: credit.client_id,
                amount: parseFloat(amount),
                payment_type: 'partial',
                payment_method: payment_method || 'cash',
                received_by: req.user?.userId || null,
                notes: notes || null
            }])
            .select()
            .single();

        if (paymentError) {
            console.error('Error registrando abono:', paymentError);
            return res.status(500).json({
                success: false,
                message: 'Error al registrar el abono'
            });
        }

        // 4. Actualizar la cuota con el abono
        const newPaidAmount = (installment.paid_amount || 0) + parseFloat(amount);
        let newStatus = 'partial';

        if (newPaidAmount >= installment.amount) {
            newStatus = 'paid';
        }

        const { data: updatedInstallment, error: updateError } = await supabase
            .from('installments')
            .update({
                paid_amount: newPaidAmount,
                status: newStatus,
                paid_at: newStatus === 'paid' ? new Date().toISOString() : null
            })
            .eq('id', installment.id)
            .select()
            .single();

        if (updateError) {
            console.error('Error actualizando cuota:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar la cuota'
            });
        }

        // 5. Generar comprobante para el abono
        const client = credit.clients;
        const user = req.user;

        const receiptResult = await generateAndSaveReceipt(
            payment,
            updatedInstallment,
            credit,
            client,
            user
        );

        // 6. Respuesta
        res.status(201).json({
            success: true,
            message: 'Abono registrado exitosamente',
            data: {
                payment,
                installment: updatedInstallment,
                remaining_balance: installment.amount - newPaidAmount,
                receipt: receiptResult ? {
                    id: receiptResult.receipt.id,
                    receipt_number: receiptResult.receiptNumber,
                    download_url: receiptResult.publicUrl
                } : null
            }
        });

    } catch (error) {
        console.error('Error en registerPartialPayment:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============================================
// 3. OBTENER PAGOS DE UN CRÉDITO
// ============================================
export const getCreditPayments = async (req, res) => {
    try {
        const { creditId } = req.params;

        const { data: payments, error } = await supabase
            .from('payments')
            .select(`
                *,
                installments:installment_id (
                    installment_number,
                    due_date,
                    amount
                ),
                users:received_by (
                    id,
                    email,
                    full_name
                )
            `)
            .eq('credit_id', creditId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error obteniendo pagos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener los pagos'
            });
        }

        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============================================
// 4. OBTENER PAGOS DE UN CLIENTE
// ============================================
export const getClientPayments = async (req, res) => {
    try {
        const { clientId } = req.params;

        const { data: payments, error } = await supabase
            .from('payments')
            .select(`
                *,
                credits:credit_id (
                    id,
                    amount,
                    status
                ),
                installments:installment_id (
                    installment_number,
                    due_date
                )
            `)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error obteniendo pagos del cliente:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener los pagos del cliente'
            });
        }

        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};