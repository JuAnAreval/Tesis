import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaClock, FaCar, FaComment, FaPlus, FaTimes, FaCheck, FaKey, FaEye } from "react-icons/fa";
import api from "../services/api";
import "./reservas.css";

export default function Reservas() {
    const [reservas, setReservas] = useState([]);
    const [parqueaderos, setParqueaderos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        parqueadero_id: "",
        fecha_reserva: "",
        hora_inicio: "",
        hora_fin: "",
        tipo_vehiculo: "carro",
        observaciones: ""
    });
    const [countdown, setCountdown] = useState(null); // {id, timeLeft}
    const [mensaje, setMensaje] = useState("");

    // Obtener usuarioId del localStorage (asumiendo que está guardado)
    const usuarioId = JSON.parse(localStorage.getItem("parqueadero"))?.id; // Ajustar si es diferente

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            reservas.forEach(r => {
                if (r.estado === 'activa') {
                    const endTime = new Date(`${r.fecha_reserva}T${r.hora_fin}`);
                    const diff = (endTime - now) / 1000 / 60; // minutes
                    if (diff <= 15 && diff > 0) {
                        showSnack(`Reserva en ${r.parqueadero_nombre} termina pronto.`, "warning");
                    }
                }
            });
        }, 60000); // every minute
        return () => clearInterval(interval);
    }, [reservas]);

    const loadData = async () => {
        try {
            const [reservasRes, parqueaderosRes] = await Promise.all([
                api.get(`/reservas/usuario/${usuarioId}`),
                api.get('/parqueaderos')
            ]);
            setReservas(reservasRes.data);
            setParqueaderos(parqueaderosRes.data);
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
        setMensaje("");
        const data = { ...formData, usuario_id: usuarioId };

        try {
            const response = await api.post('/reservas', data);
            showSnack("Reserva creada con éxito ✅", "success");
            setShowForm(false);
            setFormData({
                parqueadero_id: "",
                fecha_reserva: "",
                hora_inicio: "",
                hora_fin: "",
                tipo_vehiculo: "carro",
                observaciones: ""
            });
            loadData(); // Recargar reservas

            // Iniciar countdown si es reserva sin tiempos
            if (response.data.countdown_start) {
                startCountdown(response.data.id);
            }
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.mensaje || "Error al crear reserva.";
            setMensaje(errorMsg);
        }
    };

    const startCountdown = (id) => {
        setCountdown({ id, timeLeft: 15 * 60 }); // 15 minutes in seconds
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev && prev.timeLeft > 0) {
                    return { ...prev, timeLeft: prev.timeLeft - 1 };
                } else {
                    clearInterval(interval);
                    return null;
                }
            });
        }, 1000);
    };

    const cancelarReserva = async (id) => {
        try {
            await api.put(`/reservas/${id}/cancelar`);
            showSnack("Reserva cancelada.", "success");
            loadData();
        } catch (err) {
            showSnack("Error al cancelar reserva.", "error");
        }
    };



    const autorizarIngreso = async (id) => {
        try {
            await api.put(`/reservas/${id}/autorizar-ingreso`);
            showSnack("Ingreso autorizado.", "success");
            loadData();
        } catch (err) {
            showSnack("Error al autorizar ingreso.", "error");
        }
    };

    const getTarifa = async (id) => {
        try {
            const res = await api.get(`/reservas/${id}/tarifa`);
            const tarifa = res.data;
            const tiempo = tarifa.tiempo_total;
            const primeraHora = tarifa.tarifa_primera_hora;
            const adicional = tarifa.tarifa_hora_adicional;
            let costo = 0;
            if (tiempo <= 1) {
                costo = primeraHora * tiempo;
            } else {
                costo = primeraHora + (tiempo - 1) * adicional;
            }
            alert(`Tiempo total: ${tiempo.toFixed(2)} horas\nPrimera hora: $${primeraHora}\nHoras adicionales: $${adicional}\nCosto total: $${costo.toFixed(2)}`);
        } catch (err) {
            showSnack("Error al calcular tarifa.", "error");
        }
    };



    if (loading) {
        return (
            <div className="reservas-container">
                <div className="reservas-card">
                    <p>Cargando reservas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="reservas-container">
            <div className="reservas-card">
                <h1 className="title">Mis Reservas</h1>
                <p className="subtitle">Gestiona tus reservas de parqueadero.</p>

                <button className="btn-add" onClick={() => setShowForm(!showForm)}>
                    <FaPlus /> {showForm ? "Cancelar" : "Nueva Reserva"}
                </button>

                {showForm && (
                    <form onSubmit={handleSubmit} className="reserva-form">
                        <div className="input-group">
                            <FaCar className="icon" />
                            <select
                                value={formData.parqueadero_id}
                                onChange={(e) => setFormData({ ...formData, parqueadero_id: e.target.value })}
                                required
                            >
                                <option value="">Selecciona parqueadero</option>
                                {parqueaderos.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre} - {p.direccion}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <FaCalendarAlt className="icon" />
                            <input
                                type="date"
                                placeholder="Fecha de reserva"
                                value={formData.fecha_reserva}
                                onChange={(e) => setFormData({ ...formData, fecha_reserva: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <FaClock className="icon" />
                            <input
                                type="time"
                                placeholder="Hora inicio (opcional)"
                                value={formData.hora_inicio}
                                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <FaClock className="icon" />
                            <input
                                type="time"
                                placeholder="Hora fin (opcional)"
                                value={formData.hora_fin}
                                onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <FaCar className="icon" />
                            <select
                                value={formData.tipo_vehiculo}
                                onChange={(e) => setFormData({ ...formData, tipo_vehiculo: e.target.value })}
                            >
                                <option value="carro">Carro</option>
                                <option value="moto">Moto</option>
                                <option value="bicicleta">Bicicleta</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <FaComment className="icon" />
                            <textarea
                                placeholder="Observaciones (opcional)"
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            />
                        </div>
                        <button className="btn" type="submit">Crear Reserva</button>
                    </form>
                )}

                {mensaje && <p className="msg error">{mensaje}</p>}

                {countdown && (
                    <div className="countdown">
                        <p>Reserva {countdown.id} expira en: {Math.floor(countdown.timeLeft / 60)}:{(countdown.timeLeft % 60).toString().padStart(2, '0')}</p>
                    </div>
                )}

                <div className="reservas-list">
                    {reservas.length === 0 ? (
                        <p>No tienes reservas.</p>
                    ) : (
                        reservas.map(r => (
                            <div key={r.id} className="reserva-item">
                                <h3>{r.parqueadero_nombre}</h3>
                                <p>{r.direccion}</p>
                                <p>Fecha: {r.fecha_reserva} | {r.hora_inicio} - {r.hora_fin}</p>
                                <p>Vehículo: {r.tipo_vehiculo} | Estado: {r.estado}</p>
                                <p>Valor estimado: ${r.valor_estimado}</p>
                                {r.estado === 'pendiente' && (
                                    <>
                                        <button className="btn-authorize" onClick={() => autorizarIngreso(r.id)}>
                                            <FaKey /> Autorizar Ingreso
                                        </button>
                                        <button className="btn-cancel" onClick={() => cancelarReserva(r.id)}>
                                            <FaTimes /> Cancelar
                                        </button>
                                    </>
                                )}


                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
