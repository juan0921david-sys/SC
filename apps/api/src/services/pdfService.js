import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// GENERAR COMPROBANTE DE PAGO (PDF)
// ============================================
export const generateReceiptPDF = (receiptData) => {
    return new Promise((resolve, reject) => {
        try {
            const {
                receipt_number,
                client_name,
                client_identification,
                client_phone,
                client_email,
                credit_id,
                installment_number,
                due_date,
                amount,
                payment_type,
                payment_method,
                received_by,
                notes,
                remaining_balance,
                date
            } = receiptData;

            // Crear el PDF
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50
            });

            // Buffer para almacenar el PDF
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                resolve(pdfBuffer);
            });

            // ============================================
            // 1. ENCABEZADO - EMPRESA
            // ============================================
            doc.fontSize(20)
                .font('Helvetica-Bold')
                .text('SISTEMA DE COBRO', { align: 'center' });

            doc.fontSize(10)
                .font('Helvetica')
                .text('', { align: 'center' })
                .text('Tel: xxxxxxxxxx', { align: 'center' })
                .text('Email: cobros@empresa.com', { align: 'center' })
                .moveDown();

            // Línea separadora
            doc.moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .stroke();
            doc.moveDown();

            // ============================================
            // 2. TÍTULO - COMPROBANTE
            // ============================================
            doc.fontSize(16)
                .font('Helvetica-Bold')
                .text('COMPROBANTE DE PAGO', { align: 'center' })
                .moveDown();

            doc.fontSize(10)
                .font('Helvetica')
                .text(`Número: ${receipt_number}`, { align: 'center' })
                .text(`Fecha: ${date || new Date().toLocaleString('es-CO')}`, { align: 'center' })
                .moveDown();

            // Línea separadora
            doc.moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .stroke();
            doc.moveDown();

            // ============================================
            // 3. INFORMACIÓN DEL CLIENTE
            // ============================================
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .text(' DATOS DEL CLIENTE')
                .moveDown(0.5);

            doc.fontSize(10)
                .font('Helvetica')
                .text(`Nombre: ${client_name || 'N/A'}`)
                .text(`Cédula: ${client_identification || 'N/A'}`)
                .text(`Teléfono: ${client_phone || 'N/A'}`)
                .text(`Email: ${client_email || 'N/A'}`)
                .moveDown();

            // Línea separadora
            doc.moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .stroke();
            doc.moveDown();

            // ============================================
            // 4. INFORMACIÓN DEL PAGO
            // ============================================
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .text(' DETALLE DEL PAGO')
                .moveDown(0.5);

            doc.fontSize(10)
                .font('Helvetica')
                .text(`Crédito #: ${credit_id || 'N/A'}`)
                .text(`Cuota #: ${installment_number || 'N/A'}`)
                .text(`Fecha de vencimiento: ${due_date || 'N/A'}`)
                .moveDown();

            // Monto pagado (destacado)
            doc.fontSize(14)
                .font('Helvetica-Bold')
                .text(`Valor pagado: $${parseFloat(amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, { align: 'center' })
                .moveDown();

            doc.fontSize(10)
                .font('Helvetica')
                .text(`Tipo: ${payment_type === 'full' ? 'PAGO COMPLETO' : payment_type === 'partial' ? 'ABONO' : 'SOBREPAGO'}`)
                .text(`Método de pago: ${payment_method || 'N/A'}`)
                .text(`Recibido por: ${received_by || 'N/A'}`)
                .moveDown();

            if (notes) {
                doc.text(`Observaciones: ${notes}`)
                    .moveDown();
            }

            // Saldo restante
            if (remaining_balance !== undefined && remaining_balance !== null) {
                doc.fontSize(12)
                    .font('Helvetica-Bold')
                    .text(`Saldo restante: $${parseFloat(remaining_balance).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`)
                    .moveDown();
            }

            // Línea separadora
            doc.moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .stroke();
            doc.moveDown();

            // ============================================
            // 5. PIE DE PÁGINA
            // ============================================
            doc.fontSize(10)
                .font('Helvetica')
                .text('✅ Este comprobante es válido como soporte de pago', { align: 'center' })
                .moveDown();

            doc.fontSize(8)
                .font('Helvetica')
                .text(`Generado el ${new Date().toLocaleString('es-CO')}`, { align: 'center' })
                .text('Sistema de Cobro - Todos los derechos reservados', { align: 'center' });

            // Finalizar PDF
            doc.end();

        } catch (error) {
            console.error('Error generando PDF:', error);
            reject(error);
        }
    });
};