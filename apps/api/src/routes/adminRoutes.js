import express from 'express';
import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    activateUser
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticate);
router.use(authorize('admin'));

// Rutas de administración de usuarios
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/activate', activateUser);

export default router;