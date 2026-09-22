import express from 'express';
import {
    createClient,
    getAllClients,
    getClientById,
    searchClients,
    updateClient,
    deleteClient,
    activateClient,
    deleteClientPermanent
} from '../controllers/clientController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas públicas (para workers y admins)
router.post('/', createClient);
router.get('/', getAllClients);
router.get('/search', searchClients);
router.get('/:id', getClientById);
router.put('/:id', updateClient);

// Soft delete (desactivar) - disponible para todos
router.delete('/:id', deleteClient);
router.patch('/:id/activate', activateClient);

// Eliminación permanente - SOLO ADMIN
router.delete('/:id/permanent', authorize('admin'), deleteClientPermanent);

export default router;