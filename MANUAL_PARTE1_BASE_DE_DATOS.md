# 📘 MANUAL PARTE 1: CONFIGURAR INSTANCIA DE BASE DE DATOS
## Carnicería Pochito - MySQL en EC2 (Debian)

---

## 🎯 OBJETIVO

Configurar una instancia EC2 en AWS con MySQL para alojar la base de datos de la aplicación.

---

## 📋 PASO 1: CREAR INSTANCIA EC2 PARA BASE DE DATOS

### 1.1 Entrar a AWS Console

1. Ir a [https://aws.amazon.com/console/](https://aws.amazon.com/console/)
2. Iniciar sesión con tu cuenta
3. Buscar **EC2** en el buscador superior
4. Click en **EC2**

### 1.2 Lanzar Nueva Instancia

1. Click en **"Launch Instance"** (botón naranja)
2. Configurar los siguientes datos:

#### Configuración Básica:
```
📝 Name and tags:
   - Name: Pochito-Database

🖥️ Application and OS Images (Amazon Machine Image):
   - Quick Start: Debian
   - Seleccionar: Debian 11 o Debian 12 (64-bit x86)

⚙️ Instance type:
   - t2.micro (capa gratuita) ✅ Recomendado para pruebas
   - t2.small (para uso real)

🔑 Key pair (login):
   - Si ya tienes: Seleccionar tu par de claves existente
   - Si no tienes: Click en "Create new key pair"
     * Name: pochito-key
     * Key pair type: RSA
     * Private key file format: .pem
     * Click "Create key pair" y GUARDA EL ARCHIVO .pem
```

### 1.3 Configurar Network Settings (MUY IMPORTANTE)

Click en **"Edit"** en la sección Network settings:

```
🌐 Network settings:

✅ Auto-assign public IP: Enable

🔒 Firewall (Security groups):
   - Seleccionar: "Create security group"
   - Security group name: Pochito-DB-SG
   - Description: Security group para base de datos MySQL

📍 Inbound Security Group Rules:

REGLA 1: SSH (para conectarte)
   - Type: SSH
   - Protocol: TCP
   - Port range: 22
   - Source type: My IP
   - Description: SSH desde mi IP

REGLA 2: MySQL (TEMPORAL - para configuración inicial)
   - Type: MySQL/Aurora
   - Protocol: TCP
   - Port range: 3306
   - Source type: My IP
   - Description: MySQL temporal desde mi IP
```

**⚠️ NOTA IMPORTANTE**: Después configuraremos la regla de MySQL para que solo acepte conexiones desde la instancia de la aplicación.

### 1.4 Configurar Storage

```
💾 Configure storage:
   - Size (GiB): 8 GB (mínimo) o 20 GB (recomendado)
   - Volume type: gp3 (General Purpose SSD)
```

### 1.5 Lanzar Instancia

1. Revisar el resumen en el panel derecho
2. Click en **"Launch instance"** (botón naranja)
3. Esperar que aparezca el mensaje de éxito
4. Click en **"View all instances"**

### 1.6 Anotar Datos de la Instancia

Cuando la instancia esté en estado **"Running"**:

```
📝 DATOS DE LA INSTANCIA DE BASE DE DATOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Instance ID: i-xxxxxxxxxxxxxxxxx
Public IPv4 address: XX.XX.XX.XX (Anotar aquí) ➡️ _________________
Private IPv4 address: 172.31.XX.XX (Anotar aquí) ➡️ _________________
Security Group: Pochito-DB-SG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔌 PASO 2: CONECTARSE A LA INSTANCIA

### 2.1 Desde Windows (PowerShell)

```powershell
# Navegar a donde está tu archivo .pem
cd C:\Users\TU_USUARIO\Downloads

# Configurar permisos del archivo .pem (solo primera vez)
icacls "pochito-key.pem" /inheritance:r
icacls "pochito-key.pem" /grant:r "$($env:USERNAME):(R)"

# Conectar por SSH (reemplaza XX.XX.XX.XX con tu IP pública)
ssh -i "pochito-key.pem" admin@XX.XX.XX.XX
```

### 2.2 Desde Linux/Mac (Terminal)

```bash
# Navegar a donde está tu archivo .pem
cd ~/Downloads

# Cambiar permisos (solo primera vez)
chmod 400 pochito-key.pem

# Conectar por SSH
ssh -i pochito-key.pem admin@XX.XX.XX.XX
```

**Si te pide confirmación**, escribe `yes` y presiona Enter.

Deberías ver algo como:
```
admin@ip-172-31-XX-XX:~$
```

---

## 🗄️ PASO 3: INSTALAR MYSQL EN DEBIAN

### 3.1 Actualizar el Sistema

```bash
# Actualizar lista de paquetes
sudo apt update

# Actualizar paquetes instalados
sudo apt upgrade -y
```

### 3.2 Instalar MySQL Server

```bash
# Instalar MySQL
sudo apt install mysql-server -y

# Verificar que MySQL se instaló correctamente
mysql --version

# Deberías ver algo como: mysql  Ver 8.0.XX for Linux
```

### 3.3 Iniciar MySQL

```bash
# Iniciar el servicio de MySQL
sudo systemctl start mysql

# Habilitar MySQL para que inicie automáticamente
sudo systemctl enable mysql

# Verificar el estado
sudo systemctl status mysql
```

Deberías ver: `Active: active (running)`

Presiona `q` para salir de la vista de estado.

---

## ⚙️ PASO 4: CONFIGURAR MYSQL PARA ACCESO REMOTO

### 4.1 Editar Configuración de MySQL

```bash
# Editar el archivo de configuración
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

**Instrucciones en el editor nano:**
1. Usar las flechas del teclado para navegar
2. Buscar la línea que dice:
   ```
   bind-address = 127.0.0.1
   ```
3. Cambiarla por:
   ```
   bind-address = 0.0.0.0
   ```
4. Guardar: `Ctrl + O`, luego `Enter`
5. Salir: `Ctrl + X`

### 4.2 Reiniciar MySQL

```bash
# Reiniciar el servicio
sudo systemctl restart mysql

# Verificar que está corriendo
sudo systemctl status mysql
```

---

## 🔐 PASO 5: CREAR BASE DE DATOS Y USUARIOS

### 5.1 Entrar a MySQL como Root

```bash
# Conectar a MySQL
sudo mysql -u root
```

Deberías ver:
```
mysql>
```

### 5.2 Crear Base de Datos y Usuarios

Copia y pega los siguientes comandos uno por uno:

```sql
-- Crear la base de datos
CREATE DATABASE pochitoweb;

-- Crear usuario principal para la aplicación
CREATE USER 'pochito_user'@'%' IDENTIFIED BY 'Pochito2025!Secure';

-- Dar todos los permisos al usuario
GRANT ALL PRIVILEGES ON pochitoweb.* TO 'pochito_user'@'%';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar usuarios
SELECT User, Host FROM mysql.user WHERE User = 'pochito_user';

-- Salir de MySQL
EXIT;
```

---

## 📥 PASO 6: IMPORTAR LA ESTRUCTURA DE LA BASE DE DATOS

### 6.1 Subir el Archivo database.sql

**Desde tu PC (nueva ventana de PowerShell/Terminal):**

```powershell
# PowerShell (Windows) - Cambia las rutas según corresponda
scp -i "C:\Users\TU_USUARIO\Downloads\pochito-key.pem" "C:\ruta\a\database.sql" admin@XX.XX.XX.XX:/home/admin/
```

```bash
# Linux/Mac
scp -i ~/Downloads/pochito-key.pem /ruta/a/database.sql admin@XX.XX.XX.XX:/home/admin/
```

### 6.2 Importar el Script SQL

**Vuelve a la ventana SSH conectada a la instancia:**

```bash
# Verificar que el archivo se subió
ls -lh /home/admin/database.sql

# Importar la base de datos
mysql -u pochito_user -p pochitoweb < /home/admin/database.sql

# Cuando pida la contraseña, escribe:
# Pochito2025!Secure
```

### 6.3 Verificar que se Importó Correctamente

```bash
# Conectar a MySQL
mysql -u pochito_user -p pochitoweb

# Contraseña: Pochito2025!Secure
```

Dentro de MySQL, ejecutar:

```sql
-- Ver todas las tablas
SHOW TABLES;

-- Deberías ver:
-- +----------------------+
-- | Tables_in_pochitoweb |
-- +----------------------+
-- | administradores      |
-- | carrito              |
-- | categorias           |
-- | pedido_items         |
-- | pedidos              |
-- | producto_categorias  |
-- | productos            |
-- | reclamos             |
-- | recomendaciones      |
-- | usuarios             |
-- +----------------------+

-- Ver productos
SELECT * FROM productos;

-- Ver categorías
SELECT * FROM categorias;

-- Ver usuarios
SELECT id, nombre, email FROM usuarios;

-- Salir
EXIT;
```

---

## 🔒 PASO 7: CONFIGURAR SEGURIDAD (IMPORTANTE)

### 7.1 Anotar la IP Privada

```bash
# Ver la IP privada de esta instancia
hostname -I
```

Anota la IP que aparece (ejemplo: `172.31.45.123`):

```
📌 IP PRIVADA DE BASE DE DATOS: _________________
```

### 7.2 Actualizar Security Group (Después de crear la instancia de App)

**Por ahora deja el Security Group como está**. En la **PARTE 2** (después de crear la instancia de aplicación), volverás aquí para actualizar las reglas.

El cambio será:
- ❌ Eliminar: Regla MySQL con "My IP"
- ✅ Agregar: Regla MySQL con el Security Group de la aplicación

---

## ✅ PASO 8: VERIFICACIONES FINALES

### 8.1 Verificar que MySQL Acepta Conexiones Remotas

```bash
# Ver en qué interfaces está escuchando MySQL
sudo netstat -tuln | grep 3306

# Deberías ver:
# tcp        0      0 0.0.0.0:3306            0.0.0.0:*               LISTEN
```

Si no tienes `netstat`, instálalo:
```bash
sudo apt install net-tools -y
```

### 8.2 Probar Conexión Local

```bash
# Probar conexión
mysql -u pochito_user -p -h localhost pochitoweb

# Contraseña: Pochito2025!Secure

# Si funciona, escribe:
SHOW TABLES;
EXIT;
```

---

## 📝 RESUMEN DE CREDENCIALES

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗄️  INFORMACIÓN DE LA BASE DE DATOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 IP PÚBLICA: _________________
📍 IP PRIVADA: _________________

🔐 USUARIO MYSQL: pochito_user
🔐 CONTRASEÑA: Pochito2025!Secure
📦 BASE DE DATOS: pochitoweb
🔌 PUERTO: 3306

👤 ADMIN WEB (después de importar):
   Email: admin@pochito.com
   Password: admin123

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎉 ¡PARTE 1 COMPLETADA!

✅ Instancia EC2 creada  
✅ MySQL instalado y configurado  
✅ Base de datos importada  
✅ Usuario de acceso creado  
✅ Acceso remoto habilitado

**🚀 CONTINÚA CON LA PARTE 2: Configurar la Instancia de Aplicación**

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### No puedo conectarme por SSH
- Verifica que la instancia esté en estado "Running"
- Verifica que el Security Group tenga la regla de SSH (puerto 22)
- Verifica que estés usando la IP pública correcta
- Verifica los permisos del archivo .pem

### MySQL no inicia
```bash
sudo systemctl status mysql
sudo journalctl -u mysql -n 50
```

### No puedo importar database.sql
```bash
# Verificar que el archivo existe
ls -lh /home/admin/database.sql

# Intentar con sudo
sudo mysql pochitoweb < /home/admin/database.sql
```

---

**Elaborado por**: Equipo de Desarrollo Carnicería Pochito  
**Fecha**: Diciembre 2025  
**Versión**: 2.0
