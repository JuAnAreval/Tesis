import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { FaParking, FaEnvelope, FaLock, FaMapMarkerAlt, FaHome, FaListOl } from "react-icons/fa";
import 'leaflet/dist/leaflet.css';
import './RegisterParqueadero.css';
import api from '../services/api';
import L from 'leaflet';

// --- Lista de ciudades ---
const ciudades = [
    { nombre: 'Pasto', coords: [1.2136, -77.2811] },
    { nombre: 'Bogotá', coords: [4.7110, -74.0721] },
    { nombre: 'Medellín', coords: [6.2476, -75.5658] },
    { nombre: 'Cali', coords: [3.4516, -76.5320] },
    { nombre: 'Barranquilla', coords: [10.9639, -74.7964] },
    { nombre: 'Cartagena', coords: [10.3910, -75.4794] },
];

// --- Íconos de Leaflet ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Componente para clics en el mapa ---
function LocationMarker({ setLatitud, setLongitud, latitud, longitud }) {
    useMapEvents({
        click(e) {
            setLatitud(e.latlng.lat);
            setLongitud(e.latlng.lng);
        },
    });
    return latitud && longitud ? <Marker position={[latitud, longitud]} /> : null;
}

// --- Cambiar vista del mapa dinámicamente ---
function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function RegisterParqueadero() {
    const [nombre, setNombre] = useState('');
    const [direccion, setDireccion] = useState('');
    const [cupos, setCupos] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [latitud, setLatitud] = useState(null);
    const [longitud, setLongitud] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const navigate = useNavigate();

    const [mapCenter, setMapCenter] = useState(ciudades[0].coords);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!latitud || !longitud) {
            setMensaje('⚠️ Por favor selecciona una ubicación en el mapa.');
            return;
        }
        setLoading(true);
        setMensaje('');
        try {
            const res = await api.post('/parqueaderos/register', {
                nombre,
                direccion,
                cupos: parseInt(cupos, 10),
                email,
                password,
                latitud,
                longitud,
            });
            setMensaje(res.data.message || '✅ ¡Registro completado con éxito!');
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
                navigate('/');
            }, 2500);
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.message || '❌ Error al registrar el parqueadero. Inténtalo de nuevo.';
            setMensaje(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleCityChange = (e) => {
        const selectedCity = ciudades.find(ciudad => ciudad.nombre === e.target.value);
        if (selectedCity) {
            setMapCenter(selectedCity.coords);
        }
    };

    const getMessageClass = () => {
        if (!mensaje) return '';
        if (mensaje.includes('✅')) return 'msg-success';
        if (mensaje.includes('❌')) return 'msg-error';
        if (mensaje.includes('⚠️')) return 'msg-warning';
        return 'msg-info';
    };

    return (
        <div className="register-container">
            <div className="auth-card">
                <div className="card-header">
                    <h1 className="title">
                        <FaParking />
                        <span>FAST PARKING</span>
                    </h1>
                    <p className="subtitle">Registra tu parqueadero y empieza a recibir clientes.</p>
                </div>

                <div className="register-content">
                    {/* 🗺️ Columna del Mapa */}
                    <div className="map-column">
                        <div className="city-selector-group">
                            <label htmlFor="city-select">Selecciona una ciudad para empezar:</label>
                            <select id="city-select" onChange={handleCityChange} className="city-selector">
                                {ciudades.map(ciudad => (
                                    <option key={ciudad.nombre} value={ciudad.nombre}>
                                        {ciudad.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="map-instruction">
                            <FaMapMarkerAlt /> Haz clic para fijar la ubicación
                        </p>
                        <MapContainer
                            center={mapCenter}
                            zoom={5}
                            className="map-container"
                        >
                            <ChangeView center={mapCenter} zoom={14} />
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                            <LocationMarker
                                setLatitud={setLatitud}
                                setLongitud={setLongitud}
                                latitud={latitud}
                                longitud={longitud}
                            />
                        </MapContainer>
                        {latitud && longitud && (
                            <p className="coords">Coordenadas: {latitud.toFixed(5)}, {longitud.toFixed(5)}</p>
                        )}
                    </div>

                    {/* 📋 Columna del Formulario */}
                    <div className="form-column">
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <FaHome className="input-icon" />
                                <input type="text" placeholder="Nombre del parqueadero" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <FaEnvelope className="input-icon" />
                                <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <FaLock className="input-icon" />
                                <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <FaMapMarkerAlt className="input-icon" />
                                <input type="text" placeholder="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <FaListOl className="input-icon" />
                                <input type="number" placeholder="Cupos disponibles" value={cupos} onChange={(e) => setCupos(e.target.value)} required min="1" />
                            </div>
                            <button type="submit" className="btn-register" disabled={loading}>
                                {loading ? 'Registrando...' : 'Crear Cuenta'}
                            </button>
                        </form>
                    </div>
                </div>

                {mensaje && <p className={`msg ${getMessageClass()}`}>{mensaje}</p>}

                <p className="footer-text">
                    ¿Ya tienes una cuenta? <Link to="/" className="link">Inicia sesión aquí</Link>
                </p>
            </div>

            {/* 🎉 Toast de Éxito */}
            {showToast && (
                <div className="toast-success">
                    <span>🎉 ¡Parqueadero registrado exitosamente!</span>
                </div>
            )}
        </div>
    );
}
