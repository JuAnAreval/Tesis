// components/Login.js
import React, { useState } from "react";
// 💡 Importamos Link
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../services/api";
import "./login.css"; // Aún lo necesitamos para los estilos específicos del input-group

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    // 💡 Usaremos este estado para los mensajes
    const [mensaje, setMensaje] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // ❌ ELIMINADA: La función showSnack() (es un anti-patrón)

    const handleLogin = async (e) => {
        e.preventDefault();
        setMensaje(null); // Limpiamos mensajes anteriores
        setLoading(true);

        if (!email || !password) {
            // 💡 Usamos setMensaje
            setMensaje({
                type: "error",
                text: "Por favor ingresa correo y contraseña."
            });
            setLoading(false);
            return;
        }

        try {
            const res = await api.post("/parqueaderos/login", { email, password });
            const token = res.data.token;
            if (token) localStorage.setItem("token", token);
            if (res.data.parqueadero) {
                localStorage.setItem("parqueadero", JSON.stringify(res.data.parqueadero));
            }

            // 💡 Usamos setMensaje (opcional, ya que navegamos)
            setMensaje({ type: "success", text: "Inicio de sesión exitoso ✅" });
            setTimeout(() => navigate("/dashboard"), 1500); // Reducido un poco
        } catch (err) {
            console.error(err);
            let errorText = "Error al iniciar sesión."; // Default
            if (err.response) {
                if (err.response.status === 404) {
                    errorText = "No registrado. Haz click en Registrar.";
                } else if (err.response.status === 401) {
                    errorText = "Contraseña incorrecta.";
                }
            } else {
                errorText = "Error de conexión.";
            }
            // 💡 Usamos setMensaje
            setMensaje({ type: "error", text: errorText });
        } finally {
            setLoading(false);
        }
    };

    return (
        // 💡 Usamos la clase global .auth-box (de App.css)
        // ❌ Eliminamos .login-container (ahora lo maneja AuthLayout)
        <div className="auth-box">
            {/* 💡 Clases .title y .subtitle eliminadas. 
          Los estilos de h1 y p vienen de .auth-box h1 en App.css */}
            <h1>Fast Parking</h1>
            <p>Accede a tu cuenta para gestionar tus parqueaderos.</p>

            <form onSubmit={handleLogin}>
                <div className="input-group">
                    <FaEnvelope className="icon" />
                    <input
                        // 💡 Usamos la clase global .input
                        className="input"
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <FaLock className="icon" />
                    <input
                        // 💡 Usamos la clase global .input
                        className="input"
                        type={showPassword ? "text" : "password"}
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        className="toggle-pass"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>

                {/* 💡 Aquí renderizamos el mensaje de estado */}
                {mensaje && (
                    <div className={`alert alert-${mensaje.type} text-center`}>
                        {mensaje.text}
                    </div>
                )}

                <button
                    // 💡 Usamos .btn y .btn-primary de App.css
                    // Añadimos clases para el estado disabled
                    className={`btn btn-primary ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                    type="submit"
                    disabled={loading}
                >
                    {loading ? (
                        // 💡 Usamos el spinner global
                        <span className="spinner" style={{ width: '1.2rem', height: '1.2rem', borderWidth: '2px' }}></span>
                    ) : (
                        "Ingresar"
                    )}
                </button>
            </form>

            <p className="register-text">
                ¿No tienes cuenta?{" "}
                {/* 💡 Usamos <Link> de React Router */}
                <Link to="/register-parqueadero" className="link">
                    Regístrate aquí
                </Link>
            </p>
        </div>
    );
}