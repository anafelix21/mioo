-- ============================================
-- BASE DE DATOS - CARNICERÍA POCHITO
-- Script completo para crear todas las tablas
-- ============================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS pochitoweb;
USE pochitoweb;

-- ============================================
-- TABLA: usuarios (Clientes)
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE,
    dni VARCHAR(20),
    direccion TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: administradores
-- ============================================
CREATE TABLE IF NOT EXISTS administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar administrador por defecto
-- Email: admin@pochito.com | Password: admin123
INSERT INTO administradores (nombre, apellido, email, password) 
VALUES ('Admin', 'Pochito', 'admin@pochito.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5OU7BlEihwLzK')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- ============================================
-- TABLA: categorias
-- ============================================
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar categorías por defecto
INSERT INTO categorias (nombre, descripcion) VALUES 
('Carne de Res', 'Cortes selectos de carne de res'),
('Carne de Cerdo', 'Cortes de carne de cerdo'),
('Carne de Pollo', 'Pollo fresco y productos avícolas'),
('Parrillas', 'Equipos y accesorios para parrilla'),
('Cuchillos', 'Cuchillos profesionales de carnicería'),
('Limpieza', 'Productos de limpieza e higiene'),
('Libros', 'Libros de recetas y cocina'),
('Adicionales', 'Otros productos y accesorios')
ON DUPLICATE KEY UPDATE descripcion=VALUES(descripcion);

-- ============================================
-- TABLA: productos
-- ============================================
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    tiene_oferta BOOLEAN DEFAULT FALSE,
    precio_oferta DECIMAL(10, 2) NULL,
    imagen VARCHAR(255),
    stock INT DEFAULT 0,
    categoria_id INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre),
    INDEX idx_categoria (categoria_id),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: pedidos
-- ============================================
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    igv DECIMAL(10, 2) NOT NULL,
    envio DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    direccion TEXT NOT NULL,
    tipo_entrega VARCHAR(50),
    metodo_pago VARCHAR(50),
    estado VARCHAR(50) DEFAULT 'pendiente',
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha (fecha_pedido),
    INDEX idx_estado (estado),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: pedido_items (Detalles de pedidos)
-- ============================================
CREATE TABLE IF NOT EXISTS pedido_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT,
    nombre VARCHAR(200) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    cantidad INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    INDEX idx_pedido (pedido_id),
    INDEX idx_producto (producto_id),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: reclamos
-- ============================================
CREATE TABLE IF NOT EXISTS reclamos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo VARCHAR(100),
    mensaje TEXT NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    fecha_reclamo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_reclamo),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: recomendaciones
-- ============================================
CREATE TABLE IF NOT EXISTS recomendaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_recomendacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha (fecha_recomendacion),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- Productos de ejemplo para Carne de Res
INSERT INTO productos (nombre, descripcion, precio, tiene_oferta, precio_oferta, imagen, stock, categoria_id) VALUES 
('Lomo Fino', 'Corte premium de carne de res', 45.90, TRUE, 39.90, 'lomo-fino.jpg', 50, 1),
('Bife Angosto', 'Corte de res para parrilla', 38.50, FALSE, NULL, 'bife-angosto.jpg', 30, 1),
('Asado de Tira', 'Perfecto para asados familiares', 32.00, FALSE, NULL, 'asado-tira.jpg', 40, 1)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Productos de ejemplo para Carne de Cerdo
INSERT INTO productos (nombre, descripcion, precio, tiene_oferta, precio_oferta, imagen, stock, categoria_id) VALUES 
('Chuleta de Cerdo', 'Chuletas frescas de cerdo', 28.90, FALSE, NULL, 'chuleta-cerdo.jpg', 45, 2),
('Costillas de Cerdo', 'Costillas BBQ', 35.50, TRUE, 29.90, 'costillas-cerdo.jpg', 25, 2)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Productos de ejemplo para Pollo
INSERT INTO productos (nombre, descripcion, precio, tiene_oferta, precio_oferta, imagen, stock, categoria_id) VALUES 
('Pollo Entero', 'Pollo fresco entero', 18.90, FALSE, NULL, 'pollo-entero.jpg', 60, 3),
('Pechuga de Pollo', 'Pechuga sin hueso', 24.50, TRUE, 21.90, 'pechuga-pollo.jpg', 55, 3)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- ============================================
-- VISTAS ÚTILES (OPCIONAL)
-- ============================================

-- Vista de productos con categoría
CREATE OR REPLACE VIEW vista_productos_completa AS
SELECT 
    p.id,
    p.nombre,
    p.descripcion,
    p.precio,
    p.tiene_oferta,
    p.precio_oferta,
    p.imagen,
    p.stock,
    c.nombre AS categoria_nombre,
    p.fecha_creacion
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id;

-- Vista de estadísticas de pedidos
CREATE OR REPLACE VIEW vista_estadisticas_pedidos AS
SELECT 
    COUNT(*) AS total_pedidos,
    SUM(total) AS ventas_totales,
    AVG(total) AS promedio_venta,
    DATE(fecha_pedido) AS fecha
FROM pedidos
GROUP BY DATE(fecha_pedido);

-- ============================================
-- SCRIPT COMPLETADO
-- ============================================
