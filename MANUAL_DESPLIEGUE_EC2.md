# 📘 MANUAL DE DESPLIEGUE - CARNICERÍA POCHITO
## Despliegue en 2 Instancias EC2 de AWS (Debian)

---

## 🎯 ARQUITECTURA DEL SISTEMA

Este manual te guiará para desplegar la aplicación web de Carnicería Pochito en AWS usando:

- **Instancia EC2 #1 (Aplicación)**: Servidor web Flask con Nginx + Gunicorn
- **Instancia EC2 #2 (Base de Datos)**: Servidor MySQL

---

## 📋 REQUISITOS PREVIOS

- Cuenta de AWS activa
- Conocimientos básicos de Linux (Debian)
- Par de claves SSH (.pem) de AWS
- Cliente SSH (PuTTY en Windows o terminal en Linux/Mac)

---

## 🚀 PARTE 1: CONFIGURACIÓN DE LA INSTANCIA DE BASE DE DATOS

### 1.1 Crear Instancia EC2 para MySQL

1. Ir a **AWS Console** → **EC2** → **Launch Instance**
2. Configurar:
   - **Nombre**: `Pochito-Database`
   - **AMI**: Debian 11 o 12 (64-bit)
   - **Tipo**: `t2.micro` (capa gratuita) o `t2.small`
   - **Par de claves**: Selecciona o crea una nueva
   - **Security Group**: Crear nuevo con nombre `Pochito-DB-SG`

3. **Configurar Security Group (Reglas de Entrada)**:
   ```
   - SSH (22) → Tu IP pública
   - MySQL (3306) → IP privada de la instancia de aplicación (configurar después)
   - MySQL (3306) → Tu IP pública (solo para configuración inicial)
   ```

4. Lanzar instancia y anotar la **IP pública** y **IP privada**

### 1.2 Conectarse a la Instancia de Base de Datos

**En Windows (PowerShell):**
```powershell
# Cambiar permisos del archivo .pem (solo primera vez)
icacls "C:\ruta\a\tu-clave.pem" /inheritance:r
icacls "C:\ruta\a\tu-clave.pem" /grant:r "$($env:USERNAME):(R)"

# Conectar por SSH
ssh -i "C:\ruta\a\tu-clave.pem" admin@[IP-PUBLICA-DB]
```

**En Linux/Mac:**
```bash
chmod 400 /ruta/a/tu-clave.pem
ssh -i /ruta/a/tu-clave.pem admin@[IP-PUBLICA-DB]
```

### 1.3 Instalar y Configurar MySQL en Debian

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar MySQL Server
sudo apt install mysql-server -y

# Verificar instalación
sudo systemctl status mysql

# Iniciar MySQL si no está corriendo
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 1.4 Configurar MySQL para Acceso Remoto

```bash
# Acceder a MySQL como root
sudo mysql -u root

# Dentro de MySQL, ejecutar:
```

```sql
-- Crear usuario para acceso remoto
CREATE USER 'pochito_user'@'%' IDENTIFIED BY 'Pochito2025!Secure';

-- Crear base de datos
CREATE DATABASE pochitoweb;

-- Otorgar permisos
GRANT ALL PRIVILEGES ON pochitoweb.* TO 'pochito_user'@'%';
FLUSH PRIVILEGES;

-- Salir
EXIT;
```

```bash
# Editar configuración de MySQL para permitir conexiones remotas
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Buscar la línea:
# bind-address = 127.0.0.1
# Cambiarla por:
# bind-address = 0.0.0.0

# Guardar (Ctrl+O, Enter) y salir (Ctrl+X)

# Reiniciar MySQL
sudo systemctl restart mysql
```

### 1.5 Importar la Base de Datos

```bash
# Opción 1: Subir archivo SQL desde tu PC
# En tu PC (PowerShell/Terminal):
scp -i "C:\ruta\a\tu-clave.pem" database.sql admin@[IP-PUBLICA-DB]:/home/admin/

# Luego en la instancia EC2:
mysql -u pochito_user -p pochitoweb < /home/admin/database.sql
# (Ingresa la contraseña cuando te la pida: Pochito2025!Secure)

# Opción 2: Copiar y pegar directamente
sudo mysql -u pochito_user -p pochitoweb

# Luego copia y pega el contenido del archivo database.sql
```

### 1.6 Verificar la Base de Datos

