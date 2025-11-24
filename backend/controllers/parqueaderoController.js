const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'secreto123';

// Obtener lista de parqueaderos
exports.getParqueaderos = (req, res) => {
    const sql = 'SELECT id, nombre, direccion, cupos, disponible, latitud, longitud FROM parqueaderos';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener parqueaderos:', err);
            return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
        }
        res.json(results);
    });
};

// Obtener un parqueadero específico
exports.getParqueadero = (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT id, nombre, direccion, cupos, disponible, email, latitud, longitud FROM parqueaderos WHERE id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener parqueadero:', err);
            return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ mensaje: 'Parqueadero no encontrado', message: 'Parking not found' });
        }
        // Normalizar campos de cupos para soportar variantes en el esquema (legacy vs nuevo)
        const p = results[0];
        // Si existen columnas nuevas cupos_totales/cupos_disponibles, preferirlas; si no, mapear cupos -> cupos_totales
        if (p.cupos_totales == null && p.cupos != null) {
            p.cupos_totales = p.cupos;
            // Si no existe cupos_disponibles, inicializarlo igual a cupos (asunción segura)
            if (p.cupos_disponibles == null) p.cupos_disponibles = p.cupos;
        }

        res.json(p);
    });
};

// Actualizar parqueadero
exports.updateParqueadero = (req, res) => {
    const { id } = req.params;
    // Soporte para dos formatos diferentes en el frontend:
    // - { nombre, direccion, cupos } (used by some pages)
    // - { nombre, direccion, cupos_totales, cupos_disponibles } (used by ConfiguracionParqueadero)
    const { nombre, direccion, cupos, cupos_totales, cupos_disponibles } = req.body;

    if (!nombre || !direccion) {
        return res.status(400).json({ mensaje: 'Nombre y dirección son requeridos', message: 'Name and address are required' });
    }

    // Si vienen cupos_totales/cupos_disponibles validar relación
    if (cupos_totales != null && cupos_disponibles != null) {
        if (Number(cupos_disponibles) > Number(cupos_totales)) {
            return res.status(400).json({ 
                mensaje: 'Los cupos disponibles no pueden ser mayores que los cupos totales', 
                message: 'Available spots cannot be greater than total spots' 
            });
        }

        const sql = 'UPDATE parqueaderos SET nombre = ?, direccion = ?, cupos_totales = ?, cupos_disponibles = ? WHERE id = ?';
        db.query(sql, [nombre, direccion, cupos_totales, cupos_disponibles, id], (err, result) => {
            if (err) {
                console.error('Error al actualizar parqueadero:', err);
                return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ mensaje: 'Parqueadero no encontrado', message: 'Parking not found' });
            }
            return res.json({ mensaje: 'Parqueadero actualizado con éxito', message: 'Parking updated successfully' });
        });
        return;
    }

    // Si viene el campo simple `cupos`, actualizar la columna `cupos` (registro legacy)
    if (cupos != null) {
        const sql = 'UPDATE parqueaderos SET nombre = ?, direccion = ?, cupos = ? WHERE id = ?';
        db.query(sql, [nombre, direccion, cupos, id], (err, result) => {
            if (err) {
                console.error('Error al actualizar parqueadero:', err);
                return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ mensaje: 'Parqueadero no encontrado', message: 'Parking not found' });
            }
            return res.json({ mensaje: 'Parqueadero actualizado con éxito', message: 'Parking updated successfully' });
        });
        return;
    }

    // Si no se proporcionaron campos de cupos, actualizar solo nombre/direccion
    const sql = 'UPDATE parqueaderos SET nombre = ?, direccion = ? WHERE id = ?';
    db.query(sql, [nombre, direccion, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar parqueadero:', err);
            return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Parqueadero no encontrado', message: 'Parking not found' });
        }
        res.json({ mensaje: 'Parqueadero actualizado con éxito', message: 'Parking updated successfully' });
    });
};

// Actualizar tarifas de un parqueadero
exports.updateTarifas = (req, res) => {
    const { id } = req.params;
    const { tarifas } = req.body;

    if (!tarifas || !Array.isArray(tarifas)) {
        return res.status(400).json({ mensaje: 'Formato de tarifas inválido', message: 'Invalid tariffs format' });
    }

    // Normalize tarifa values: accept new structure with primera_hora and hora_adicional
    const normalized = tarifas.map(t => {
        return {
            tipo_vehiculo: t.tipo_vehiculo,
            tarifa_primera_hora: t.tarifa_primera_hora || t.valor || 0,
            tarifa_hora_adicional: t.tarifa_hora_adicional || t.valor || 0,
            tarifa_dia_completo: t.tarifa_dia_completo || null,
            tarifa_noche: t.tarifa_noche || null
        };
    });

    // Validar que las tarifas tengan los campos requeridos y valores válidos
    for (const tarifa of normalized) {
        if (!tarifa.tipo_vehiculo || Number(tarifa.tarifa_primera_hora) < 0 || Number(tarifa.tarifa_hora_adicional) < 0) {
            return res.status(400).json({
                mensaje: 'Cada tarifa debe tener tipo_vehiculo y valores válidos',
                message: 'Each tariff must have a vehicle type and valid values'
            });
        }
    }

    // Primero verificamos que el parqueadero existe
    db.query('SELECT id FROM parqueaderos WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error al verificar parqueadero:', err);
            return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ mensaje: 'Parqueadero no encontrado', message: 'Parking not found' });
        }

        // Comenzamos una transacción para actualizar todas las tarifas
        db.beginTransaction(err => {
            if (err) {
                console.error('Error al iniciar transacción:', err);
                return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
            }

            // Primero eliminamos las tarifas existentes
            db.query('DELETE FROM tarifas WHERE parqueadero_id = ?', [id], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error al eliminar tarifas:', err);
                        res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
                    });
                }

                // Preparamos la consulta para insertar múltiples tarifas
                const values = normalized.map(t => [id, t.tipo_vehiculo, t.tarifa_primera_hora, t.tarifa_hora_adicional, t.tarifa_dia_completo, t.tarifa_noche]);
                const sql = 'INSERT INTO tarifas (parqueadero_id, tipo_vehiculo, tarifa_primera_hora, tarifa_hora_adicional, tarifa_dia_completo, tarifa_noche) VALUES ?';

                db.query(sql, [values], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error al insertar tarifas:', err);
                            res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
                        });
                    }

                    // Confirmamos la transacción
                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error al confirmar transacción:', err);
                                res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
                            });
                        }
                        res.json({ mensaje: 'Tarifas actualizadas con éxito', message: 'Tariffs updated successfully' });
                    });
                });
            });
        });
    });
};

