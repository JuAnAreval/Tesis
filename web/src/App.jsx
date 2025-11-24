// App.js
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import RegisterParqueadero from './pages/RegisterParqueadero';
import Dashboard from './pages/Dashboard';
import ParqueaderoDashboard from './pages/ParqueaderoDashboard';
import ParqueaderoReservas from './pages/ParqueaderoReservas';
import ConfiguracionParqueadero from './pages/ConfiguracionParqueadero';
import Reservas from './pages/Reservas';
import './App.css';

/* Layout para las páginas de autenticación (Login, Registro).
  Aplica el estilo de centrado.
*/
const AuthLayout = () => (
  <div className="auth-layout">
    <Outlet /> {/* Aquí se renderiza <Login /> o <RegisterParqueadero /> */}
  </div>
);

/*
  Layout principal para las páginas "privadas" o que requieren Navbar.
*/
const MainLayout = () => (
  <div className="main-layout">
    <Navbar />
    <main className="main-content">
      <Outlet /> {/* Aquí se renderizan las páginas del dashboard, reservas, etc. */}
    </main>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas de Autenticación (centradas) */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Login />} />
          <Route path="/register-parqueadero" element={<RegisterParqueadero />} />
        </Route>

        {/* Rutas Principales (con Navbar) */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<ParqueaderoDashboard />} />
          <Route path="/reservas-parqueadero" element={<ParqueaderoReservas />} />
          <Route path="/configuracion-parqueadero" element={<ConfiguracionParqueadero />} />
          <Route path="/reservas" element={<Reservas />} />
          {/* 💡 Si tienes más páginas con Navbar, solo agrégalas aquí */}
        </Route>
        
        {/* Puedes agregar una ruta 404 Not Found aquí si quieres */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;