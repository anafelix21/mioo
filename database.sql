-- ============================================
-- BASE DE DATOS - CARNICERÍA POCHITO
-- Script completo para crear todas las tablas
-- ============================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS pochitoweb;
USE pochitoweb;

-- ===============================
-- 🧱 TABLAS BÁSICAS
-- ===============================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NULL,
    dni VARCHAR(20) NULL,
    direccion VARCHAR(255) NULL,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================
-- 🛒 TABLAS DE PRODUCTOS Y RELACIONES
-- ===============================
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    tiene_oferta BOOLEAN DEFAULT FALSE,
    imagen VARCHAR(255) NOT NULL,
    stock INT DEFAULT 0,
    categoria_id INT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre),
    INDEX idx_categoria (categoria_id),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 🔗 Relación productos ↔ categorías (para compatibilidad del CRUD)
CREATE TABLE producto_categorias (
    producto_id INT NOT NULL,
    categoria_id INT NOT NULL,
    PRIMARY KEY (producto_id, categoria_id),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================
-- 📦 TABLAS DE PEDIDOS Y DETALLES
-- ===============================
CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    subtotal DECIMAL(10,2),
    igv DECIMAL(10,2),
    envio DECIMAL(10,2),
    total DECIMAL(10,2),
    direccion VARCHAR(255),
    tipo_entrega VARCHAR(50),
    metodo_pago VARCHAR(50),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha (fecha),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pedido_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id VARCHAR(255),
    nombre VARCHAR(255),
    precio DECIMAL(10,2),
    cantidad INT,
    subtotal DECIMAL(10,2),
    INDEX idx_pedido (pedido_id),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================
-- 🛍️ TABLA DE CARRITO
-- ===============================
CREATE TABLE carrito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    INDEX idx_producto (producto_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================
-- 📩 TABLAS DE RECLAMOS Y RECOMENDACIONES
-- ===============================
CREATE TABLE reclamos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo VARCHAR(50) NOT NULL DEFAULT 'reclamo',
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha (fecha),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE recomendaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha (fecha),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================
-- 📂 DATOS INICIALES
-- ===============================

-- Administrador por defecto
-- Email: admin@pochito.com | Password: admin123
INSERT INTO administradores (nombre, apellido, email, password) 
VALUES ('Admin', 'Pochito', 'admin@pochito.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5OU7BlEihwLzK')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Categorías base
INSERT IGNORE INTO categorias (nombre) VALUES
('Carne de Res / Vacuno'),
('Carne de Cerdo'),
('Carne de Pollo'),
('Todo para Asar'),
('Cuchillos y Utensilios'),
('Parrillas y Soportes'),
('Limpieza y Mantenimiento'),
('Combustible y Encendido'),
('Equipos adicionales');

-- Productos ejemplo
INSERT INTO productos (nombre, descripcion, precio, tiene_oferta, imagen, stock, categoria_id) VALUES
('Bistec de res', 'Corte fresco de res', 25.90, FALSE, 'bistec.jpg', 10, 1),
('Chuletas de cerdo', 'Corte jugoso de cerdo', 22.50, TRUE, 'chuletas_cerdo.jpg', 15, 2),
('Pechuga de pollo', 'Pechuga de pollo fresca', 18.90, FALSE, 'pechuga_pollo.jpg', 20, 3),
('Lomo fino', 'Corte premium de res', 45.00, TRUE, 'lomo.jpg', 8, 1)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Asignar relación productos ↔ categorías
INSERT IGNORE INTO producto_categorias (producto_id, categoria_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 1);

-- Usuarios de ejemplo
-- Nota: Las contraseñas deben ser hasheadas con bcrypt antes de insertar
INSERT INTO usuarios (id, nombre, apellido, email, password, fecha_nacimiento, dni, direccion) VALUES
(1, 'Luis', 'Torres', 'luis.torres@vallegrande.edu.pe', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5OU7BlEihwLzK', '2007-07-28', '61128435', 'Imperial'),
(2, 'Wilfredo', 'Benavente', 'lu@gamil.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5OU7BlEihwLzK', '2007-07-28', '61128435', 'Imperial'),
(3, 'Jimena', 'Aburto', 'yojana.aburto@vallegrande.edu.pe', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5OU7BlEihwLzK', '2007-01-16', '61253332', 'Los Angeles Quilmaná')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- ===============================
-- 👥 USUARIOS MYSQL PARA ACCESO REMOTO
-- ===============================
CREATE USER IF NOT EXISTS 'pochito_user'@'%' IDENTIFIED BY 'Pochito2025!Secure';
CREATE USER IF NOT EXISTS 'wilfredo'@'%' IDENTIFIED BY '12345678';
CREATE USER IF NOT EXISTS 'jimena'@'%' IDENTIFIED BY 'jimena123456';

GRANT ALL PRIVILEGES ON pochitoweb.* TO 'pochito_user'@'%';
GRANT ALL PRIVILEGES ON pochitoweb.* TO 'wilfredo'@'%';
GRANT ALL PRIVILEGES ON pochitoweb.* TO 'jimena'@'%';
FLUSH PRIVILEGES;

-- ===============================
-- 🔍 VERIFICACIÓN
-- ===============================
SHOW TABLES;
SELECT COUNT(*) AS total_productos FROM productos;
SELECT COUNT(*) AS total_categorias FROM categorias;
SELECT COUNT(*) AS total_usuarios FROM usuarios;

-- ============================================
-- SCRIPT COMPLETADO
-- ============================================
