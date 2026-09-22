import express from 'express';
import {
    createCredit,
    getAllCredits,
    getCreditById,
    getClientCredits
} from '../controllers/creditController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createCredit);
router.get('/', getAllCredits);
router.get('/:id', getCreditById);
router.get('/client/:clientId', getClientCredits);

export default router;