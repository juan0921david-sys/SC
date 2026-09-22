import supabase from '../config/supabase.js';
import { generateReceiptPDF } from '../services/pdfService.js';
// ============================================
// 3. DESCARGAR COMPROBANTE PÚBLICO (sin autenticación)
// ============================================
export const downloadReceiptPublic = async (req, res) => {
    try {
        const { receiptNumber } = req.params;

        // Buscar el comprobante por número
        const { data: receipt, error } = await supabase
            .from('receipts')
            .select('*')
            .eq('receipt_number', receiptNumber)
            .single();

        if (error || !receipt) {
            return res.status(404).send('Comprobante no encontrado');
        }

        // Generar el PDF
        const pdfBuffer = await generateReceiptPDF(receipt.receipt_data);

        // Enviar el PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=comprobante-${receipt.receipt_number}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error en downloadReceiptPublic:', error);
        res.status(500).send('Error al generar el comprobante');
    }
};
// ============================================
// 1. DESCARGAR COMPROBANTE DE UN PAGO
// ============================================
export const downloadReceipt = async (req, res) => {
    try {
        const { paymentId } = req.params;

        // 1. Verificar que el pago existe
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .select(`
                *,
                credits:credit_id (
                    id,
                    amount,
                    client_id,
                    clients:client_id (
                        full_name,
                        identification,
                        phone,
                        email
                    )
                ),
                installments:installment_id (
                    installment_number,
                    due_date,
                    amount as installment_amount,
                    paid_amount
                ),
                users:received_by (
                    full_name
                )
            `)
            .eq('id', paymentId)
            .single();

        if (paymentError || !payment) {
            return res.status(404).json({
                success: false,
                message: 'Pago no encontrado'
            });
        }

        // 2. Verificar si ya existe un comprobante
        let { data: existingReceipt, error: receiptError } = await supabase
            .from('receipts')
            .select('*')
            .eq('payment_id', paymentId)
            .single();

        // Si no existe, lo creamos
        if (!existingReceipt) {
            const receiptNumber = `REC-${Date.now()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
            const client = payment.credits.clients;
            const credit = payment.credits;
            const installment = payment.installments;

            const receiptData = {
                receipt_number: receiptNumber,
                client_name: client?.full_name || 'N/A',
                client_identification: client?.identification || 'N/A',
                client_phone: client?.phone || 'N/A',
                client_email: client?.email || 'N/A',
                credit_id: credit?.id || 'N/A',
                credit_amount: credit?.amount || 0,
                installment_number: installment?.installment_number || 'N/A',
                due_date: installment?.due_date || 'N/A',
                amount: payment.amount,
                payment_type: payment.payment_type,
                payment_method: payment.payment_method,
                received_by: payment.users?.full_name || 'Sistema',
                notes: payment.notes || '',
                remaining_balance: (installment?.amount || 0) - (installment?.paid_amount || 0)
            };

            const { data: newReceipt, error: createError } = await supabase
                .from('receipts')
                .insert([{
                    payment_id: paymentId,
                    receipt_number: receiptNumber,
                    receipt_data: receiptData
                }])
                .select()
                .single();

            if (createError) {
                console.error('Error creando comprobante:', createError);
                return res.status(500).json({
                    success: false,
                    message: 'Error al generar el comprobante'
                });
            }

            existingReceipt = newReceipt;
        }

        // 3. Generar el PDF
        const pdfBuffer = await generateReceiptPDF(existingReceipt.receipt_data);

        // 4. Enviar el PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=comprobante-${existingReceipt.receipt_number}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error en downloadReceipt:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============================================
// 2. OBTENER INFORMACIÓN DEL COMPROBANTE
// ============================================
export const getReceiptInfo = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const { data: receipt, error } = await supabase
            .from('receipts')
            .select('*')
            .eq('payment_id', paymentId)
            .single();

        if (error || !receipt) {
            return res.status(404).json({
                success: false,
                message: 'Comprobante no encontrado'
            });
        }

        res.json({
            success: true,
            data: receipt
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};