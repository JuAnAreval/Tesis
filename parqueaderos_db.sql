	drop database if exists parqueaderos_db;
	CREATE DATABASE IF NOT EXISTS parqueaderos_db;
	USE parqueaderos_db;

	CREATE TABLE usuarios (
	  id INT AUTO_INCREMENT PRIMARY KEY,
	  nombre VARCHAR(100) NOT NULL,
	  email VARCHAR(100) UNIQUE NOT NULL,
	  password VARCHAR(255) NOT NULL,
	  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE parqueaderos (
	  id INT AUTO_INCREMENT PRIMARY KEY,
	  nombre VARCHAR(100) NOT NULL,
	  direccion VARCHAR(150) NOT NULL,
	  cupos INT DEFAULT 0,
	  disponible BOOLEAN DEFAULT TRUE,
	  email VARCHAR(100) UNIQUE NOT NULL,
	  password VARCHAR(255) NOT NULL,
	  latitud DECIMAL(10, 7) NOT NULL,
	  longitud DECIMAL(10, 7) NOT NULL,
	  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE tarifas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parqueadero_id INT NOT NULL,
    tipo_vehiculo ENUM('camion', 'ambulancia', 'carro', 'moto', 'bicicleta') NOT NULL,
    
    tarifa_primera_hora DECIMAL(10,2) NOT NULL,    -- Precio de la primera hora
    tarifa_hora_adicional DECIMAL(10,2) NOT NULL,  -- Precio por cada hora adicional

    tarifa_dia_completo DECIMAL(10,2) DEFAULT NULL, -- Opcional: precio fijo por día (24h)
    tarifa_noche DECIMAL(10,2) DEFAULT NULL,        -- Opcional: precio nocturno, si aplica

    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parqueadero_id) REFERENCES parqueaderos(id)
);

	-- Tabla de reservas
    DROP TABLE IF EXISTS reservas;
	CREATE TABLE reservas (
	  id INT AUTO_INCREMENT PRIMARY KEY,
	  usuario_id INT NOT NULL,
	  parqueadero_id INT NOT NULL,
	  fecha_reserva DATE NOT NULL,
	  hora_inicio TIME,
	  hora_fin TIME,
	  tipo_vehiculo ENUM('carro', 'moto', 'bicicleta') DEFAULT 'carro',
	  estado ENUM('pendiente', 'activa', 'cancelada', 'completada') DEFAULT 'pendiente',
	  tiempo_total DECIMAL(5,2) DEFAULT 0.00,     -- horas totales calculadas
	  valor_estimado DECIMAL(10,2) DEFAULT 0.00,  -- costo calculado automáticamente
	  observaciones TEXT NULL,
	  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
	  FOREIGN KEY (parqueadero_id) REFERENCES parqueaderos(id)
	);
