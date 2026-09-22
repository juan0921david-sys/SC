import express from 'express';
import { downloadReceipt, downloadReceiptPublic, getReceiptInfo } from '../controllers/receiptController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ruta pública (para descargar desde el navegador)
router.get('/public/:receiptNumber', downloadReceiptPublic);

// Rutas protegidas (requieren autenticación)
router.use(authenticate);
router.get('/payment/:paymentId/download', downloadReceipt);
router.get('/payment/:paymentId', getReceiptInfo);

export default router;