import express from 'express';
import {
    getAllRoutes,
    getRouteById,
    createRoute,
    updateRoute,
    getRouteStats
} from '../controllers/routeController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Rutas accesibles por todos los autenticados
router.get('/', getAllRoutes);
router.get('/:id', getRouteById);
router.get('/:id/stats', getRouteStats);

// Rutas solo para admin
router.post('/', authorize('admin'), createRoute);
router.put('/:id', authorize('admin'), updateRoute);

export default router;