# 📘 MANUAL PARTE 2: CONFIGURAR INSTANCIA DE APLICACIÓN WEB
## Carnicería Pochito - Flask + Nginx en EC2 (Debian)

---

## 🎯 OBJETIVO

Configurar una instancia EC2 en AWS con la aplicación web Flask, conectarla a la base de datos y ponerla en producción.

---

## 📋 PASO 1: CREAR INSTANCIA EC2 PARA APLICACIÓN WEB

### 1.1 Lanzar Nueva Instancia

1. En AWS Console → **EC2** → **Launch Instance**
2. Configurar:

```
📝 Name and tags:
   - Name: Pochito-App

🖥️ Application and OS Images:
   - Quick Start: Debian
   - Seleccionar: Debian 11 o Debian 12 (64-bit x86)

⚙️ Instance type:
   - t2.small (Recomendado) ✅
   - t2.medium (Si tienes mucho tráfico)

🔑 Key pair:
   - Usar el mismo: pochito-key
   (O crear uno nuevo si prefieres)
```

### 1.2 Configurar Network Settings

```
🌐 Network settings:

✅ Auto-assign public IP: Enable

🔒 Firewall (Security groups):
   - Security group name: Pochito-App-SG
   - Description: Security group para aplicación web

📍 Inbound Security Group Rules:

REGLA 1: SSH
   - Type: SSH
   - Protocol: TCP
   - Port: 22
   - Source: My IP
   - Description: SSH desde mi IP

REGLA 2: HTTP
   - Type: HTTP
   - Protocol: TCP
   - Port: 80
   - Source: 0.0.0.0/0 (Anywhere IPv4)
   - Description: Acceso web público

REGLA 3: HTTPS (Opcional para SSL)
   - Type: HTTPS
   - Protocol: TCP
   - Port: 443
   - Source: 0.0.0.0/0
   - Description: Acceso HTTPS público

REGLA 4: Flask Development (Solo para pruebas)
   - Type: Custom TCP
   - Protocol: TCP
   - Port: 5000
   - Source: My IP
   - Description: Flask dev server (temporal)
```

### 1.3 Configurar Storage

```
💾 Configure storage:
   - Size: 10 GB (mínimo) o 20 GB (recomendado)
   - Volume type: gp3
```

### 1.4 Lanzar y Anotar Datos

```
📝 DATOS DE LA INSTANCIA DE APLICACIÓN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Instance ID: i-xxxxxxxxxxxxxxxxx
Public IPv4: XX.XX.XX.XX ➡️ _________________
Private IPv4: 172.31.XX.XX ➡️ _________________
Security Group: Pochito-App-SG (sg-xxxxxxxxxx) ➡️ _________________
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔐 PASO 2: ACTUALIZAR SEGURIDAD DE LA BASE DE DATOS

### 2.1 Modificar Security Group de la Base de Datos

**Ahora que tienes ambas instancias, vamos a permitir que la app se conecte a la BD:**

1. En AWS Console → **EC2** → **Security Groups**
2. Buscar y seleccionar: `Pochito-DB-SG`
3. Tab: **Inbound rules** → **Edit inbound rules**

**Agregar nueva regla:**

```
REGLA 3: MySQL desde aplicación
   - Type: MySQL/Aurora
   - Protocol: TCP
   - Port: 3306
   - Source: Custom → Buscar "Pochito-App-SG" y seleccionarlo
   - Description: MySQL desde instancia de aplicación
```

4. Click **Save rules**

**OPCIONAL**: Eliminar la regla MySQL con "My IP" si ya no necesitas acceso directo.

---

## 🔌 PASO 3: CONECTARSE A LA INSTANCIA DE APLICACIÓN

```powershell
# PowerShell (Windows)
ssh -i "C:\ruta\a\pochito-key.pem" admin@XX.XX.XX.XX
```

```bash
# Linux/Mac
ssh -i /ruta/a/pochito-key.pem admin@XX.XX.XX.XX
```

---

## 🛠️ PASO 4: INSTALAR DEPENDENCIAS DEL SISTEMA

### 4.1 Actualizar el Sistema

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y
```

### 4.2 Instalar Python y Herramientas

```bash
# Instalar Python 3 y pip
sudo apt install python3 python3-pip python3-venv -y

# Instalar herramientas de desarrollo
sudo apt install python3-dev default-libmysqlclient-dev build-essential pkg-config -y

# Instalar Git
sudo apt install git -y

# Verificar versiones
python3 --version
pip3 --version
git --version
```

