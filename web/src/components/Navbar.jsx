import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    FaSignOutAlt,
    FaHome,
    FaCalendarAlt,
    FaUser,
    FaCog,
    FaBars, // 💡 Añadido
    FaTimes // 💡 Añadido
} from 'react-icons/fa';

// --- Links para cada tipo de usuario ---
// (Puedes moverlos fuera del componente si lo prefieres)

const adminLinks = [
    { to: "/dashboard", label: "Dashboard", icon: FaHome },
    { to: "/reservas-parqueadero", label: "Reservas", icon: FaCalendarAlt },
    { to: "/configuracion-parqueadero", label: "Configuración", icon: FaCog }
];

const userLinks = [
    { to: "/dashboard", label: "Dashboard", icon: FaHome },
    { to: "/reservas", label: "Mis Reservas", icon: FaCalendarAlt },
    // 💡 Añadí la ruta /perfil que tenías en tu lógica
    { to: "/perfil", label: "Perfil", icon: FaUser }
];


// --- Componente de Enlace Reutilizable ---

function NavLinkItem({ to, icon: Icon, label, currentPath, isMobile = false, onClick = () => { } }) {
    const isActive = currentPath === to;

    // Clases unificadas
    const baseClasses = "flex items-center px-3 py-2 rounded-md font-medium transition-colors duration-150";
    const layoutClasses = isMobile ? "block text-base" : "text-sm";
    const activeClasses = "bg-sky-50 text-sky-700"; // Unificado a 'sky'
    const inactiveClasses = "text-gray-700 hover:bg-gray-50 hover:text-gray-900";

    return (
        <Link
            to={to}
            className={`${baseClasses} ${layoutClasses} ${isActive ? activeClasses : inactiveClasses}`}
            onClick={onClick}
        >
            <Icon className={isMobile ? "mr-2" : "mr-1.5"} aria-hidden="true" />
            {label}
        </Link>
    );
}


// --- Componente Navbar Principal ---

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [parqueadero, setParqueadero] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // La lógica no se toca (perfecta)
    useEffect(() => {
        const parqueaderoData = localStorage.getItem('parqueadero');
        if (parqueaderoData) {
            setParqueadero(JSON.parse(parqueaderoData));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('parqueadero');
        navigate('/');
    };

    const isParqueaderoAdmin = parqueadero !== null;
    const navLinks = isParqueaderoAdmin ? adminLinks : userLinks;
    const currentPath = location.pathname;

    return (
        // Estructura principal (nav, div, div) intacta
        <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/dashboard" className="text-sky-600 font-extrabold text-xl">
                                Fast Parking
                            </Link>
                            {isParqueaderoAdmin && (
                                <span className="ml-2 text-xs font-medium px-2 py-1 bg-sky-50 text-sky-700 rounded-full">
                                    Admin
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Desktop menu (¡Ahora mucho más limpio!) */}
                    <div className="hidden md:flex md:items-center md:space-x-4">
                        {navLinks.map((link) => (
                            <NavLinkItem
                                key={link.to}
                                to={link.to}
                                icon={link.icon}
                                label={link.label}
                                currentPath={currentPath}
                            />
                        ))}
                        <button
                            onClick={handleLogout}
                            className="ml-2 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 flex items-center"
                        >
                            <FaSignOutAlt className="mr-1.5" /> Salir
                        </button>
                    </div>

                    {/* Mobile menu button (¡Con React Icons!) */}
                    <div className="flex md:hidden items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-sky-700 hover:bg-gray-100 focus:outline-none"
                            aria-controls="mobile-menu"
                            aria-expanded={isMenuOpen}
                        >
                            <span className="sr-only">Abrir menú</span>
                            {isMenuOpen ? (
                                <FaTimes className="h-6 w-6" />
                            ) : (
                                <FaBars className="h-6 w-6" />
                            )}
                        </button>
                    </div>

                </div>
            </div>

            {/* Mobile menu (¡Ahora también mucho más limpio!) */}
            {isMenuOpen && (
                <div className="md:hidden border-t" id="mobile-menu">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map((link) => (
                            <NavLinkItem
                                key={link.to}
                                to={link.to}
                                icon={link.icon}
                                label={link.label}
                                currentPath={currentPath}
                                isMobile={true}
                                onClick={() => setIsMenuOpen(false)} // Cierra el menú al navegar
                            />
                        ))}
                        <button
                            onClick={() => {
                                handleLogout();
                                setIsMenuOpen(false);
                            }}
                            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 flex items-center"
                        >
                            <FaSignOutAlt className="mr-2" /> Salir
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}