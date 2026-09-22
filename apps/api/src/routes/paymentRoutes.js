import express from 'express';
import {
    payInstallment,
    registerPartialPayment,
    getCreditPayments,
    getClientPayments
} from '../controllers/paymentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Rutas de pagos
router.post('/credit/:creditId/installment/:installmentId', payInstallment);
router.post('/credit/:creditId/partial', registerPartialPayment);
router.get('/credit/:creditId', getCreditPayments);
router.get('/client/:clientId', getClientPayments);

export default router;