```bash
# Conectar a MySQL
mysql -u pochito_user -p pochitoweb

# Verificar tablas
SHOW TABLES;

# Ver contenido de administradores
SELECT * FROM administradores;

# Salir
EXIT;
```

### 1.7 Anotar Datos de Conexión

```
🔐 DATOS DE CONEXIÓN A LA BASE DE DATOS:
-------------------------------------------
Host: [IP-PRIVADA-DB] (ej: 172.31.45.123)
Puerto: 3306
Usuario: pochito_user
Contraseña: Pochito2025!Secure
Base de datos: pochitoweb
-------------------------------------------
```

---

## 🌐 PARTE 2: CONFIGURACIÓN DE LA INSTANCIA DE APLICACIÓN

### 2.1 Crear Instancia EC2 para Aplicación Web

1. Ir a **AWS Console** → **EC2** → **Launch Instance**
2. Configurar:
   - **Nombre**: `Pochito-App`
   - **AMI**: Debian 11 o 12 (64-bit)
   - **Tipo**: `t2.small` (recomendado) o `t2.medium`
   - **Par de claves**: Mismo que antes o crear nuevo
   - **Security Group**: Crear nuevo con nombre `Pochito-App-SG`

3. **Configurar Security Group (Reglas de Entrada)**:
   ```
   - SSH (22) → Tu IP pública
   - HTTP (80) → 0.0.0.0/0 (Todo el mundo)
   - HTTPS (443) → 0.0.0.0/0 (Todo el mundo)
   - Custom TCP (5000) → Tu IP (para pruebas)
   ```

4. Lanzar instancia y anotar la **IP pública**

### 2.2 Actualizar Security Group de Base de Datos

1. Ir a **EC2** → **Security Groups** → Seleccionar `Pochito-DB-SG`
2. Editar **Inbound Rules**:
   - Agregar regla: `MySQL/Aurora (3306)` → Source: Security Group `Pochito-App-SG`
   - (Opcional) Eliminar la regla que permite tu IP pública si ya no necesitas acceso directo

### 2.3 Conectarse a la Instancia de Aplicación

```powershell
# PowerShell (Windows)
ssh -i "C:\ruta\a\tu-clave.pem" admin@[IP-PUBLICA-APP]
```

```bash
# Linux/Mac
ssh -i /ruta/a/tu-clave.pem admin@[IP-PUBLICA-APP]
```

### 2.4 Instalar Dependencias del Sistema

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python y herramientas esenciales
sudo apt install python3 python3-pip python3-venv git -y

# Instalar librerías de desarrollo para MySQL
sudo apt install python3-dev default-libmysqlclient-dev build-essential pkg-config -y

# Instalar Nginx (servidor web)
sudo apt install nginx -y

# Verificar instalaciones
python3 --version
pip3 --version
nginx -v
```

### 2.5 Clonar el Repositorio del Proyecto

```bash
# Ir al directorio home
cd ~

# Clonar repositorio
git clone https://github.com/anafelix21/mioo.git
cd mioo

# Verificar archivos
ls -la
```

### 2.6 Configurar Entorno Virtual de Python

```bash
# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
source venv/bin/activate

# Actualizar pip
pip install --upgrade pip

# Instalar dependencias del proyecto
pip install -r requirements.txt

# Verificar instalación
pip list
```

### 2.7 Configurar Variables de la Base de Datos

```bash
# Editar app.py para actualizar conexión a BD
nano app.py
```

Buscar estas líneas y actualizar con los datos de tu instancia de BD:

```python
# Cambiar de:
app.config["MYSQL_HOST"] = "carniceria-pochito.csmouoomzfkk.us-east-1.rds.amazonaws.com"
app.config["MYSQL_USER"] = "admin"
app.config["MYSQL_PASSWORD"] = "123456789"

# A:
app.config["MYSQL_HOST"] = "[IP-PRIVADA-DB]"  # Ejemplo: "172.31.45.123"
app.config["MYSQL_USER"] = "pochito_user"
app.config["MYSQL_PASSWORD"] = "Pochito2025!Secure"
app.config["MYSQL_DB"] = "pochitoweb"
```

Guardar cambios: `Ctrl+O`, `Enter`, `Ctrl+X`

### 2.8 Probar la Aplicación en Modo Desarrollo

```bash
# Asegurarse de que el entorno virtual esté activo
source venv/bin/activate

# Ejecutar Flask en modo desarrollo
python3 app.py
```

Deberías ver algo como:
```
 * Running on http://0.0.0.0:5000
