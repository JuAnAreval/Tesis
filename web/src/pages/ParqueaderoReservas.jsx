import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaClock, FaCar, FaCheck, FaTimes, FaKey, FaEye } from "react-icons/fa";
import api from "../services/api";
import "./reservas.css";

export default function ParqueaderoReservas() {
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [parqueaderoInfo, setParqueaderoInfo] = useState(null);

    // Obtener parqueaderoId del localStorage
    const parqueadero = JSON.parse(localStorage.getItem("parqueadero"));
    const parqueaderoId = parqueadero?.id;

    useEffect(() => {
        if (parqueaderoId) {
            loadData();
        }
    }, [parqueaderoId]);

    const loadData = async () => {
        try {
            const reservasRes = await api.get(`/reservas/parqueadero/${parqueaderoId}`);
            setReservas(reservasRes.data);
            setParqueaderoInfo(parqueadero);
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

    const autorizarIngreso = async (id) => {
        try {
            await api.put(`/reservas/${id}/autorizar-ingreso`);
            showSnack("Ingreso autorizado.", "success");
            loadData();
        } catch (err) {
            showSnack("Error al autorizar ingreso.", "error");
        }
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

    const completarReserva = async (id) => {
        try {
            await api.put(`/reservas/${id}/completar`);
            showSnack("Reserva completada.", "success");
            loadData();
        } catch (err) {
            showSnack("Error al completar reserva.", "error");
        }
    };

    const calcularTarifa = async (id) => {
        try {
            const res = await api.get(`/reservas/${id}/tarifa`);
            // Calcular tarifa usando primera_hora y hora_adicional
            const tiempoTotal = res.data.tiempo_total;
            const tarifaPrimeraHora = res.data.tarifa_primera_hora;
            const tarifaHoraAdicional = res.data.tarifa_hora_adicional;
            let costoTotal = 0;

            if (tiempoTotal <= 1) {
                // Primera hora proporcional
                costoTotal = tiempoTotal * tarifaPrimeraHora;
            } else {
                // Primera hora completa + horas adicionales
                costoTotal = tarifaPrimeraHora + (tiempoTotal - 1) * tarifaHoraAdicional;
            }

            alert(`Tiempo total: ${tiempoTotal.toFixed(2)} horas\nPrimera hora: $${tarifaPrimeraHora}\nHoras adicionales: $${tarifaHoraAdicional}\nCosto total: $${costoTotal.toFixed(2)}`);
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
                <h1 className="title">Gestión de Parqueadero</h1>
                {parqueaderoInfo && (
                    <div className="parqueadero-info">
                        <h2>{parqueaderoInfo.nombre}</h2>
                        <p className="subtitle">Administra las reservas de tu parqueadero.</p>
                    </div>
                )}

                <div className="stats-container">
                    <div className="stat-card">
                        <h3>Reservas Pendientes</h3>
                        <p className="stat-number">{reservas.filter(r => r.estado === 'pendiente').length}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Reservas Activas</h3>
                        <p className="stat-number">{reservas.filter(r => r.estado === 'activa').length}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Reservas Completadas</h3>
                        <p className="stat-number">{reservas.filter(r => r.estado === 'completada').length}</p>
                    </div>
                </div>

                <h2 className="section-title">Reservas Actuales</h2>
                <div className="reservas-list">
                    {reservas.length === 0 ? (
                        <p>No hay reservas para este parqueadero.</p>
                    ) : (
                        reservas.map(r => (
                            <div key={r.id} className={`reserva-item ${r.estado}`}>
                                <div className="reserva-header">
                                    <h3>Reserva #{r.id}</h3>
                                    <span className={`estado-badge ${r.estado}`}>{r.estado}</span>
                                </div>
                                <p><strong>Cliente:</strong> {r.usuario_nombre} ({r.usuario_email})</p>
                                <p><strong>Fecha:</strong> {r.fecha_reserva} | <strong>Horario:</strong> {r.hora_inicio} - {r.hora_fin}</p>
                                <p><strong>Vehículo:</strong> {r.tipo_vehiculo} | <strong>Valor estimado:</strong> ${r.valor_estimado}</p>
                                {r.observaciones && <p><strong>Observaciones:</strong> {r.observaciones}</p>}
                                
                                <div className="reserva-actions">
                                    {r.estado === 'completada' && (
                                        <button className="btn-tariff" onClick={() => calcularTarifa(r.id)}>
                                            <FaEye /> Calcular Tarifa
                                        </button>
                                    )}
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
                                    {r.estado === 'activa' && (
                                        <button className="btn-complete" onClick={() => completarReserva(r.id)}>
                                            <FaCheck /> Completar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
