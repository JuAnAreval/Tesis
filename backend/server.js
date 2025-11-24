const express = require("express");
const dotenv = require("dotenv");

// Cargar variables de entorno antes de requerir rutas/controladores
dotenv.config();

const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const parqueaderoRoutes = require("./routes/parqueaderoRoutes");
const reservasRoutes = require("./routes/reservasRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
// Habilitar CORS para que el mobile/web puedan hacer peticiones al backend
app.use(cors());

// Simple request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Health endpoint para verificar que el servidor está arriba
app.get('/', (req, res) => res.json({ status: 'ok', message: 'Backend up' }));
app.get('/health', (req, res) => res.json({ status: 'ok', message: 'Healthy' }));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/parqueaderos", parqueaderoRoutes);
app.use("/api/reservas", reservasRoutes);

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
        console.log('📱 URLs de acceso:');
        console.log(`   Local: http://localhost:${PORT}`);
        console.log(`   Emulador Android: http://10.0.2.2:${PORT}`);
        console.log(`   Red local: http://192.168.1.32:${PORT}`);
    });
}

module.exports = app;