```

Abre tu navegador y visita: `http://[IP-PUBLICA-APP]:5000`

Si funciona, presiona `Ctrl+C` para detener el servidor.

### 2.9 Configurar Gunicorn (Servidor WSGI)

```bash
# Crear archivo de servicio systemd
sudo nano /etc/systemd/system/pochito.service
```

Pegar este contenido (reemplazar `/home/admin/mioo` si tu ruta es diferente):

```ini
[Unit]
Description=Gunicorn instance to serve Pochito Web App
After=network.target

[Service]
User=admin
Group=www-data
WorkingDirectory=/home/admin/mioo
Environment="PATH=/home/admin/mioo/venv/bin"
ExecStart=/home/admin/mioo/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:5000 app:app

[Install]
WantedBy=multi-user.target
```

Guardar y salir (`Ctrl+O`, `Enter`, `Ctrl+X`)

```bash
# Iniciar y habilitar el servicio
sudo systemctl start pochito
sudo systemctl enable pochito

# Verificar estado
sudo systemctl status pochito

# Ver logs si hay problemas
sudo journalctl -u pochito -f
```

### 2.10 Configurar Nginx como Proxy Reverso

```bash
# Crear configuración de Nginx
sudo nano /etc/nginx/sites-available/pochito
```

Pegar este contenido:

```nginx
server {
    listen 80;
    server_name [IP-PUBLICA-APP];  # Reemplaza con tu IP o dominio

    # Limitar tamaño de subida (para imágenes)
    client_max_body_size 16M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    location /static {
        alias /home/admin/mioo/static;
        expires 30d;
    }

    location /favicon.ico {
        alias /home/admin/mioo/static/image/favicon.ico;
    }
}
```

Guardar y salir.

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/pochito /etc/nginx/sites-enabled/

# Eliminar configuración por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar estado
sudo systemctl status nginx
```

### 2.11 Ajustar Permisos

```bash
# Dar permisos a Nginx para acceder a archivos estáticos
sudo usermod -a -G admin www-data
sudo chmod 755 /home/admin
sudo chmod -R 755 /home/admin/mioo/static

# Crear directorio de imágenes si no existe
mkdir -p /home/admin/mioo/static/image

# Dar permisos de escritura para subida de imágenes
sudo chown -R admin:www-data /home/admin/mioo/static/image
sudo chmod -R 775 /home/admin/mioo/static/image
```

---

## ✅ PARTE 3: VERIFICACIÓN Y PRUEBAS

### 3.1 Verificar Servicios

```bash
# Estado de todos los servicios
sudo systemctl status pochito
sudo systemctl status nginx
sudo systemctl status mysql  # (en instancia de BD)
```

### 3.2 Probar la Aplicación

1. Abre tu navegador
2. Visita: `http://[IP-PUBLICA-APP]`
3. Deberías ver la página principal de Carnicería Pochito

### 3.3 Probar Login de Administrador

1. Ir a: `http://[IP-PUBLICA-APP]/login`
2. Credenciales por defecto:
   - **Email**: `admin@pochito.com`
   - **Password**: `admin123`

### 3.4 Ver Logs en Caso de Error

```bash
# Logs de aplicación (Gunicorn)
sudo journalctl -u pochito -f

# Logs de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Logs de MySQL (en instancia de BD)
sudo tail -f /var/log/mysql/error.log
```

---

## 🔧 PARTE 4: COMANDOS ÚTILES Y MANTENIMIENTO

### 4.1 Reiniciar Servicios

```bash
# Reiniciar aplicación después de cambios en código
sudo systemctl restart pochito

# Reiniciar Nginx
sudo systemctl restart nginx

# Reiniciar MySQL (en instancia de BD)
sudo systemctl restart mysql
```

### 4.2 Actualizar Código

```bash
# Ir al directorio del proyecto
cd ~/mioo

# Descargar últimos cambios
git pull origin main

# Activar entorno virtual si no está activo
source venv/bin/activate

# Instalar nuevas dependencias si las hay
pip install -r requirements.txt

# Reiniciar aplicación
sudo systemctl restart pochito
```

### 4.3 Backup de Base de Datos

```bash
# Conectarse a la instancia de BD
ssh -i tu-clave.pem admin@[IP-PUBLICA-DB]

# Crear backup
mysqldump -u pochito_user -p pochitoweb > backup_$(date +%Y%m%d_%H%M%S).sql

# Descargar backup a tu PC
# (Desde tu PC)
scp -i tu-clave.pem admin@[IP-PUBLICA-DB]:/home/admin/backup_*.sql ./
```