### 4.3 Instalar Nginx (Servidor Web)

```bash
# Instalar Nginx
sudo apt install nginx -y

# Verificar instalación
nginx -v

# Iniciar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar estado
sudo systemctl status nginx
```

**Prueba**: Abre tu navegador y visita `http://[IP-PUBLICA-APP]`  
Deberías ver la página de bienvenida de Nginx.

---

## 📥 PASO 5: CLONAR EL PROYECTO

### 5.1 Clonar desde GitHub

```bash
# Ir al directorio home
cd ~

# Clonar el repositorio
git clone https://github.com/anafelix21/mioo.git

# Entrar al directorio
cd mioo

# Verificar archivos
ls -la
```

Deberías ver archivos como:
- `app.py`
- `admin_routes.py`
- `requirements.txt`
- `database.sql`
- `templates/`
- `static/`

---

## 🐍 PASO 6: CONFIGURAR ENTORNO VIRTUAL DE PYTHON

### 6.1 Crear y Activar Entorno Virtual

```bash
# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
source venv/bin/activate

# Tu prompt debería cambiar a:
# (venv) admin@ip-172-31-XX-XX:~/mioo$
```

### 6.2 Instalar Dependencias del Proyecto

```bash
# Actualizar pip
pip install --upgrade pip

# Instalar todas las dependencias
pip install -r requirements.txt

# Verificar que se instalaron correctamente
pip list
```

Deberías ver: Flask, Flask-MySQLdb, PyMySQL, bcrypt, gunicorn, etc.

---

## ⚙️ PASO 7: CONFIGURAR CONEXIÓN A LA BASE DE DATOS

### 7.1 Editar app.py

```bash
# Editar archivo de configuración
nano app.py
```

### 7.2 Buscar y Modificar la Configuración de MySQL

**Busca estas líneas (alrededor de la línea 27-31):**

```python
# ✅ Configuración de conexión a tu base de datos AWS RDS
app.secret_key = "clave_secreta_segura"
app.config["MYSQL_HOST"] = "carniceria-pochito.csmouoomzfkk.us-east-1.rds.amazonaws.com"
app.config["MYSQL_PORT"] = 3306
app.config["MYSQL_USER"] = "admin"  # usuario RDS
app.config["MYSQL_PASSWORD"] = "123456789"  # contraseña RDS
app.config["MYSQL_DB"] = "pochitoweb"  # nombre de la base de datos
```

**Cambiar por (usa los datos de tu instancia de BD):**

```python
# ✅ Configuración de conexión a tu base de datos EC2 MySQL
app.secret_key = "clave_secreta_segura_cambiar_en_produccion"
app.config["MYSQL_HOST"] = "172.31.XX.XX"  # ⬅️ IP PRIVADA de tu instancia de BD
app.config["MYSQL_PORT"] = 3306
app.config["MYSQL_USER"] = "pochito_user"
app.config["MYSQL_PASSWORD"] = "Pochito2025!Secure"
app.config["MYSQL_DB"] = "pochitoweb"
```

**⚠️ IMPORTANTE**: Usa la **IP PRIVADA** de la instancia de base de datos (ej: 172.31.45.123), NO la IP pública.

**Guardar y salir:**
- `Ctrl + O` (guardar)
- `Enter` (confirmar)
- `Ctrl + X` (salir)

---

## 🧪 PASO 8: PROBAR LA APLICACIÓN

### 8.1 Ejecutar Flask en Modo Desarrollo

```bash
# Asegúrate de estar en el directorio del proyecto
cd ~/mioo

# Activar entorno virtual si no está activo
source venv/bin/activate

# Ejecutar la aplicación
python3 app.py
```

Deberías ver:
```
 * Running on http://0.0.0.0:5000
 * Running on http://172.31.XX.XX:5000
```

### 8.2 Probar en el Navegador

Abre tu navegador y visita:
```
http://[IP-PUBLICA-APP]:5000
```

**Deberías ver la página principal de Carnicería Pochito.**

**Probar login de administrador:**
```
URL: http://[IP-PUBLICA-APP]:5000/login
Email: admin@pochito.com
Password: admin123
```

Si todo funciona, presiona `Ctrl + C` en la terminal para detener el servidor.

---

