import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Dashboard() {
    const [parqueaderos, setParqueaderos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadParqueaderos = async () => {
            try {
                const res = await api.get('/parqueaderos');
                setParqueaderos(res.data);
            } catch (err) {
                console.error('Error al cargar parqueaderos:', err);
            } finally {
                setLoading(false);
            }
        };
        loadParqueaderos();
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <h2>Dashboard - Parqueaderos Disponibles</h2>
            {loading ? (
                <p>Cargando...</p>
            ) : parqueaderos.length === 0 ? (
                <p>No hay parqueaderos disponibles</p>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {parqueaderos.map((p) => (
                        <div key={p.id} style={{ border: '1px solid #ccc', padding: 16, borderRadius: 8 }}>
                            <h3>{p.nombre}</h3>
                            <p>Dirección: {p.direccion}</p>
                            <p>Cupos: {p.cupos}</p>
                            <p>Disponible: {p.disponible === 1 ? 'Sí' : 'No'}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