### 4.4 Monitorear Recursos

```bash
# Ver uso de CPU y memoria
htop  # (instalar con: sudo apt install htop)

# Ver espacio en disco
df -h

# Ver conexiones activas
sudo netstat -tuln | grep LISTEN
```

---

## 🔒 PARTE 5: SEGURIDAD (RECOMENDACIONES)

### 5.1 Configurar Firewall (UFW)

```bash
# Instalar UFW
sudo apt install ufw -y

# Configurar reglas básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Habilitar firewall
sudo ufw enable

# Ver estado
sudo ufw status
```

### 5.2 Configurar HTTPS con Let's Encrypt (SSL)

**Requisito**: Tener un dominio apuntando a tu IP pública

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# El certificado se renovará automáticamente
# Para probar la renovación:
sudo certbot renew --dry-run
```

### 5.3 Cambiar Contraseñas por Defecto

```bash
# Conectar a MySQL (en instancia de BD)
mysql -u pochito_user -p pochitoweb

# Cambiar contraseña de admin
UPDATE administradores SET password = '$2b$12$TU_NUEVO_HASH_BCRYPT' WHERE email = 'admin@pochito.com';

# Para generar un hash bcrypt desde Python:
# python3 -c "import bcrypt; print(bcrypt.hashpw(b'tu_nueva_contraseña', bcrypt.gensalt()).decode('utf-8'))"
```

---

## 📊 PARTE 6: MONITOREO Y TROUBLESHOOTING

### 6.1 Problemas Comunes

**Error: "Connection refused" al conectar a la BD**
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar Security Groups en AWS Console
# Asegurarse de que el puerto 3306 permita la IP de la instancia de app
```

**Error: "502 Bad Gateway" en Nginx**
```bash
# Verificar que Gunicorn esté corriendo
sudo systemctl status pochito

# Ver logs de Gunicorn
sudo journalctl -u pochito -n 50
```

**Error: Imágenes no se cargan**
```bash
# Verificar permisos
ls -la /home/admin/mioo/static/image

# Corregir permisos
sudo chown -R admin:www-data /home/admin/mioo/static
sudo chmod -R 755 /home/admin/mioo/static
```

### 6.2 Prueba de Conectividad entre Instancias

```bash
# Desde instancia de App, probar conexión a MySQL
mysql -h [IP-PRIVADA-DB] -u pochito_user -p

# Si funciona, la conexión está OK
```

---

## 📝 PARTE 7: INFORMACIÓN DE CONTACTO Y CREDENCIALES

### 7.1 Resumen de Credenciales

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗄️  BASE DE DATOS (MySQL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Host: [IP-PRIVADA-DB]
Puerto: 3306
Usuario: pochito_user
Contraseña: Pochito2025!Secure
Base de datos: pochitoweb

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 APLICACIÓN WEB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URL: http://[IP-PUBLICA-APP]
Directorio: /home/admin/mioo
Usuario SSH: admin
Servicio: pochito.service

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 ADMINISTRADOR (Web)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: admin@pochito.com
Password: admin123
Panel: http://[IP-PUBLICA-APP]/login

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎉 CONCLUSIÓN

¡Felicidades! Has desplegado exitosamente la aplicación **Carnicería Pochito** en AWS usando:

- ✅ **Instancia EC2 #1**: Aplicación web (Flask + Nginx + Gunicorn)
- ✅ **Instancia EC2 #2**: Base de datos MySQL
- ✅ Arquitectura de 2 capas separadas
- ✅ Conexión segura entre instancias

### Próximos Pasos Recomendados:

1. Configurar dominio personalizado
2. Implementar certificado SSL/HTTPS
3. Configurar backups automáticos
4. Implementar sistema de monitoreo (CloudWatch)
5. Configurar Auto Scaling para alta disponibilidad

---

## 📚 RECURSOS ADICIONALES

- [Documentación de AWS EC2](https://docs.aws.amazon.com/ec2/)
- [Guía de Flask](https://flask.palletsprojects.com/)
- [Documentación de Nginx](https://nginx.org/en/docs/)
- [Guía de MySQL](https://dev.mysql.com/doc/)

---

**Elaborado por**: Equipo de Desarrollo Carnicería Pochito  
**Fecha**: Diciembre 2025  
**Versión**: 1.0

---
