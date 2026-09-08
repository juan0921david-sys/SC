import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('API behavior', () => {
    it('returns the API status', async () => {
        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
    });

    it('returns a JSON error for an unknown route', async () => {
        const response = await request(app).get('/does-not-exist');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: { code: 'NOT_FOUND' }
        });
    });

    describe('Authentication', () => {
        it('should register a new user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: '123456',
                    full_name: 'Test User',
                    role: 'worker'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
        });

        it('should login an existing user', async () => {
            // Primero registramos
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'login@example.com',
                    password: '123456',
                    full_name: 'Login User'
                });

            // Luego hacemos login
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: '123456'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
        });

        it('should reject login with wrong password', async () => {
            // Registrar usuario
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'wrongpass@example.com',
                    password: '123456'
                });

            // Intentar login con contraseña incorrecta
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrongpass@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });
});