const request = require('supertest');
const app = require('../server');
const db = require('../config/db');

describe('Reserva endpoints', () => {
    let userToken, parqueaderoId, reservaId;

    beforeAll(async () => {
        // Crear usuario de prueba
        const timestamp = Date.now();
        const userEmail = `usuario+${timestamp}@gmail.com`;
        const userRes = await request(app)
            .post('/api/auth/register')
            .send({
                nombre: 'Usuario Test',
                email: userEmail,
                password: '123456'
            });

        // Login usuario
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: userEmail, password: '123456' });

        userToken = loginRes.body.token;

        // Crear parqueadero de prueba
        const parqueaderoEmail = `parqueadero+${timestamp}@gmail.com`;
        const parqueaderoRes = await request(app)
            .post('/api/parqueaderos/register')
            .send({
                nombre: 'Parqueadero Test',
                direccion: 'Calle Test 123',
                cupos: 10,
                email: parqueaderoEmail,
                password: '123456',
                latitud: 1.2136,
                longitud: -77.2811
            });

        parqueaderoId = parqueaderoRes.body.id;
    });

    test('crear reserva missing fields should return 400', async () => {
        const res = await request(app)
            .post('/api/reservas')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ parqueadero_id: parqueaderoId });

        expect(res.statusCode).toBe(400);
    });

    test('crear reserva should succeed', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const res = await request(app)
            .post('/api/reservas')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                usuario_id: 1, // TODO: obtener del token
                parqueadero_id: parqueaderoId,
                fecha_reserva: tomorrow.toISOString().split('T')[0],
                hora_inicio: '10:00:00',
                hora_fin: '11:00:00',
                tipo_vehiculo: 'carro',
                observaciones: 'Test reserva'
            });

        expect([200, 201]).toContain(res.statusCode);
        expect(res.body).toHaveProperty('id');
        reservaId = res.body.id;
    });

    test('get reservas usuario should return array', async () => {
        const res = await request(app)
            .get('/api/reservas/usuario/1') // TODO: obtener del token
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('cancelar reserva should succeed', async () => {
        const res = await request(app)
            .put(`/api/reservas/${reservaId}/cancelar`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toBe(200);
    });

    test('completar reserva should succeed', async () => {
        // Crear otra reserva para completar
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const createRes = await request(app)
            .post('/api/reservas')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                usuario_id: 1,
                parqueadero_id: parqueaderoId,
                fecha_reserva: tomorrow.toISOString().split('T')[0],
                hora_inicio: '12:00:00',
                hora_fin: '13:00:00',
                tipo_vehiculo: 'moto',
                observaciones: 'Test completar'
            });

        const newReservaId = createRes.body.id;

        const res = await request(app)
            .put(`/api/reservas/${newReservaId}/completar`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toBe(200);
    });

    afterAll(async () => {
        if (db && typeof db.end === 'function') {
            await new Promise((resolve) => db.end(() => resolve()));
        }
    });
});