// Registrar parqueadero (ahora con email y password hasheada)
exports.registerParqueadero = (req, res) => {
    let { nombre, direccion, cupos, email, password, latitud, longitud } = req.body;

    // Normalizar email
    if (email && typeof email === 'string') {
        email = email.trim().toLowerCase();
    }

    if (!nombre || !direccion || cupos == null || !email || !password || latitud == null || longitud == null) {
        return res.status(400).json({ mensaje: 'Todos los campos son requeridos', message: 'All fields are required' });
    }

    // Hashear la contraseña antes de insertar
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (hashErr, hashedPassword) => {
        if (hashErr) {
            console.error('Error hashing password:', hashErr);
            return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
        }

    const sql = 'INSERT INTO parqueaderos (nombre, direccion, cupos, email, password, latitud, longitud) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const params = [nombre, direccion, cupos, email, hashedPassword, latitud, longitud];

    console.log('Registering parqueadero with email:', email);

        db.query(sql, params, (err, result) => {
            if (err) {
                console.error('Error al insertar parqueadero:', err);
                // Manejar email duplicado (código MySQL ER_DUP_ENTRY)
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ mensaje: 'El correo ya está registrado', message: 'Email already registered' });
                }
                return res.status(500).json({ mensaje: 'Error al registrar parqueadero', message: 'Error registering parking' });
            }

            console.log('Insert result:', result);
            res.json({ mensaje: 'Parqueadero registrado con éxito', message: 'Parking registered successfully', id: result.insertId });
        });
    });
};

// Actualizar disponibilidad manual
exports.updateDisponibilidad = (req, res) => {
    const { id } = req.params;
    const { disponible } = req.body;

    db.query(
        'UPDATE parqueaderos SET disponible = ? WHERE id = ?',
        [disponible, id],
        (err, result) => {
            if (err) {
                console.error('Error:', err);
                return res.status(500).json({ mensaje: 'Error al actualizar disponibilidad', message: 'Error updating availability' });
            }
            res.json({ mensaje: 'Disponibilidad actualizada', message: 'Availability updated' });
        }
    );
};

// Obtener tarifas de un parqueadero
exports.getTarifas = (req, res) => {
    const { id } = req.params;

    const sql = 'SELECT tipo_vehiculo, tarifa_primera_hora, tarifa_hora_adicional, tarifa_dia_completo, tarifa_noche FROM tarifas WHERE parqueadero_id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener tarifas:', err);
            return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
        }
        res.json(results);
    });
};

// Login de parqueadero (por email + password)
exports.loginParqueadero = (req, res) => {
    let { email, password } = req.body;

    if (email && typeof email === 'string') {
        email = email.trim().toLowerCase();
    }

    if (!email || !password) {
        return res.status(400).json({ mensaje: 'Email y password son requeridos', message: 'Email and password are required' });
    }

    console.log('Login attempt for email:', email);

    db.query('SELECT * FROM parqueaderos WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error buscando parqueadero:', err);
            return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
        }

        if (!results || results.length === 0) {
            // Mensaje solicitado por el usuario: sugerir registrarse
            return res.status(404).json({ mensaje: 'No está tu parqueadero registrado, hazlo aquí', message: 'Your parking is not registered, register it here' });
        }

        const parqueadero = results[0];

        bcrypt.compare(password, parqueadero.password, (compareErr, isMatch) => {
            if (compareErr) {
                console.error('Error comparando password:', compareErr);
                return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
            }

            if (!isMatch) {
                return res.status(401).json({ mensaje: 'Contraseña incorrecta', message: 'Incorrect password' });
            }

            // Generar token JWT con id del parqueadero (u otros claims necesarios)
            const token = jwt.sign({ id: parqueadero.id, email: parqueadero.email }, SECRET_KEY, { expiresIn: '8h' });

            res.json({ mensaje: 'Login exitoso', message: 'Login successful', token, parqueadero: { id: parqueadero.id, nombre: parqueadero.nombre, email: parqueadero.email } });
        });
    });
};
