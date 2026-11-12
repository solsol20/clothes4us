-- Clothes4Us - estructura completa de la base de datos (referencia).
CREATE DATABASE IF NOT EXISTS clothes4us CHARACTER SET utf8mb4;
USE clothes4us;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  contacto VARCHAR(100) NOT NULL UNIQUE,          -- correo o teléfono
  password VARCHAR(255) NOT NULL,                 -- hash bcrypt (nunca la contraseña real)
  avatar MEDIUMTEXT DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  intentos_fallidos INT NOT NULL DEFAULT 0,
  bloqueado_hasta BIGINT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS sesiones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expira BIGINT NOT NULL,
  creada BIGINT NOT NULL,
  INDEX idx_sesiones_usuario (usuario_id)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS recuperaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  codigo_hash CHAR(64) NOT NULL,
  intentos INT NOT NULL DEFAULT 0,
  usado TINYINT NOT NULL DEFAULT 0,
  expira BIGINT NOT NULL,
  creada BIGINT NOT NULL,
  INDEX idx_recuperaciones_usuario (usuario_id)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS publicaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(120) NULL,
  texto TEXT NOT NULL,
  precio DECIMAL(10,2) DEFAULT 0.00,              -- 0 = trueque
  categoria VARCHAR(50) DEFAULT 'Ropa',
  imagen MEDIUMTEXT NULL,
  estado VARCHAR(10) NOT NULL DEFAULT 'activa',   -- 'activa' | 'vendida'
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS reacciones (          -- "Me gusta"
  usuario_id INT NOT NULL, publicacion_id INT NOT NULL, fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, publicacion_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS guardados (
  usuario_id INT NOT NULL, publicacion_id INT NOT NULL, fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, publicacion_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS carrito (
  usuario_id INT NOT NULL, publicacion_id INT NOT NULL, fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, publicacion_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS comentarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  publicacion_id INT NOT NULL,
  usuario_id INT NOT NULL,
  texto VARCHAR(500) NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_comentarios_pub (publicacion_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS mensajes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  de_id INT NOT NULL,
  para_id INT NOT NULL,
  publicacion_id INT NULL,
  texto VARCHAR(1000) NOT NULL DEFAULT '',
  imagen MEDIUMTEXT NULL,
  leido TINYINT NOT NULL DEFAULT 0,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mensajes_para (para_id, leido),
  INDEX idx_mensajes_par (de_id, para_id),
  FOREIGN KEY (de_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (para_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id) ON DELETE SET NULL
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS bloqueos (
  usuario_id INT NOT NULL, bloqueado_id INT NOT NULL, fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, bloqueado_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (bloqueado_id) REFERENCES usuarios(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS denuncias (            
  id INT AUTO_INCREMENT PRIMARY KEY,
  denunciante_id INT NOT NULL,
  tipo VARCHAR(20) NOT NULL,                    
  objetivo_id INT NOT NULL,
  motivo VARCHAR(300) NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (denunciante_id) REFERENCES usuarios(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS calificaciones (
  calificador_id INT NOT NULL, calificado_id INT NOT NULL, estrellas TINYINT NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (calificador_id, calificado_id),
  FOREIGN KEY (calificador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (calificado_id) REFERENCES usuarios(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