## 🚀 PASO 9: CONFIGURAR GUNICORN (Servidor de Producción)

### 9.1 Crear Servicio Systemd

```bash
# Crear archivo de servicio
sudo nano /etc/systemd/system/pochito.service
```

**Pegar este contenido:**

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

**Guardar:** `Ctrl + O`, `Enter`, `Ctrl + X`

### 9.2 Iniciar el Servicio

```bash
# Recargar systemd
sudo systemctl daemon-reload

# Iniciar el servicio
sudo systemctl start pochito

# Habilitar inicio automático
sudo systemctl enable pochito

# Verificar estado
sudo systemctl status pochito
```

Deberías ver: `Active: active (running)`

### 9.3 Ver Logs (Si hay problemas)

```bash
# Ver logs en tiempo real
sudo journalctl -u pochito -f

# Ver últimas 50 líneas
sudo journalctl -u pochito -n 50
```

---

## 🌐 PASO 10: CONFIGURAR NGINX COMO PROXY REVERSO

### 10.1 Crear Configuración de Nginx

```bash
# Crear archivo de configuración
sudo nano /etc/nginx/sites-available/pochito
```

**Pegar este contenido (reemplaza [IP-PUBLICA-APP] con tu IP):**

```nginx
server {
    listen 80;
    server_name [IP-PUBLICA-APP];  # ⬅️ Cambia esto por tu IP o dominio

    # Limitar tamaño de archivos subidos (para imágenes)
    client_max_body_size 16M;

    # Proxy para la aplicación Flask
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

    # Servir archivos estáticos directamente
    location /static {
        alias /home/admin/mioo/static;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Favicon
    location /favicon.ico {
        alias /home/admin/mioo/static/image/favicon.ico;
        access_log off;
    }

    # Logs
    access_log /var/log/nginx/pochito_access.log;
    error_log /var/log/nginx/pochito_error.log;
}
```

**Guardar:** `Ctrl + O`, `Enter`, `Ctrl + X`

### 10.2 Habilitar el Sitio

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/pochito /etc/nginx/sites-enabled/

# Eliminar configuración por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t
```

Deberías ver:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 10.3 Reiniciar Nginx

```bash
# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar estado
sudo systemctl status nginx
```

---

## 🎨 PASO 11: AJUSTAR PERMISOS DE ARCHIVOS

```bash
# Agregar usuario admin al grupo www-data
sudo usermod -a -G admin www-data

# Dar permisos al directorio home
sudo chmod 755 /home/admin

# Dar permisos a archivos estáticos
sudo chmod -R 755 /home/admin/mioo/static

# Crear directorio de imágenes si no existe
mkdir -p /home/admin/mioo/static/image

# Dar permisos de escritura para subir imágenes
sudo chown -R admin:www-data /home/admin/mioo/static/image
sudo chmod -R 775 /home/admin/mioo/static/image
```

---

## ✅ PASO 12: VERIFICACIÓN FINAL

### 12.1 Verificar Servicios

```bash
# Verificar Gunicorn
sudo systemctl status pochito

# Verificar Nginx
sudo systemctl status nginx
```

### 12.2 Probar la Aplicación

**Abre tu navegador y visita:**

```
http://[IP-PUBLICA-APP]
```

**Deberías ver la página principal funcionando.**

**Probar diferentes páginas:**
- Página principal: `http://[IP-PUBLICA-APP]/`
- Login: `http://[IP-PUBLICA-APP]/login`
- Productos: `http://[IP-PUBLICA-APP]/productos`
- Admin (después de login): `http://[IP-PUBLICA-APP]/admin/dashboard`

**Credenciales de administrador:**
```
Email: admin@pochito.com
Password: admin123
```

---

## 🔧 PASO 13: COMANDOS ÚTILES PARA MANTENIMIENTO

### Reiniciar Servicios

```bash
# Reiniciar aplicación después de cambios en código
sudo systemctl restart pochito

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs de la aplicación
sudo journalctl -u pochito -f

# Ver logs de Nginx
sudo tail -f /var/log/nginx/pochito_error.log
sudo tail -f /var/log/nginx/pochito_access.log
```

### Actualizar Código desde GitHub

```bash
# Ir al directorio del proyecto
cd ~/mioo

# Descargar últimos cambios
git pull origin main

# Activar entorno virtual
source venv/bin/activate

# Instalar nuevas dependencias (si las hay)
pip install -r requirements.txt

# Reiniciar aplicación
sudo systemctl restart pochito
```

