import React, { useState, useEffect } from "react";
import { FaParking, FaUsers, FaCalendarAlt, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import api from "../services/api";
import "./dashboard.css";

export default function ParqueaderoDashboard() {
    const [parqueadero, setParqueadero] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        nombre: "",
        direccion: "",
        cupos: 0,
        disponible: true
    });
    const [tarifas, setTarifas] = useState([]);
    const [tarifasEditMode, setTarifasEditMode] = useState(false);
    const [tarifasForm, setTarifasForm] = useState({
        camion: { primera_hora: 0, hora_adicional: 0 },
        ambulancia: { primera_hora: 0, hora_adicional: 0 },
        carro: { primera_hora: 0, hora_adicional: 0 },
        moto: { primera_hora: 0, hora_adicional: 0 },
        bicicleta: { primera_hora: 0, hora_adicional: 0 }
    });
    const [reservasRecientes, setReservasRecientes] = useState([]);

    // Obtener parqueaderoId del localStorage
    const parqueaderoData = JSON.parse(localStorage.getItem("parqueadero"));
    const parqueaderoId = parqueaderoData?.id;

    useEffect(() => {
        if (parqueaderoId) {
            loadData();
        }
    }, [parqueaderoId]);

    const loadData = async () => {
        try {
            // Cargar datos del parqueadero
            const parqueaderoRes = await api.get(`/parqueaderos/${parqueaderoId}`);
            setParqueadero(parqueaderoRes.data);
            setFormData({
                nombre: parqueaderoRes.data.nombre,
                direccion: parqueaderoRes.data.direccion,
                cupos: parqueaderoRes.data.cupos,
                cupos_disponibles: parqueaderoRes.data.cupos_disponibles ?? parqueaderoRes.data.cupos,
                disponible: parqueaderoRes.data.disponible === 1
            });
            
            // Cargar tarifas
            const tarifasRes = await api.get(`/parqueaderos/${parqueaderoId}/tarifas`);
            setTarifas(tarifasRes.data);
            // Preparar formulario de tarifas
            const tarifasFormData = {
                camion: { primera_hora: 0, hora_adicional: 0 },
                ambulancia: { primera_hora: 0, hora_adicional: 0 },
                carro: { primera_hora: 0, hora_adicional: 0 },
                moto: { primera_hora: 0, hora_adicional: 0 },
                bicicleta: { primera_hora: 0, hora_adicional: 0 }
            };
            tarifasRes.data.forEach(t => {
                if (tarifasFormData[t.tipo_vehiculo]) {
                    tarifasFormData[t.tipo_vehiculo].primera_hora = t.tarifa_primera_hora || 0;
                    tarifasFormData[t.tipo_vehiculo].hora_adicional = t.tarifa_hora_adicional || 0;
                }
            });
            setTarifasForm(tarifasFormData);

            // Cargar reservas recientes
            const reservasRes = await api.get(`/reservas/parqueadero/${parqueaderoId}`);
            setReservasRecientes(reservasRes.data.slice(0, 5)); // Solo las 5 más recientes
        } catch (err) {
            console.error('Error al cargar datos:', err);
            showSnack("Error al cargar datos.", "error");
        } finally {
            setLoading(false);
        }
    };

    const showSnack = (msg, type = "success") => {
        const snack = document.createElement("div");
        snack.className = `snackbar ${type}`;
        snack.innerText = msg;
        document.body.appendChild(snack);
        setTimeout(() => snack.classList.add("show"), 50);
        setTimeout(() => {
            snack.classList.remove("show");
            setTimeout(() => snack.remove(), 300);
        }, 2500);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validar cupos
        if (formData.cupos_disponibles > formData.cupos) {
            showSnack("Los cupos disponibles no pueden ser mayores que los cupos totales.", "error");
            return;
        }
        try {
            await api.put(`/parqueaderos/${parqueaderoId}`, {
                ...formData,
                disponible: formData.disponible ? 1 : 0
            });
            showSnack("Parqueadero actualizado con éxito", "success");
            setEditMode(false);
            loadData();
        } catch (err) {
            console.error(err);
            showSnack("Error al actualizar parqueadero", "error");
        }
    };

    const handleTarifasSubmit = async (e) => {
        e.preventDefault();
        // Validar que al menos exista una tarifa válida
        const hasValidTarifa = Object.values(tarifasForm).some(tipo =>
            tipo.primera_hora > 0 && tipo.hora_adicional > 0
        );
        if (!hasValidTarifa) {
            showSnack("Debes ingresar al menos una tarifa válida.", "error");
            return;
        }
        try {
            // Convertir el formulario a formato de API
            const tarifasData = Object.keys(tarifasForm).map(tipo => ({
                tipo_vehiculo: tipo,
                tarifa_primera_hora: tarifasForm[tipo].primera_hora,
                tarifa_hora_adicional: tarifasForm[tipo].hora_adicional,
                tarifa_dia_completo: null,
                tarifa_noche: null
            }));
            await api.put(`/parqueaderos/${parqueaderoId}/tarifas`, { tarifas: tarifasData });
            showSnack("Tarifas actualizadas con éxito", "success");
            setTarifasEditMode(false);
            loadData();
        } catch (err) {
            console.error(err);
            showSnack("Error al actualizar tarifas", "error");
        }
    };



    const toggleDisponibilidad = async () => {
        try {
            const newDisponible = !formData.disponible;
            await api.put(`/parqueaderos/${parqueaderoId}/disponibilidad`, {
                disponible: newDisponible ? 1 : 0
            });
            setFormData({ ...formData, disponible: newDisponible });
            showSnack(`Parqueadero marcado como ${newDisponible ? 'disponible' : 'no disponible'}`, "success");
            loadData();
        } catch (err) {
            console.error(err);
            showSnack("Error al cambiar disponibilidad", "error");
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-card">
                    <p>Cargando datos del parqueadero...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-card">
                <h1 className="title">Panel de Control</h1>
                <p className="subtitle">Gestiona tu parqueadero</p>

                <div className="stats-container">
                    <div className="stat-card">
                        <FaParking className="stat-icon" />
                        <h3>Estado</h3>
                        <p className={`stat-value ${formData.disponible ? 'disponible' : 'no-disponible'}`}>
                            {formData.disponible ? 'Disponible' : 'No Disponible'}
                        </p>
                        <button 
                            className={`btn-toggle ${formData.disponible ? 'disponible' : 'no-disponible'}`}
                            onClick={toggleDisponibilidad}
                        >
                            Cambiar
                        </button>
                    </div>
                    <div className="stat-card flex flex-col items-center justify-center">
                        <FaUsers className="stat-icon text-blue-600" />
                        <h3>Cupos</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                await api.put(`/parqueaderos/${parqueaderoId}`, {
                                    ...formData,
                                    cupos: parseInt(formData.cupos),
                                    disponible: formData.disponible ? 1 : 0
                                });
                                showSnack("Cupos actualizados", "success");
                                loadData();
                            } catch (err) {
                                showSnack("Error al actualizar cupos", "error");
                            }
                        }} className="flex items-center gap-1 mt-2">
                            <input
                                type="number"
                                value={formData.cupos}
                                onChange={e => setFormData({ ...formData, cupos: parseInt(e.target.value) })}
                                min="1"
                                required
                                className="input-field w-14 text-center text-base font-bold border-2 border-blue-400 focus:border-blue-600 rounded px-1 py-0.5"
                                style={{maxWidth:'60px'}}
                            />
                            <button type="submit" className="btn-save px-2 py-0.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded shadow whitespace-nowrap">Guardar</button>
                        </form>
                    </div>
                    <div className="stat-card">
                        <FaCalendarAlt className="stat-icon" />
                        <h3>Reservas Activas</h3>
                        <p className="stat-value">{reservasRecientes.filter(r => r.estado === 'activa').length}</p>
                    </div>
                </div>

                <div className="section">
                    <div className="section-header">
                        <h2>Información del Parqueadero</h2>
                        <button 
                            className="btn-edit" 
                            onClick={() => setEditMode(!editMode)}
                        >
                            {editMode ? <FaTimes /> : <FaEdit />}
                        </button>
                    </div>
                    
                    {editMode ? (
                        <form onSubmit={handleSubmit} className="edit-form">
                            <div className="form-group">
                                <label>Nombre:</label>
                                <input 
                                    type="text" 
                                    value={formData.nombre} 
                                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Dirección:</label>
                                <input 
                                    type="text" 
                                    value={formData.direccion} 
                                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-save">
                                <FaSave /> Guardar Cambios
                            </button>
                        </form>
                    ) : (
                        <div className="info-display">
                            <p><strong>Nombre:</strong> {parqueadero.nombre}</p>
                            <p><strong>Dirección:</strong> {parqueadero.direccion}</p>
                            <p><strong>Email:</strong> {parqueadero.email}</p>
                            <p><strong>Cupos:</strong> {parqueadero.cupos}</p>
                        </div>
                    )}
                </div>

                <div className="section">
                    <div className="section-header">
                        <h2>Tarifas</h2>
                        <button 
                            className="btn-edit" 
                            onClick={() => setTarifasEditMode(!tarifasEditMode)}
                        >
                            {tarifasEditMode ? <FaTimes /> : <FaEdit />}
                        </button>
                    </div>
                    
                    {tarifasEditMode ? (
                        <form onSubmit={handleTarifasSubmit} className="edit-form">
                            {["camion", "ambulancia", "carro", "moto", "bicicleta"].map(tipo => (
                                <div className="form-group" key={tipo}>
                                    <label>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}:</label>
                                    <div className="tarifa-inputs">
                                        <div className="tarifa-input">
                                            <span className="currency">$</span>
                                            <input
                                                type="number"
                                                placeholder="Primera hora"
                                                value={tarifasForm[tipo].primera_hora || ""}
                                                onChange={e => setTarifasForm({
                                                    ...tarifasForm,
                                                    [tipo]: {
                                                        ...tarifasForm[tipo],
                                                        primera_hora: parseFloat(e.target.value) || 0
                                                    }
                                                })}
                                                min="0"
                                                step="0.01"
                                                required={false}
                                            />
                                        </div>
                                        <div className="tarifa-input">
                                            <span className="currency">$</span>
                                            <input
                                                type="number"
                                                placeholder="Horas adicionales"
                                                value={tarifasForm[tipo].hora_adicional || ""}
                                                onChange={e => setTarifasForm({
                                                    ...tarifasForm,
                                                    [tipo]: {
                                                        ...tarifasForm[tipo],
                                                        hora_adicional: parseFloat(e.target.value) || 0
                                                    }
                                                })}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button type="submit" className="btn-save">
                                <FaSave /> Guardar Tarifas
                            </button>
                        </form>
                    ) : (
                        <div className="tarifas-display">
                            {tarifas.length === 0 ? (
                                <p>No hay tarifas configuradas.</p>
                            ) : (
                                <table className="tarifas-table">
                                    <thead>
                                        <tr>
                                            <th>Tipo de Vehículo</th>
                                            <th>Primera Hora</th>
                                            <th>Horas Adicionales</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {["camion", "ambulancia", "carro", "moto", "bicicleta"].map(tipo => {
                                            const tarifa = tarifas.find(t => t.tipo_vehiculo === tipo);
                                            return (
                                                <tr key={tipo}>
                                                    <td>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</td>
                                                    <td>{tarifa ? `$${tarifa.tarifa_primera_hora}` : <span className="text-gray-400">No definida</span>}</td>
                                                    <td>{tarifa ? `$${tarifa.tarifa_hora_adicional}` : <span className="text-gray-400">No definida</span>}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>

                <div className="section">
                    <h2>Reservas Recientes</h2>
                    {reservasRecientes.length === 0 ? (
                        <p>No hay reservas recientes.</p>
                    ) : (
                        <div className="reservas-recientes">
                            {reservasRecientes.map(r => (
                                <div key={r.id} className={`reserva-item mini ${r.estado}`}>
                                    <div className="reserva-header">
                                        <span className="reserva-id">#{r.id}</span>
                                        <span className={`estado-badge ${r.estado}`}>{r.estado}</span>
                                    </div>
                                    <p><strong>{r.usuario_nombre}</strong> • {r.tipo_vehiculo}</p>
                                    <p>{r.fecha_reserva} | {r.hora_inicio} - {r.hora_fin}</p>
                                    <div className="reserva-info" style={{marginTop:8}}>
                                        <small className="text-gray-500">Estado: {r.estado}</small>
                                    </div>
                                </div>
                            ))}
                            <a href="/reservas-parqueadero" className="ver-todas">
                                Ver todas las reservas
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
