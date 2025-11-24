import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCar, FaMotorcycle, FaParking, FaCog } from 'react-icons/fa';
import api from '../services/api';

export default function ConfiguracionParqueadero() {
    const navigate = useNavigate();
    const [parqueadero, setParqueadero] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    
    // Formulario para tarifas y cupos
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        cupos_totales: 0,
        cupos_disponibles: 0,
        tarifa_carro: 0,
        tarifa_moto: 0
    });

    useEffect(() => {
        const parqueaderoData = localStorage.getItem('parqueadero');
        if (!parqueaderoData) {
            navigate('/');
            return;
        }

        const parqueaderoObj = JSON.parse(parqueaderoData);
        loadParqueaderoData(parqueaderoObj.id);
    }, [navigate]);

    const loadParqueaderoData = async (parqueaderoId) => {
        try {
            setLoading(true);
            const response = await api.get(`/parqueaderos/${parqueaderoId}`);
            
            if (response.data) {
                setParqueadero(response.data);
                
                // Cargar datos de tarifas
                const tarifasResponse = await api.get(`/parqueaderos/${parqueaderoId}/tarifas`);
                
                // Inicializar formulario con datos del parqueadero y tarifas
                setFormData({
                    nombre: response.data.nombre || '',
                    direccion: response.data.direccion || '',
                    cupos_totales: response.data.cupos_totales || 0,
                    cupos_disponibles: response.data.cupos_disponibles || 0,
                    tarifa_carro: tarifasResponse.data.find(t => t.tipo_vehiculo === 'carro')?.tarifa_hora || 0,
                    tarifa_moto: tarifasResponse.data.find(t => t.tipo_vehiculo === 'moto')?.tarifa_hora || 0
                });
            }
        } catch (error) {
            console.error('Error al cargar datos del parqueadero:', error);
            setMessage({
                text: 'Error al cargar los datos del parqueadero',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name.includes('tarifa') || name.includes('cupos') ? Number(value) : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!parqueadero) return;

        // Validar tarifas requeridas
        if (formData.tarifa_carro <= 0 || formData.tarifa_moto <= 0) {
            setMessage({
                text: 'Debes ingresar una tarifa válida para carro y moto antes de guardar.',
                type: 'error'
            });
            return;
        }
        // Validar cupos
        if (formData.cupos_disponibles > formData.cupos_totales) {
            setMessage({
                text: 'Los cupos disponibles no pueden ser mayores que los cupos totales.',
                type: 'error'
            });
            return;
        }
        try {
            setSaving(true);
            // Actualizar información básica del parqueadero
            await api.put(`/parqueaderos/${parqueadero.id}`, {
                nombre: formData.nombre,
                direccion: formData.direccion,
                cupos_totales: formData.cupos_totales,
                cupos_disponibles: formData.cupos_disponibles
            });
            // Crear o actualizar tarifas
            await api.put(`/parqueaderos/${parqueadero.id}/tarifas`, {
                tarifas: [
                    { tipo_vehiculo: 'carro', tarifa_hora: formData.tarifa_carro },
                    { tipo_vehiculo: 'moto', tarifa_hora: formData.tarifa_moto }
                ]
            });
            setMessage({
                text: 'Configuración actualizada correctamente',
                type: 'success'
            });
            // Actualizar datos en localStorage
            const updatedParqueadero = {
                ...parqueadero,
                nombre: formData.nombre,
                direccion: formData.direccion
            };
            localStorage.setItem('parqueadero', JSON.stringify(updatedParqueadero));
        } catch (error) {
            console.error('Error al guardar configuración:', error);
            setMessage({
                text: 'Error al guardar la configuración',
                type: 'error'
            });
        } finally {
            setSaving(false);
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 3000);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-6">
                    <FaCog className="text-primary-600 text-2xl mr-2" />
                    <h1 className="text-2xl font-bold text-gray-800">Configuración del Parqueadero</h1>
                </div>
                
                {message.text && (
                    <div className={`mb-6 p-4 rounded-md ${
                        message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {message.text}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del Parqueadero
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                className="input-field"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dirección
                            </label>
                            <input
                                type="text"
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleInputChange}
                                className="input-field"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <FaParking className="mr-2 text-primary-600" /> Gestión de Cupos
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cupos Totales
                                </label>
                                <input
                                    type="number"
                                    name="cupos_totales"
                                    value={formData.cupos_totales}
                                    onChange={handleInputChange}
                                    className="input-field"
                                    min="1"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cupos Disponibles
                                </label>
                                <input
                                    type="number"
                                    name="cupos_disponibles"
                                    value={formData.cupos_disponibles}
                                    onChange={handleInputChange}
                                    className="input-field"
                                    min="0"
                                    max={formData.cupos_totales}
                                    required
                                />
                                {formData.cupos_disponibles > formData.cupos_totales && (
                                    <p className="text-red-600 text-sm mt-1">
                                        Los cupos disponibles no pueden ser mayores que los cupos totales
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Tarifas</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center p-4 bg-white rounded-md shadow-sm">
                                <FaCar className="text-2xl text-primary-600 mr-3" />
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tarifa para Carros (por hora)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            name="tarifa_carro"
                                            value={formData.tarifa_carro}
                                            onChange={handleInputChange}
                                            className="input-field pl-8"
                                            min="0"
                                            step="100"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center p-4 bg-white rounded-md shadow-sm">
                                <FaMotorcycle className="text-2xl text-primary-600 mr-3" />
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tarifa para Motos (por hora)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            name="tarifa_moto"
                                            value={formData.tarifa_moto}
                                            onChange={handleInputChange}
                                            className="input-field pl-8"
                                            min="0"
                                            step="100"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="btn-primary flex items-center"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Configuración'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