### Backup y Mantenimiento

```bash
# Crear backup del código
tar -czf pochito_backup_$(date +%Y%m%d).tar.gz ~/mioo

# Ver uso de disco
df -h

# Ver uso de memoria
free -h

# Monitorear recursos
htop  # (instalar con: sudo apt install htop)
```

---

## 📊 RESUMEN DE PUERTOS Y SERVICIOS

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 PUERTOS CONFIGURADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTANCIA DE BASE DE DATOS:
  ├─ Puerto 22 (SSH): Desde tu IP
  └─ Puerto 3306 (MySQL): Desde Pochito-App-SG

INSTANCIA DE APLICACIÓN:
  ├─ Puerto 22 (SSH): Desde tu IP
  ├─ Puerto 80 (HTTP): Desde 0.0.0.0/0 (público)
  ├─ Puerto 443 (HTTPS): Desde 0.0.0.0/0 (público)
  └─ Puerto 5000 (Flask): Solo interno (127.0.0.1)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎉 ¡DESPLIEGUE COMPLETADO!

### ✅ CHECKLIST FINAL

- [x] Instancia de Base de Datos configurada y corriendo
- [x] MySQL instalado y base de datos importada
- [x] Instancia de Aplicación creada y configurada
- [x] Security Groups configurados correctamente
- [x] Python y dependencias instaladas
- [x] Código clonado desde GitHub
- [x] Conexión a base de datos configurada
- [x] Gunicorn corriendo como servicio
- [x] Nginx configurado como proxy reverso
- [x] Aplicación accesible desde navegador
- [x] Login de administrador funcional

### 📍 DATOS FINALES

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 ACCESO A LA APLICACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URL Principal: http://[TU-IP-PUBLICA]
Panel Admin: http://[TU-IP-PUBLICA]/login

👤 Credenciales Admin:
   Email: admin@pochito.com
   Password: admin123

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗄️ BASE DE DATOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Host: [IP-PRIVADA-DB]
Puerto: 3306
Usuario: pochito_user
Password: Pochito2025!Secure
Base de datos: pochitoweb

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "Connection refused" al conectar a MySQL

```bash
# Verificar que MySQL está corriendo en la instancia de BD
ssh -i pochito-key.pem admin@[IP-BD]
sudo systemctl status mysql

# Verificar Security Groups en AWS Console
# Asegurarse de que el puerto 3306 permita conexiones desde Pochito-App-SG
```

### Error: "502 Bad Gateway" en el navegador

```bash
# Verificar que Gunicorn está corriendo
sudo systemctl status pochito

# Ver logs de Gunicorn
sudo journalctl -u pochito -n 50

# Reiniciar servicio
sudo systemctl restart pochito
```

### Error: Imágenes no se cargan

```bash
# Verificar permisos
ls -la /home/admin/mioo/static/image

# Corregir permisos
sudo chown -R admin:www-data /home/admin/mioo/static
sudo chmod -R 755 /home/admin/mioo/static
```

### Error: "Module not found" al iniciar la aplicación

```bash
# Activar entorno virtual
cd ~/mioo
source venv/bin/activate

# Reinstalar dependencias
pip install -r requirements.txt

# Reiniciar aplicación
sudo systemctl restart pochito
```

### Probar conectividad entre instancias

```bash
# Desde la instancia de aplicación
mysql -h [IP-PRIVADA-BD] -u pochito_user -p pochitoweb

# Si funciona, la conexión está OK
```

---

## 🔒 PRÓXIMOS PASOS (OPCIONAL)

### 1. Configurar Dominio Personalizado

- Comprar dominio en Namecheap, GoDaddy, etc.
- Crear registro A apuntando a tu IP pública
- Actualizar `server_name` en Nginx

### 2. Configurar HTTPS con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d tudominio.com

# Renovación automática ya está configurada
```

### 3. Configurar Backups Automáticos

- Usar AWS Snapshots para las instancias EC2
- Configurar mysqldump con cron para la base de datos

### 4. Configurar Monitoreo

- AWS CloudWatch para métricas de instancias
- Configurar alarmas para CPU, memoria y disco

---

**Elaborado por**: Equipo de Desarrollo Carnicería Pochito  
**Fecha**: Diciembre 2025  
**Versión**: 2.0
