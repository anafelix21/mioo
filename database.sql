-- =======================================================
-- 💾 SCRIPT COMPLETO BASE DE DATOS POCHITOWEB (LIMPIO)
-- =======================================================
DROP DATABASE IF EXISTS pochitoweb;
CREATE DATABASE pochitoweb;
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
    direccion VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

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
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE producto_categorias (
    producto_id INT NOT NULL,
    categoria_id INT NOT NULL,
    PRIMARY KEY (producto_id, categoria_id),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
) ENGINE=InnoDB;

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
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE pedido_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id VARCHAR(255),
    nombre VARCHAR(255),
    precio DECIMAL(10,2),
    cantidad INT,
    subtotal DECIMAL(10,2),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===============================
-- 🛍️ TABLA DE CARRITO
-- ===============================
CREATE TABLE carrito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===============================
-- 📩 TABLAS DE RECLAMOS Y RECOMENDACIONES
-- ===============================
CREATE TABLE reclamos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo VARCHAR(50) NOT NULL DEFAULT 'reclamo',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE recomendaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===============================
-- 📂 DATOS INICIALES
-- ===============================

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

-- Productos base (20 registros de ejemplo)
INSERT INTO productos (nombre, descripcion, precio, tiene_oferta, imagen, stock, categoria_id)
VALUES
('Bistec de res', 'Corte fresco de res', 25.90, FALSE, 'bistec.jpg', 20, 1),
('Lomo fino', 'Corte premium de res', 45.00, TRUE, 'lomo_fino.jpg', 10, 1),
('Asado de tira', 'Ideal para parrilla', 38.50, FALSE, 'asado_tira.jpg', 12, 1),
('Carne molida', 'Res molida 100% natural', 19.00, FALSE, 'carne_molida.jpg', 25, 1),
('Chuletas de cerdo', 'Corte jugoso', 22.50, TRUE, 'chuletas_cerdo.jpg', 18, 2),
('Costillas de cerdo', 'Perfectas para BBQ', 27.00, FALSE, 'costillas_cerdo.jpg', 20, 2),
('Pierna de cerdo', 'Corte entero para horno', 30.00, TRUE, 'pierna_cerdo.jpg', 8, 2),
('Pechuga de pollo', 'Fresca y sin piel', 18.90, FALSE, 'pechuga_pollo.jpg', 30, 3),
('Ala de pollo', 'Para freír o asar', 15.00, FALSE, 'alas_pollo.jpg', 25, 3),
('Muslo de pollo', 'Corte jugoso', 17.00, FALSE, 'muslo_pollo.jpg', 22, 3),
('Salchicha parrillera', 'Para asados familiares', 20.50, TRUE, 'salchicha.jpg', 25, 4),
('Chorizo artesanal', 'Hecho en casa', 21.90, FALSE, 'chorizo.jpg', 15, 4),
('Carbón vegetal', 'De larga duración', 12.50, FALSE, 'carbon.jpg', 50, 8),
('Encendedor líquido', 'Fácil de usar', 10.00, FALSE, 'encendedor.jpg', 40, 8),
('Parrilla mediana', 'Ideal para jardín', 250.00, TRUE, 'parrilla_mediana.jpg', 5, 6),
('Parrilla grande', 'Acero inoxidable', 420.00, TRUE, 'parrilla_grande.jpg', 3, 6),
('Cuchillo parrillero', 'Acero inoxidable', 45.00, FALSE, 'cuchillo.jpg', 10, 5),
('Pinzas parrilleras', 'Para asar fácilmente', 30.00, FALSE, 'pinzas.jpg', 12, 5),
('Guantes térmicos', 'Protección al cocinar', 25.00, FALSE, 'guantes.jpg', 15, 7),
('Cepillo limpiador', 'Para limpiar parrilla', 18.00, FALSE, 'cepillo.jpg', 18, 7);

-- Relación producto ↔ categoría
INSERT INTO producto_categorias (producto_id, categoria_id) VALUES
(1,1),(2,1),(3,1),(4,1),
(5,2),(6,2),(7,2),
(8,3),(9,3),(10,3),
(11,4),(12,4),
(13,8),(14,8),
(15,6),(16,6),
(17,5),(18,5),
(19,7),(20,7);

-- ===============================
-- 👥 USUARIOS MYSQL PARA PRUEBAS
-- ===============================
CREATE USER IF NOT EXISTS 'wilfredo'@'%' IDENTIFIED BY '12345678';
CREATE USER IF NOT EXISTS 'jimena'@'%' IDENTIFIED BY 'jimena123456';

GRANT ALL PRIVILEGES ON pochitoweb.* TO 'wilfredo'@'%';
GRANT ALL PRIVILEGES ON pochitoweb.* TO 'jimena'@'%';
FLUSH PRIVILEGES;

-- ===============================
-- 🔍 VERIFICACIÓN
-- ===============================
SHOW TABLES;
SELECT COUNT(*) AS total_usuarios FROM usuarios;
SELECT COUNT(*) AS total_productos FROM productos;
SELECT COUNT(*) AS total_categorias FROM categorias;
SELECT COUNT(*) AS total_admins FROM administradores;

SELECT * FROM usuarios;
SELECT * FROM administradores;
SELECT * FROM categorias;
SELECT * FROM productos;
SELECT * FROM producto_categorias;
SELECT * FROM pedidos;
SELECT * FROM pedido_items;
SELECT * FROM carrito;
SELECT * FROM reclamos;
SELECT * FROM recomendaciones;
