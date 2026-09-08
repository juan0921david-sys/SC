import { createApp } from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📚 Health: http://localhost:${PORT}/health`);
    console.log(`📚 API Root: http://localhost:${PORT}/`);
});