const db = require('../config/db');

// Obtener reservas de un usuario
exports.getReservasUsuario = (req, res) => {
    const { usuarioId } = req.params;

    const sql = `
        SELECT r.*, p.nombre as parqueadero_nombre, p.direccion
        FROM reservas r
        JOIN parqueaderos p ON r.parqueadero_id = p.id
        WHERE r.usuario_id = ?
        ORDER BY r.creado_en DESC
    `;

    db.query(sql, [usuarioId], (err, results) => {
        if (err) {
            console.error('Error al obtener reservas:', err);
            return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
        }
        res.json(results);
    });
};

// Crear nueva reserva
// Soporta creación con horas programadas o reserva sin tiempo (llegada en sitio).
// Si no se proveen hora_inicio/hora_fin, se establece hora_inicio a NOW() + 15 minutos.
exports.crearReserva = (req, res) => {
    const { usuario_id, parqueadero_id, fecha_reserva, hora_inicio, hora_fin, tipo_vehiculo, observaciones } = req.body;

    if (!usuario_id || !parqueadero_id || !fecha_reserva || !tipo_vehiculo) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos', message: 'Missing required fields' });
    }

    // Si se proveen hora_inicio/hora_fin calculamos estimado; si no, guardamos reserva pendiente con hora_inicio = NOW() + 15 min
    const hasTimes = hora_inicio && hora_fin;

    const insertReservation = (tiempoTotal, valorEstimado, horaInicioToStore, horaFinToStore) => {
        const sql = `
            INSERT INTO reservas
            (usuario_id, parqueadero_id, fecha_reserva, hora_inicio, hora_fin, tipo_vehiculo, tiempo_total, valor_estimado, observaciones, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const estado = 'pendiente';
        const params = [usuario_id, parqueadero_id, fecha_reserva, horaInicioToStore, horaFinToStore, tipo_vehiculo, tiempoTotal, valorEstimado, observaciones || null, estado];

        db.query(sql, params, (err, result) => {
            if (err) {
                console.error('Error al crear reserva:', err);
                return res.status(500).json({ mensaje: 'Error al crear reserva', message: 'Error creating reservation' });
            }

            // Obtener el nombre del parqueadero para incluirlo en la respuesta
            const sqlParqueadero = 'SELECT nombre FROM parqueaderos WHERE id = ?';
            db.query(sqlParqueadero, [parqueadero_id], (err, parqueaderoResults) => {
                if (err) {
                    console.error('Error al obtener parqueadero:', err);
                    return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
                }

                const parqueaderoNombre = parqueaderoResults.length > 0 ? parqueaderoResults[0].nombre : 'Parqueadero';

                res.json({
                    mensaje: 'Reserva creada con éxito',
                    message: 'Reservation created successfully',
                    id: result.insertId,
                    estado: estado,
                    fecha_reserva: fecha_reserva,
                    tipo_vehiculo: tipo_vehiculo,
                    tiempo_total: tiempoTotal,
                    valor_estimado: valorEstimado,
                    parqueadero_nombre: parqueaderoNombre,
                    countdown_start: !hasTimes // Indicar si iniciar countdown
                });
            });
        });
    };

    if (hasTimes) {
        // Calcular tiempo total en horas
        const inicio = new Date(`${fecha_reserva} ${hora_inicio}`);
        const fin = new Date(`${fecha_reserva} ${hora_fin}`);
        const tiempoTotal = (fin - inicio) / (1000 * 60 * 60); // horas

        if (tiempoTotal <= 0) {
            return res.status(400).json({ mensaje: 'La hora de fin debe ser posterior a la hora de inicio', message: 'End time must be after start time' });
        }

        // Obtener tarifa del parqueadero para el tipo de vehículo
        const sqlTarifa = 'SELECT tarifa_primera_hora, tarifa_hora_adicional FROM tarifas WHERE parqueadero_id = ? AND tipo_vehiculo = ?';
        db.query(sqlTarifa, [parqueadero_id, tipo_vehiculo], (err, tarifaResults) => {
            if (err) {
                console.error('Error al obtener tarifa:', err);
                return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
            }

            if (tarifaResults.length === 0) {
                return res.status(404).json({ mensaje: 'Tarifa no encontrada para este tipo de vehículo', message: 'Rate not found for this vehicle type' });
            }

            const { tarifa_primera_hora, tarifa_hora_adicional } = tarifaResults[0];
            let valorEstimado = 0;

            // Calcular valor estimado basado en primera hora + horas adicionales
            if (tiempoTotal <= 1) {
                valorEstimado = tarifa_primera_hora * tiempoTotal; // Proporcional si es menos de 1 hora
            } else {
                valorEstimado = tarifa_primera_hora + (tiempoTotal - 1) * tarifa_hora_adicional;
            }

            insertReservation(tiempoTotal, valorEstimado, hora_inicio, hora_fin);
        });
    } else {
        // Reserva sin tiempo: establecer hora_inicio = NOW() + 15 minutos, tiempo_total = 0, valor_estimado = 0
        // Si hora_inicio ya viene en el body, usarla; si no, calcular NOW() + 15 min
        let horaInicioToUse = hora_inicio;
        if (!horaInicioToUse) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + 15);
            horaInicioToUse = now.toTimeString().split(' ')[0]; // HH:MM:SS
        }
        insertReservation(0, 0, horaInicioToUse, null);
    }
};

// Cancelar reserva
exports.cancelarReserva = (req, res) => {
    const { id } = req.params;

    db.query(
        'UPDATE reservas SET estado = "cancelada" WHERE id = ? AND estado = "pendiente"',
        [id],
        (err, result) => {
            if (err) {
                console.error('Error al cancelar reserva:', err);
                return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ mensaje: 'Reserva no encontrada o no se puede cancelar', message: 'Reservation not found or cannot be cancelled' });
            }

            res.json({ mensaje: 'Reserva cancelada', message: 'Reservation cancelled' });
        }
    );
};

// Completar reserva - Registra hora de salida real y calcula tiempo total
exports.completarReserva = (req, res) => {
    const { id } = req.params;

    // Obtener reserva para calcular tiempo y valor
    db.query('SELECT parqueadero_id, tipo_vehiculo, hora_inicio, estado FROM reservas WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error al obtener reserva:', err);
            return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
        }
        if (!results || results.length === 0) {
            return res.status(404).json({ mensaje: 'Reserva no encontrada', message: 'Reservation not found' });
        }

        const reserva = results[0];

        if (reserva.estado !== 'activa') {
            return res.status(400).json({ mensaje: 'La reserva debe estar en estado activa para completarse', message: 'Reservation must be active to be completed' });
        }

        if (!reserva.hora_inicio) {
            return res.status(400).json({ mensaje: 'La llegada no ha sido registrada para esta reserva', message: 'Arrival not registered for this reservation' });
        }

        // Obtener tarifa
        db.query('SELECT tarifa_primera_hora, tarifa_hora_adicional FROM tarifas WHERE parqueadero_id = ? AND tipo_vehiculo = ?', [reserva.parqueadero_id, reserva.tipo_vehiculo], (err, tarifaResults) => {
            if (err) {
                console.error('Error al obtener tarifa:', err);
                return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
            }
            if (!tarifaResults || tarifaResults.length === 0) {
                return res.status(404).json({ mensaje: 'Tarifa no encontrada para este tipo de vehículo', message: 'Rate not found for this vehicle type' });
            }

            const { tarifa_primera_hora, tarifa_hora_adicional } = tarifaResults[0];

            // Calcular duración en horas entre hora_inicio y NOW() usando TIMESTAMPDIFF
            const sqlCalc = 'SELECT TIMESTAMPDIFF(SECOND, ?, NOW()) AS segundos';
            db.query(sqlCalc, [reserva.hora_inicio], (err, diffResults) => {
                if (err) {
                    console.error('Error al calcular diferencia de tiempo:', err);
                    return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
                }

                const segundos = diffResults[0].segundos || 0;
                const horas = segundos / 3600;
                let valorTotal = 0;

                // Calcular valor total basado en primera hora + horas adicionales
                if (horas <= 1) {
                    valorTotal = tarifa_primera_hora * horas; // Proporcional si es menos de 1 hora
                } else {
                    valorTotal = tarifa_primera_hora + (horas - 1) * tarifa_hora_adicional;
                }

                const sqlUpdate = 'UPDATE reservas SET hora_fin = NOW(), tiempo_total = ?, valor_estimado = ?, estado = "completada" WHERE id = ?';
                db.query(sqlUpdate, [horas, valorTotal, id], (err, updateRes) => {
                    if (err) {
                        console.error('Error al completar reserva:', err);
                        return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
                    }

                    res.json({
                        mensaje: 'Reserva completada',
                        message: 'Reservation completed',
                        estado: 'completada',
                        tiempo_total: horas,
                        valor_total: valorTotal
                    });
                });
            });
        });
    });
};

// Autorizar ingreso (HU-4) - Registra hora de llegada real
exports.autorizarIngreso = (req, res) => {
    const { id } = req.params;

    db.query(
        'UPDATE reservas SET estado = "activa", hora_inicio = NOW() WHERE id = ? AND estado = "pendiente"',
        [id],
        (err, result) => {
            if (err) {
                console.error('Error al autorizar ingreso:', err);
                return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ mensaje: 'Reserva no encontrada o no se puede autorizar', message: 'Reservation not found or cannot be authorized' });
            }

            res.json({ mensaje: 'Ingreso autorizado', message: 'Entry authorized' });
        }
    );
};

// Marcar llegada real: registra hora_inicio = NOW() y pone estado = 'activa'
exports.marcarLlegada = (req, res) => {
    const { id } = req.params;

    const sql = 'UPDATE reservas SET hora_inicio = NOW(), estado = "activa" WHERE id = ? AND estado = "pendiente"';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al marcar llegada:', err);
            return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Reserva no encontrada o no está en estado pendiente', message: 'Reservation not found or not pending' });
        }
        res.json({ mensaje: 'Llegada registrada', message: 'Arrival recorded', estado: 'activa' });
    });
};

// Marcar salida real: registra hora_fin = NOW(), calcula tiempo y valor final usando la tarifa actual
exports.marcarSalida = (req, res) => {
    const { id } = req.params;

    // Obtener reserva para conocer parqueadero_id y tipo_vehiculo y hora_inicio
    db.query('SELECT parqueadero_id, tipo_vehiculo, hora_inicio, estado FROM reservas WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error al obtener reserva:', err);
            return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
        }
        if (!results || results.length === 0) {
            return res.status(404).json({ mensaje: 'Reserva no encontrada', message: 'Reservation not found' });
        }

        const reserva = results[0];

        if (reserva.estado !== 'activa') {
            return res.status(400).json({ mensaje: 'La reserva debe estar en estado activa para marcar salida', message: 'Reservation must be active to mark exit' });
        }

        if (!reserva.hora_inicio) {
            return res.status(400).json({ mensaje: 'La llegada no ha sido registrada para esta reserva', message: 'Arrival not registered for this reservation' });
        }

        // Obtener tarifa
        db.query('SELECT tarifa_hora FROM tarifas WHERE parqueadero_id = ? AND tipo_vehiculo = ?', [reserva.parqueadero_id, reserva.tipo_vehiculo], (err, tarifaResults) => {
            if (err) {
                console.error('Error al obtener tarifa:', err);
                return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
            }
            if (!tarifaResults || tarifaResults.length === 0) {
                return res.status(404).json({ mensaje: 'Tarifa no encontrada para este tipo de vehículo', message: 'Rate not found for this vehicle type' });
            }

            const tarifaHora = tarifaResults[0].tarifa_hora;

            // Calcular duración en horas entre hora_inicio y NOW()
            const sqlCalc = 'SELECT TIMESTAMPDIFF(SECOND, hora_inicio, NOW()) AS segundos';
            db.query(sqlCalc, (err, diffResults) => {
                if (err) {
                    console.error('Error al calcular diferencia de tiempo:', err);
                    return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
                }

                const segundos = diffResults[0].segundos || 0;
                const horas = segundos / 3600;
                const valorTotal = horas * tarifaHora;

                const sqlUpdate = 'UPDATE reservas SET hora_fin = NOW(), tiempo_total = ?, valor_estimado = ?, estado = "completada" WHERE id = ?';
                db.query(sqlUpdate, [horas, valorTotal, id], (err, updateRes) => {
                    if (err) {
                        console.error('Error al actualizar reserva con salida:', err);
                        return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
                    }

                    res.json({
                        mensaje: 'Salida registrada',
                        message: 'Exit recorded',
                        estado: 'completada',
                        tiempo_total: horas,
                        valor_total: valorTotal
                    });
                });
            });
        });
    });
};

// Obtener tarifa para pago (HU-6)
exports.getTarifaReserva = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT r.tiempo_total, r.valor_estimado, t.tarifa_primera_hora, t.tarifa_hora_adicional, r.tipo_vehiculo
        FROM reservas r
        JOIN tarifas t ON r.parqueadero_id = t.parqueadero_id AND r.tipo_vehiculo = t.tipo_vehiculo
        WHERE r.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener tarifa:', err);
            return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ mensaje: 'Reserva no encontrada', message: 'Reservation not found' });
        }

        const { tiempo_total, valor_estimado, tarifa_primera_hora, tarifa_hora_adicional, tipo_vehiculo } = results[0];
        res.json({
            tiempo_total,
            valor_estimado,
            tarifa_primera_hora,
            tarifa_hora_adicional,
            tipo_vehiculo
        });
    });
};

// Calcular y guardar tarifa final para reserva completada
exports.calcularTarifaFinal = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT r.tiempo_total, r.valor_estimado, t.tarifa_primera_hora, t.tarifa_hora_adicional, r.tipo_vehiculo, r.estado
        FROM reservas r
        JOIN tarifas t ON r.parqueadero_id = t.parqueadero_id AND r.tipo_vehiculo = t.tipo_vehiculo
        WHERE r.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener tarifa:', err);
            return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ mensaje: 'Reserva no encontrada', message: 'Reservation not found' });
        }

        const reserva = results[0];

        if (reserva.estado !== 'completada') {
            return res.status(400).json({ mensaje: 'La reserva debe estar completada para calcular la tarifa final', message: 'Reservation must be completed to calculate final tariff' });
        }

        // Calcular costo total
        const tiempoTotal = reserva.tiempo_total;
        const tarifaPrimeraHora = reserva.tarifa_primera_hora;
        const tarifaHoraAdicional = reserva.tarifa_hora_adicional;
        let costoTotal = 0;

        if (tiempoTotal <= 1) {
            costoTotal = tiempoTotal * tarifaPrimeraHora;
        } else {
            costoTotal = tarifaPrimeraHora + (tiempoTotal - 1) * tarifaHoraAdicional;
        }

        // Actualizar valor_estimado con el costo calculado
        const updateSql = 'UPDATE reservas SET valor_estimado = ? WHERE id = ?';
        db.query(updateSql, [costoTotal, id], (err, updateResult) => {
            if (err) {
                console.error('Error al actualizar tarifa final:', err);
                return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
            }

            res.json({
                mensaje: 'Tarifa final calculada y guardada',
                message: 'Final tariff calculated and saved',
                tiempo_total: tiempoTotal,
                tarifa_primera_hora: tarifaPrimeraHora,
                tarifa_hora_adicional: tarifaHoraAdicional,
                costo_total: costoTotal
            });
        });
    });
};

// Obtener reservas de un parqueadero (para administradores)
exports.getReservasParqueadero = (req, res) => {
    const { parqueaderoId } = req.params;

    const sql = `
        SELECT r.*, u.nombre as usuario_nombre, u.email as usuario_email
        FROM reservas r
        JOIN usuarios u ON r.usuario_id = u.id
        WHERE r.parqueadero_id = ?
        ORDER BY r.creado_en DESC
    `;

    db.query(sql, [parqueaderoId], (err, results) => {
        if (err) {
            console.error('Error al obtener reservas del parqueadero:', err);
            return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
        }
        res.json(results);
    });
};

// Cancelar reservas pendientes que superen los 15 minutos desde su creación
exports.cancelarReservasExpiradas = (req, res) => {
    // Actualiza reservas donde estado='pendiente' y creado_en tiene más de 15 minutos
    const sql = `UPDATE reservas SET estado = 'cancelada' WHERE estado = 'pendiente' AND TIMESTAMPDIFF(MINUTE, creado_en, NOW()) > 15`;
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error al cancelar reservas expiradas:', err);
            return res.status(500).json({ mensaje: 'Error interno', message: 'Internal server error' });
        }
        res.json({ mensaje: 'Reservas expiradas canceladas', message: 'Expired reservations cancelled', affected: result.affectedRows });
    });
};
