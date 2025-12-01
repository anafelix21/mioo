"""
============================================
APLICACIÓN PRINCIPAL - CARNICERÍA POCHITO
Rutas de frontend, autenticación y APIs
============================================
"""

import pymysql
from flask import (Flask, Response, redirect, render_template, request,
                   session, url_for)
import os
from werkzeug.utils import secure_filename

# En Windows es frecuente que instalar "mysqlclient" falle.
# Usamos PyMySQL como reemplazo compatible registrándolo como MySQLdb,
# de modo que `flask_mysqldb` pueda funcionar sin wheels compilados.
pymysql.install_as_MySQLdb()

from datetime import date
from functools import wraps

import bcrypt
from flask_mysqldb import MySQL

app = Flask(__name__)

# ✅ Configuración de conexión a tu base de datos AWS RDS
app.secret_key = "clave_secreta_segura"
app.config["MYSQL_HOST"] = "carniceria-pochito.csmouoomzfkk.us-east-1.rds.amazonaws.com"
app.config["MYSQL_PORT"] = 3306
app.config["MYSQL_USER"] = "admin"  # usuario RDS
app.config["MYSQL_PASSWORD"] = "123456789"  # contraseña RDS
app.config["MYSQL_DB"] = "pochitoweb"  # nombre de la base de datos

# ✅ Configuración para subida de imágenes
UPLOAD_FOLDER = 'static/image'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'ico', 'heic', 'heif'}

# Crear directorio si no existe
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Inicializar conexión
mysql = MySQL(app)


# ============================================
# DECORADORES Y FUNCIONES AUXILIARES
# ============================================

# 🔒 Decorador para rutas protegidas (requiere login)
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)

    return decorated_function


# ============================================
# RUTAS PÚBLICAS
# ============================================

# 🏠 Página principal
@app.route("/")
def index():
    return render_template("index.html")


# ============================================
# AUTENTICACIÓN Y LOGIN
# ============================================

# 🔐 Iniciar sesión (Admin y Usuario)
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")

        cur = mysql.connection.cursor()

        # 🔍 PASO 1: Verificar si es administrador
        cur.execute("SELECT * FROM administradores WHERE email=%s", (email,))
        admin = cur.fetchone()

        # 🔍 PASO 2: Verificar si es cliente (usuario regular)
        cur.execute("SELECT * FROM usuarios WHERE email=%s", (email,))
        user = cur.fetchone()

        # ✅ Si es administrador
        if admin:
            admin_hash = admin[4]
            password_matches = False
            need_hash_update = False
            
            try:
                # Convertir a bytes si es string
                if isinstance(admin_hash, str):
                    admin_hash_bytes = admin_hash.encode("utf-8")
                else:
                    admin_hash_bytes = admin_hash
                
                # Intentar verificar con bcrypt
                if admin_hash_bytes.startswith(b'$2'):
                    if bcrypt.checkpw(password.encode("utf-8"), admin_hash_bytes):
                        password_matches = True
                else:
                    # Si no es bcrypt, comparar como texto plano
                    if admin_hash == password:
                        password_matches = True
                        need_hash_update = True
            except ValueError:
                # Si bcrypt falla, intentar como texto plano
                if admin_hash == password:
                    password_matches = True
                    need_hash_update = True
            
            if password_matches:
                # Actualizar contraseña a bcrypt si estaba en texto plano
                if need_hash_update:
                    new_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                    cur.execute("UPDATE administradores SET password=%s WHERE id=%s", (new_hash, admin[0]))
                    mysql.connection.commit()
                    print(f"🔄 Contraseña de admin actualizada a bcrypt: {email}")
                
                session["admin_id"] = admin[0]
                session["admin_name"] = admin[1]
                session["is_admin"] = True
                print(f"✅ ADMIN LOGIN: {email}")
                cur.close()
                return redirect(url_for("admin_dashboard"))

        # ✅ Si es cliente
        if user:
            user_hash = user[4]
            password_matches = False
            need_hash_update = False
            
            try:
                # Convertir a bytes si es string
                if isinstance(user_hash, str):
                    user_hash_bytes = user_hash.encode("utf-8")
                else:
                    user_hash_bytes = user_hash
                
                # Intentar verificar con bcrypt
                if user_hash_bytes.startswith(b'$2'):
                    if bcrypt.checkpw(password.encode("utf-8"), user_hash_bytes):
                        password_matches = True
                else:
                    # Si no es bcrypt, comparar como texto plano
                    if user_hash == password:
                        password_matches = True
                        need_hash_update = True
            except ValueError:
                # Si bcrypt falla, intentar como texto plano
                if user_hash == password:
                    password_matches = True
                    need_hash_update = True
            
            if password_matches:
                # Actualizar contraseña a bcrypt si estaba en texto plano
                if need_hash_update:
                    new_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                    cur.execute("UPDATE usuarios SET password=%s WHERE id=%s", (new_hash, user[0]))
                    mysql.connection.commit()
                    print(f"🔄 Contraseña de usuario actualizada a bcrypt: {email}")
                
                # Limpiar sesión anterior para evitar contaminación
                session.clear()
                session["user_id"] = user[0]
                session["is_authenticated"] = True
                print(f"✅ USER LOGIN: {email}")
                cur.close()
                return redirect(url_for("carrito"))

        cur.close()

        # ❌ Credenciales incorrectas
        return render_template(
            "login.html", error="❌ Correo o contraseña incorrectos"
        )

    return render_template("login.html")


# 🧾 Registro de nuevo usuario
@app.route("/register", methods=["POST"])
def register():
    nombre = request.form.get("nombre")
    apellido = request.form.get("apellido")
    email = request.form.get("email")
    password = request.form.get("password")
    fecha_nacimiento = request.form.get("fecha_nacimiento")
    dni = request.form.get("dni")
    direccion = request.form.get("direccion")

    if not (nombre and apellido and email and password):
        return "⚠️ Todos los campos obligatorios deben ser llenados."

    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode(
        "utf-8"
    )

    cur = mysql.connection.cursor()
    cur.execute(
        """
        INSERT INTO usuarios (nombre, apellido, email, password, fecha_nacimiento, dni, direccion)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """,
        (nombre, apellido, email, hashed_password, fecha_nacimiento, dni, direccion),
    )
    mysql.connection.commit()
    user_id = cur.lastrowid
    cur.close()

    # Limpiar sesión anterior para evitar contaminación
    session.clear()
    session["user_id"] = user_id
    session["is_authenticated"] = True
    return redirect(url_for("carrito"))


# ============================================
# RUTAS DE PRODUCTOS
# ============================================

# 🥩 Productos por categoría
@app.route("/productos")
def productos():
    # Usar template dinámico que carga desde API
    return render_template("productos_dinamico.html")


@app.route("/productos_res")
def productos_res():
    return render_template("productos_res.html")


@app.route("/productos_cerdo")
def productos_cerdo():
    return render_template("productos_cerdo.html")


@app.route("/productos_pollo")
def productos_pollo():
    return render_template("productos_pollo.html")


# ============================================
# RUTAS DE CARRITO Y PAGOS (Protegidas)
# ============================================

# 🛒 Carrito de compras
@app.route("/carrito")
@login_required
def carrito():
    return render_template("carrito.html")


# 💳 Procesamiento de pagos
@app.route("/pagos")
@login_required
def pagos():
    return render_template("pagos.html")


# ============================================
# OTRAS PÁGINAS
# ============================================

# ℹ️ Página informativa
@app.route("/nosotros")
def nosotros():
    return render_template("nosotros.html")


# 🔪 Categorías de productos
@app.route("/cuchillos")
def cuchillos():
    return render_template("cuchillos.html")


@app.route("/parrillas")
def parrillas():
    return render_template("parrillas.html")


@app.route("/limpieza")
def limpieza():
    return render_template("limpieza.html")


@app.route("/encendido")
def encendido():
    return render_template("encendido.html")


@app.route("/adicionales")
def adicionales():
    return render_template("adicionales.html")


# 📚 Libro de Recomendaciones y Reclamos
@app.route("/libros", methods=["GET", "POST"])
@login_required
def libros():
    cur = mysql.connection.cursor()
    user_id = session.get("user_id")

    if request.method == "POST":
        mensaje = request.form.get("mensaje")
        tipo = request.form.get("tipo")  # 'recomendacion' o 'reclamo'

        # Depuración
        print("🔹 Tipo:", tipo)
        print("🔹 Mensaje:", mensaje)
        print("🔹 Usuario ID:", user_id)

        if mensaje and user_id:
            if tipo == "recomendacion":
                cur.execute(
                    "INSERT INTO recomendaciones (usuario_id, mensaje) VALUES (%s, %s)",
                    (user_id, mensaje),
                )
            elif tipo == "reclamo":
                # En algunos despliegues la tabla `reclamos` no tiene columna 'titulo'.
                # Insertamos sólo los campos presentes: usuario_id, tipo y mensaje.
                cur.execute(
                    "INSERT INTO reclamos (usuario_id, tipo, mensaje) VALUES (%s, %s, %s)",
                    (user_id, "reclamo", mensaje),
                )
            mysql.connection.commit()
            print("✅ Datos guardados con éxito")

    # Obtener todas las recomendaciones
    cur.execute(
        """
        SELECT u.nombre, u.apellido, r.mensaje, r.fecha
        FROM recomendaciones r
        JOIN usuarios u ON r.usuario_id = u.id
        WHERE r.usuario_id = %s
        ORDER BY r.fecha DESC
    """,
        (user_id,),
    )
    recomendaciones = cur.fetchall()

    # Obtener todos los reclamos
    cur.execute(
        """
        SELECT u.nombre, u.apellido, r.mensaje, r.fecha
        FROM reclamos r
        JOIN usuarios u ON r.usuario_id = u.id
        WHERE r.usuario_id = %s
        ORDER BY r.fecha DESC
    """,
        (user_id,),
    )
    reclamos = cur.fetchall()

    cur.close()
    return render_template(
        "libros.html", recomendaciones=recomendaciones, reclamos=reclamos
    )


# 🧍‍♂️ Perfil de usuario
@app.route("/perfil")
@login_required
def perfil():
    user_id = session.get("user_id")
    cur = mysql.connection.cursor()
    cur.execute(
        "SELECT id, nombre, apellido, email, fecha_nacimiento, dni, direccion FROM usuarios WHERE id = %s",
        (user_id,),
    )
    user = cur.fetchone()
    cur.close()

    if not user:
        return "⚠️ Usuario no encontrado"

    # Convertir a diccionario
    user_data = {
        "id": user[0],
        "nombre": user[1],
        "apellido": user[2],
        "email": user[3],
        "correo": user[3],
        "fecha_nacimiento": user[4],
        "dni": user[5],
        "direccion": user[6],
    }

    # Obtener pedidos del usuario
    cur = mysql.connection.cursor()
    cur.execute(
        "SELECT id, subtotal, igv, envio, total, direccion, tipo_entrega, metodo_pago, fecha FROM pedidos WHERE usuario_id = %s ORDER BY fecha DESC",
        (user_id,),
    )
    pedidos_raw = cur.fetchall()

    pedidos = []
    for p in pedidos_raw:
        pedido_id = p[0]
        pedido = {
            "id": pedido_id,
            "subtotal": float(p[1] or 0),
            "igv": float(p[2] or 0),
            "envio": float(p[3] or 0),
            "total": float(p[4] or 0),
            "direccion": p[5],
            "tipo_entrega": p[6],
            "metodo_pago": p[7],
            "fecha": p[8],
            "items_list": [],
        }

        # Obtener items del pedido
        cur.execute(
            "SELECT producto_id, nombre, precio, cantidad, subtotal FROM pedido_items WHERE pedido_id = %s",
            (pedido_id,),
        )
        items = cur.fetchall()
        pedido["items_list"] = [
            {
                "producto_id": it[0],
                "nombre": it[1],
                "precio": float(it[2] or 0),
                "cantidad": int(it[3] or 0),
                "subtotal": float(it[4] or 0),
            }
            for it in items
        ]
        pedidos.append(pedido)

    # Cerrar cursor usado
    cur.close()

    return render_template("perfil.html", user=user_data, pedidos=pedidos)


# 🚪 Cerrar sesión
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))


# 🧪 Ruta de prueba de conexión (opcional)
@app.route("/test_db")
def test_db():
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT DATABASE();")
        db_name = cur.fetchone()
        return f"✅ Conectado a la base de datos: {db_name[0]}"
    except Exception as e:
        return f"❌ Error al conectar: {e}"


# Ruta dinámica para sitemap.xml (genera URLs públicas usando el host actual)
@app.route("/sitemap.xml", methods=["GET"])
def sitemap():
    # Lista de endpoints públicos que queremos indexar
    public_endpoints = [
        "index",
        "productos",
        "productos_res",
        "productos_cerdo",
        "productos_pollo",
        "nosotros",
        "cuchillos",
        "parrillas",
        "limpieza",
        "encendido",
        "adicionales",
    ]

    today = date.today().isoformat()
    xml_parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]

    for ep in public_endpoints:
        try:
            loc = url_for(ep, _external=True)
        except Exception:
            # si el endpoint no existe en este momento, lo saltamos
            continue
        xml_parts.append("  <url>")
        xml_parts.append(f"    <loc>{loc}</loc>")
        xml_parts.append(f"    <lastmod>{today}</lastmod>")
        xml_parts.append("  </url>")

    xml_parts.append("</urlset>")
    xml_response = "\n".join(xml_parts)
    return Response(xml_response, mimetype="application/xml")


# ============================================
# APIS Y ENDPOINTS DE DATOS
# ============================================

# 💳 Confirmación y procesamiento de pedidos
@app.route("/confirmar_pedido", methods=["POST"])
@login_required
def confirmar_pedido():
    """Guardar pedido en la base de datos"""
    user_id = session.get("user_id")
    data = request.get_json()
    if not data:
        return {"error": "No data provided"}, 400

    # Campos esperados: items (lista), subtotal, igv, total, tipo_entrega, direccion, metodo_pago, envio
    items = data.get("items", [])
    try:
        subtotal = float(data.get("subtotal", 0))
        # El IGV ya no se aplica: forzar a 0 en servidor para evitar manipulaciones clientes
        igv = 0.0
        total = float(data.get("total", subtotal))
        tipo_entrega = data.get("tipo_entrega", "delivery")
        direccion = data.get("direccion", "")
        metodo_pago = data.get("metodo_pago", "")
        envio = float(data.get("envio", 0))
    except Exception as e:
        return {"error": f"Invalid numeric value: {e}"}, 400

    try:
        cur = mysql.connection.cursor()

        # Insertar pedido
        cur.execute(
            """
            INSERT INTO pedidos (usuario_id, subtotal, igv, envio, total, direccion, tipo_entrega, metodo_pago)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
            (
                user_id,
                subtotal,
                igv,
                envio,
                total,
                direccion,
                tipo_entrega,
                metodo_pago,
            ),
        )
        mysql.connection.commit()
        pedido_id = cur.lastrowid

        # Insertar items del pedido
        for it in items:
            producto_id = str(it.get("id", ""))
            nombre = it.get("nombre", "")
            precio = float(it.get("precio", 0))
            cantidad = int(it.get("cantidad", 0))
            item_subtotal = float(precio * cantidad)
            cur.execute(
                """
                INSERT INTO pedido_items (pedido_id, producto_id, nombre, precio, cantidad, subtotal)
                VALUES (%s, %s, %s, %s, %s, %s)
            """,
                (pedido_id, producto_id, nombre, precio, cantidad, item_subtotal),
            )

        mysql.connection.commit()
        cur.close()

        return {"success": True, "pedido_id": pedido_id}, 201

    except Exception as e:
        try:
            cur.close()
        except:
            pass
        return {"error": str(e)}, 500


# 👨‍💻 PANEL ADMIN - Autenticación
@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    # Si viene un usuario normal intentando acceder aquí, limpiamos su sesión
    if session.get("user_id"):
        session.clear()
        return redirect(url_for("login"))
    
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")

        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM administradores WHERE email=%s", (email,))
        admin = cur.fetchone()
        cur.close()

        # Verificar contraseña
        if admin and bcrypt.checkpw(
            password.encode("utf-8"), admin[4].encode("utf-8")
        ):  # índice 4 = columna password
            # Limpiar sesión anterior para evitar contaminación
            session.clear()
            session["admin_id"] = admin[0]
            session["admin_name"] = admin[1]
            session["is_admin"] = True
            return redirect(url_for("admin_dashboard"))
        else:
            return render_template(
                "admin_login.html", error="❌ Correo o contraseña incorrectos"
            )

    return render_template("admin_login.html")


# 🔒 Decorador para proteger rutas admin - STRICTO
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # CONDICIONES ESTRICTAS: AMBAS deben ser verdaderas
        # 1. admin_id debe existir Y tener valor
        # 2. is_admin debe ser explícitamente True
        # 3. NO debe haber user_id (usuario normal)
        
        admin_id = session.get("admin_id")
        is_admin = session.get("is_admin")
        user_id = session.get("user_id")
        
        # Si hay user_id, es un usuario normal - NO PERMITIR
        if user_id:
            session.clear()  # Limpiar sesión contaminada
            return redirect(url_for("login"))
        
        # Si no hay admin_id o no está autenticado como admin - NO PERMITIR
        if not admin_id or is_admin is not True:
            return redirect(url_for("admin_login"))
        
        return f(*args, **kwargs)

    return decorated_function


# 🔐 Verificación de sesión (protección contra contaminación)


#  Subir imagen de producto
@app.route("/api/upload-imagen", methods=["POST"])
def upload_imagen():
    """
    Endpoint para subir imágenes desde el CRUD Java o desde la web.
    Soporta cualquier formato de imagen listado en ALLOWED_EXTENSIONS.
    
    Parámetros:
    - file: archivo de imagen (multipart/form-data)
    - nombre: nombre personalizado (opcional)
    - producto_id: ID del producto (opcional, para vincular)
    
    Retorna:
    {
        "success": bool,
        "filename": str,
        "url": str,
        "message": str
    }
    """
    try:
        # Validar que haya archivo
        if 'file' not in request.files:
            return {"success": False, "error": "No file provided"}, 400
        
        file = request.files['file']
        
        if file.filename == '':
            return {"success": False, "error": "No file selected"}, 400
        
        # Obtener nombre personalizado o usar el nombre original
        custom_name = request.form.get('nombre', file.filename)
        filename = secure_filename(custom_name) if custom_name else secure_filename(file.filename)
        
        # Si el nombre es muy corto o vacío, usar el original
        if not filename or len(filename) < 1:
            filename = secure_filename(file.filename)
        
        # Validar extensión (acepta cualquier formato de imagen)
        if not allowed_file(filename):
            # Si no tiene extensión o no es reconocida, intentar obtenerla del archivo
            if '.' not in filename:
                # Intentar obtener extensión del archivo original
                original_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'jpg'
                filename = f"{filename}.{original_ext}"
            
            # Revalidar
            if not allowed_file(filename):
                return {"success": False, "error": f"File type not allowed. Supported: {', '.join(ALLOWED_EXTENSIONS)}"}, 400
        
        # Guardar archivo
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        print(f"[UPLOAD] ✅ Imagen guardada: {filepath}")
        
        return {
            "success": True,
            "message": "Imagen subida correctamente",
            "filename": filename,
            "url": f"/static/image/{filename}"
        }, 200
    
    except Exception as e:
        print(f"[UPLOAD] ❌ Error al subir imagen: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}, 500


@app.route("/api/imagenes-disponibles", methods=["GET"])
def get_imagenes_disponibles():
    """
    Endpoint que retorna todas las imágenes disponibles en el servidor.
    Útil para sincronizar el CRUD Java con las imágenes almacenadas.
    
    Retorna:
    {
        "success": bool,
        "imagenes": [
            {
                "nombre": str,
                "url": str,
                "tamaño": int (bytes),
                "fecha": str
            }
        ],
        "total": int
    }
    """
    try:
        imagenes = []
        
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            print(f"[IMAGENES] ⚠️ Directorio no existe: {app.config['UPLOAD_FOLDER']}")
            return {
                "success": True,
                "imagenes": [],
                "total": 0
            }, 200
        
        # Listar todas las imágenes
        archivos = os.listdir(app.config['UPLOAD_FOLDER'])
        print(f"[IMAGENES] 📁 Total de archivos en directorio: {len(archivos)}")
        
        for filename in archivos:
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            # Solo archivos, no directorios
            if os.path.isfile(filepath):
                # Validar que sea una imagen permitida
                if allowed_file(filename):
                    size = os.path.getsize(filepath)
                    mtime = os.path.getmtime(filepath)
                    from datetime import datetime
                    fecha = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")
                    
                    imagenes.append({
                        "nombre": filename,
                        "url": f"/static/image/{filename}",
                        "tamaño": size,
                        "fecha": fecha
                    })
                    print(f"[IMAGENES] ✅ Imagen encontrada: {filename} ({size} bytes)")
        
        # Ordenar por fecha descendente
        imagenes.sort(key=lambda x: x["fecha"], reverse=True)
        
        print(f"[IMAGENES] 📊 Total de imágenes válidas: {len(imagenes)}")
        
        return {
            "success": True,
            "imagenes": imagenes,
            "total": len(imagenes)
        }, 200
    
    except Exception as e:
        print(f"[IMAGENES] ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}, 500


# 📤 Endpoint alternativo para subir imagen (compatible con CRUD Java)
@app.route("/api/upload", methods=["POST"])
def upload_archivo():
    """
    Endpoint para subir imágenes desde el CRUD Java.
    Soporta cualquier tipo de imagen.
    
    Parámetros esperados (multipart/form-data):
    - file: archivo de imagen
    - nombre: nombre del producto (opcional)
    
    Retorna:
    {
        "success": bool,
        "filename": str,
        "url": str,
        "message": str
    }
    """
    try:
        print(f"\n{'='*70}")
        print(f"[UPLOAD] 📥 Solicitud de subida recibida")
        print(f"{'='*70}")
        
        # Verificar que hay archivo
        if 'file' not in request.files:
            print(f"[UPLOAD] ❌ No file provided")
            return {"success": False, "error": "No file provided"}, 400
        
        file = request.files['file']
        
        if file.filename == '':
            print(f"[UPLOAD] ❌ No file selected")
            return {"success": False, "error": "No file selected"}, 400
        
        print(f"[UPLOAD] 📄 Archivo original: {file.filename}")
        
        # Obtener nombre personalizado del formulario (si viene del CRUD)
        nombre_producto = request.form.get('nombre', '').strip()
        print(f"[UPLOAD] 🏷️  Nombre del producto: {nombre_producto if nombre_producto else '(sin especificar)'}")
        
        # Procesar nombre del archivo
        filename = secure_filename(file.filename)
        
        # Si no tiene extensión, intentar obtenerla del archivo original
        if '.' not in filename:
            original_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'jpg'
            filename = f"{filename}.{original_ext}"
            print(f"[UPLOAD] 🔧 Se agregó extensión: {filename}")
        
        # Validar extensión
        if not allowed_file(filename):
            ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'unknown'
            print(f"[UPLOAD] ❌ Tipo de archivo no permitido: {ext}")
            return {
                "success": False, 
                "error": f"Tipo de archivo no permitido: {ext}. Soportados: {', '.join(ALLOWED_EXTENSIONS)}"
            }, 400
        
        # Crear directorio si no existe
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
            print(f"[UPLOAD] 📁 Directorio creado: {app.config['UPLOAD_FOLDER']}")
        
        # Guardar archivo
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Verificar que se guardó correctamente
        if os.path.exists(filepath):
            file_size = os.path.getsize(filepath)
            print(f"[UPLOAD] ✅ Imagen guardada exitosamente")
            print(f"[UPLOAD] 📍 Ubicación: {filepath}")
            print(f"[UPLOAD] 📊 Tamaño: {file_size} bytes")
            print(f"[UPLOAD] 🌐 URL web: /static/image/{filename}")
            print(f"{'='*70}\n")
            
            return {
                "success": True,
                "filename": filename,
                "url": f"/static/image/{filename}",
                "message": f"Imagen '{filename}' subida correctamente"
            }, 200
        else:
            print(f"[UPLOAD] ❌ Error: Archivo no se guardó")
            return {"success": False, "error": "No se pudo guardar el archivo"}, 500
    
    except Exception as e:
        print(f"[UPLOAD] ❌ Error general: {e}")
        import traceback
        traceback.print_exc()
        print(f"{'='*70}\n")
        return {"success": False, "error": str(e)}, 500


#  Obtener todos los productos
# 🛍️ API para obtener productos
@app.route("/api/productos", methods=["GET"])
def get_productos():
    """Obtener todos los productos de la base de datos"""
    try:
        cur = mysql.connection.cursor()
        # Obtener TODOS los productos (incluso sin categorías)
        cur.execute(
            """
            SELECT id, nombre, descripcion, precio, tiene_oferta, imagen, stock, categoria_id
            FROM productos 
            ORDER BY id DESC
        """
        )
        productos = cur.fetchall()
        cur.close()

        productos_list = []
        for p in productos:
            # Intentar obtener categorías (puede fallar si la tabla no existe)
            categorias_list = []
            try:
                cur = mysql.connection.cursor()
                
                # 1️⃣ PRIMERO: Buscar en producto_categorias (tabla de relación - método Flask)
                cur.execute(
                    """
                    SELECT c.id, c.nombre
                    FROM categorias c
                    INNER JOIN producto_categorias pc ON c.id = pc.categoria_id
                    WHERE pc.producto_id = %s
                    ORDER BY c.nombre ASC
                """,
                    (p[0],),
                )
                categorias = cur.fetchall()
                categorias_list = [{"id": c[0], "nombre": c[1]} for c in categorias]
                
                # 2️⃣ SI NO ENCONTRÓ EN producto_categorias, BUSCAR en categoria_id de productos
                # (esto es para compatibilidad con productos guardados desde Java CRUD)
                if not categorias_list and p[7] is not None:  # p[7] es categoria_id
                    cur.execute(
                        """
                        SELECT id, nombre
                        FROM categorias
                        WHERE id = %s
                    """,
                        (p[7],),
                    )
                    categoria = cur.fetchone()
                    if categoria:
                        categorias_list = [{"id": categoria[0], "nombre": categoria[1]}]
                
                cur.close()
            except Exception as e:
                # Si falla, simplemente devolvemos lista vacía de categorías
                print(f"[WARN] No se pueden obtener categorías para producto {p[0]}: {e}")
                categorias_list = []

            productos_list.append(
                {
                    "id": p[0],
                    "nombre": p[1],
                    "descripcion": p[2],
                    "precio": float(p[3]),
                    "tiene_oferta": bool(p[4]),
                    "imagen": p[5],
                    "stock": p[6],
                    "categorias": categorias_list,
                }
            )

        print(f"[DEBUG] GET /api/productos: {len(productos_list)} productos totales")
        return {"success": True, "productos": productos_list}, 200

    except Exception as e:
        print(f"[ERROR] Error al obtener productos: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}, 500


@app.route("/api/productos/<int:producto_id>", methods=["GET"])
def get_producto(producto_id):
    """Obtener detalles de un producto específico"""
    try:
        cur = mysql.connection.cursor()
        cur.execute(
            """
            SELECT id, nombre, descripcion, precio, tiene_oferta, imagen, stock
            FROM productos 
            WHERE id = %s
        """,
            (producto_id,),
        )
        p = cur.fetchone()

        if not p:
            cur.close()
            return {"success": False, "error": "Producto no encontrado"}, 404

        # Intentar obtener categorías (puede fallar si la tabla no existe)
        categorias_list = []
        try:
            cur.execute(
                """
                SELECT c.id, c.nombre
                FROM categorias c
                INNER JOIN producto_categorias pc ON c.id = pc.categoria_id
                WHERE pc.producto_id = %s
                ORDER BY c.nombre ASC
            """,
                (producto_id,),
            )
            categorias = cur.fetchall()
            categorias_list = [{"id": c[0], "nombre": c[1]} for c in categorias]
        except Exception as e:
            print(f"Nota: No se pueden obtener categorías: {e}")
            categorias_list = []
        
        cur.close()

        return {
            "success": True,
            "id": p[0],
            "nombre": p[1],
            "descripcion": p[2],
            "precio": float(p[3]),
            "tiene_oferta": bool(p[4]),
            "imagen": p[5],
            "stock": p[6],
            "categorias": categorias_list,
        }, 200

    except Exception as e:
        print(f"Error al obtener producto: {e}")
        return {"success": False, "error": str(e)}, 500


# 📦 Obtener productos por categoría (con nombre de categoría)
@app.route("/api/productos/categoria/<int:categoria_id>", methods=["GET"])
def get_productos_por_categoria(categoria_id):
    """
    Obtiene productos de una categoría específica.
    
    Soporta AMBOS sistemas:
    1. Nueva junction table (producto_categorias) - para productos desde Flask admin
    2. Directa en categoria_id - para productos desde CRUD Java
    
    La query combina ambos para máxima compatibilidad.
    """
    try:
        cur = mysql.connection.cursor()
        
        # Query MEJORADA: Obtener productos usando ambos métodos
        # Primero intenta buscar en producto_categorias (método Flask)
        # Luego busca en categoria_id (método CRUD Java)
        # DISTINCT evita duplicados si el producto está en ambos lugares
        cur.execute(
            """
            SELECT DISTINCT 
                p.id, p.nombre, p.descripcion, p.precio, 
                p.tiene_oferta, p.imagen, p.stock, 
                COALESCE(
                    (SELECT GROUP_CONCAT(c.id) FROM producto_categorias pc 
                     INNER JOIN categorias c ON pc.categoria_id = c.id 
                     WHERE pc.producto_id = p.id),
                    p.categoria_id
                ) AS categorias_asignadas
            FROM productos p
            WHERE 
                -- Método 1: Buscar en producto_categorias (relación many-to-many)
                (p.id IN (
                    SELECT DISTINCT producto_id 
                    FROM producto_categorias 
                    WHERE categoria_id = %s
                ))
                OR
                -- Método 2: Buscar en categoria_id directo (campo en productos)
                (p.categoria_id = %s AND p.categoria_id IS NOT NULL)
            ORDER BY p.nombre ASC
        """,
            (categoria_id, categoria_id),
        )
        productos = cur.fetchall()
        cur.close()

        productos_list = []
        for p in productos:
            productos_list.append(
                {
                    "id": p[0],
                    "nombre": p[1],
                    "descripcion": p[2],
                    "precio": float(p[3]),
                    "tiene_oferta": bool(p[4]),
                    "imagen": p[5],
                    "stock": p[6],
                }
            )

        print(f"[DEBUG] Categoría {categoria_id}: {len(productos_list)} productos encontrados")
        return {"success": True, "productos": productos_list}, 200

    except Exception as e:
        print(f"[ERROR] Error en get_productos_por_categoria({categoria_id}): {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}, 500


# 📌 NUEVO: Obtener productos SIN categoría asignada (para CRUD)
@app.route("/api/productos/sin-categoria", methods=["GET"])
def get_productos_sin_categoria():
    """Obtiene productos que NO tienen categoría (creados por CRUD)"""
    try:
        cur = mysql.connection.cursor()
        # Productos que NO están en producto_categorias
        cur.execute(
            """
            SELECT p.id, p.nombre, p.descripcion, p.precio, p.tiene_oferta, p.imagen, p.stock
            FROM productos p
            LEFT JOIN producto_categorias pc ON p.id = pc.producto_id
            WHERE pc.producto_id IS NULL
            ORDER BY p.id DESC
        """
        )
        productos = cur.fetchall()
        cur.close()

        productos_list = []
        for p in productos:
            productos_list.append(
                {
                    "id": p[0],
                    "nombre": p[1],
                    "descripcion": p[2],
                    "precio": float(p[3]),
                    "tiene_oferta": bool(p[4]),
                    "imagen": p[5],
                    "stock": p[6],
                    "categoria": "Sin categoría (CRUD)",
                }
            )

        return {"success": True, "productos": productos_list}, 200

    except Exception as e:
        print(f"Error: {e}")
        return {"success": False, "error": str(e)}, 500


# 📚 Obtener todas las categorías
@app.route("/api/categorias", methods=["GET"])
@admin_required
def get_categorias():
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, nombre FROM categorias ORDER BY nombre ASC")
        categorias = cur.fetchall()
        cur.close()

        categorias_list = []
        for c in categorias:
            categorias_list.append({"id": c[0], "nombre": c[1]})

        return {"success": True, "categorias": categorias_list}, 200

    except Exception as e:
        return {"success": False, "error": str(e)}, 500


# Endpoint público para obtener categorías (usado por admin panel)
@app.route("/api/categorias/publicas", methods=["GET"])
def get_categorias_publicas():
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, nombre FROM categorias ORDER BY nombre ASC")
        categorias = cur.fetchall()
        cur.close()

        categorias_list = []
        for c in categorias:
            categorias_list.append({"id": c[0], "nombre": c[1]})

        return {"success": True, "categorias": categorias_list}, 200

    except Exception as e:
        return {"success": False, "error": str(e)}, 500


@app.route("/api/categorias", methods=["POST"])
@admin_required
def create_categoria():
    """Crear nueva categoría (solo admin)"""
    try:
        data = request.get_json()

        nombre = data.get("nombre", "").strip()
        descripcion = data.get("descripcion", "").strip()

        if not nombre:
            return {
                "success": False,
                "error": "El nombre de la categoría es obligatorio",
            }, 400

        cur = mysql.connection.cursor()
        cur.execute(
            """
            INSERT INTO categorias (nombre, descripcion)
            VALUES (%s, %s)
        """,
            (nombre, descripcion),
        )
        mysql.connection.commit()
        categoria_id = cur.lastrowid
        cur.close()

        return {
            "success": True,
            "message": "Categoría creada exitosamente",
            "categoria_id": categoria_id,
        }, 201

    except Exception as e:
        return {"success": False, "error": str(e)}, 500


@app.route("/api/categorias/<int:categoria_id>", methods=["PUT"])
@admin_required
def update_categoria(categoria_id):
    """Actualizar categoría (solo admin)"""
    try:
        data = request.get_json()

        nombre = data.get("nombre", "").strip()
        descripcion = data.get("descripcion", "").strip()

        if not nombre:
            return {
                "success": False,
                "error": "El nombre de la categoría es obligatorio",
            }, 400

        cur = mysql.connection.cursor()
        cur.execute(
            """
            UPDATE categorias
            SET nombre=%s, descripcion=%s
            WHERE id=%s
        """,
            (nombre, descripcion, categoria_id),
        )
        mysql.connection.commit()

        if cur.rowcount == 0:
            return {"success": False, "error": "Categoría no encontrada"}, 404

        cur.close()
        return {"success": True, "message": "Categoría actualizada exitosamente"}, 200

    except Exception as e:
        return {"success": False, "error": str(e)}, 500


@app.route("/api/categorias/<int:categoria_id>", methods=["DELETE"])
@admin_required
def delete_categoria(categoria_id):
    """Eliminar categoría (solo admin)"""
    try:
        cur = mysql.connection.cursor()
        cur.execute("DELETE FROM categorias WHERE id=%s", (categoria_id,))
        mysql.connection.commit()

        if cur.rowcount == 0:
            return {"success": False, "error": "Categoría no encontrada"}, 404

        cur.close()
        return {"success": True, "message": "Categoría eliminada exitosamente"}, 200

    except Exception as e:
        return {"success": False, "error": str(e)}, 500


# 🏷️ Obtener categorías de un producto específico
@app.route("/api/productos/<int:producto_id>/categorias", methods=["GET"])
def get_categorias_producto(producto_id):
    try:
        cur = mysql.connection.cursor()
        cur.execute(
            """
            SELECT categoria_id FROM producto_categorias
            WHERE producto_id = %s
        """,
            (producto_id,),
        )
        categorias = cur.fetchall()
        cur.close()

        categorias_ids = [c[0] for c in categorias]

        return {"success": True, "categorias_ids": categorias_ids}, 200

    except Exception as e:
        return {"success": False, "error": str(e)}, 500


# ➕ Crear nuevo producto (desde admin web O desde CRUD Java)
@app.route("/api/productos", methods=["POST"])
def create_producto():
    try:
        data = request.get_json()

        nombre = data.get("nombre", "").strip()
        descripcion = data.get("descripcion", "").strip()
        precio = float(data.get("precio", 0))
        tiene_oferta = data.get("tiene_oferta", False)
        imagen = data.get("imagen", "").strip()
        stock = int(data.get("stock", 0))
        categorias_ids = data.get("categorias_ids", [])  # Array de IDs de categorías

        # DEBUG: Log what we're receiving
        print(f"\n{'='*60}")
        print(f"[DEBUG] POST /api/productos")
        print(f"  Nombre: {nombre}")
        print(f"  Descripción: {descripcion}")
        print(f"  Precio: {precio} | Stock: {stock}")
        print(f"  Categorías recibidas: {categorias_ids}")
        print(f"  Tipo de categorias_ids: {type(categorias_ids)}")
        print(f"{'='*60}\n")

        # Validaciones
        if not nombre or precio <= 0 or stock < 0:
            return {"success": False, "error": "Datos inválidos: nombre requerido, precio y stock deben ser válidos"}, 400

        cur = mysql.connection.cursor()

        # Insertar producto
        cur.execute(
            """
            INSERT INTO productos (nombre, descripcion, precio, tiene_oferta, imagen, stock)
            VALUES (%s, %s, %s, %s, %s, %s)
        """,
            (nombre, descripcion, precio, tiene_oferta, imagen, stock),
        )
        mysql.connection.commit()
        producto_id = cur.lastrowid

        print(f"[CREATE] ✅ Producto creado con ID: {producto_id}")

        # LÓGICA DE ASIGNACIÓN DE CATEGORÍAS
        # ====================================
        
        # Paso 1: Verificar si se enviaron categorías explícitamente
        categorias_para_asignar = []
        
        if categorias_ids and isinstance(categorias_ids, list) and len(categorias_ids) > 0:
            # Usuario seleccionó categorías explícitamente
            categorias_para_asignar = [int(cat_id) for cat_id in categorias_ids if str(cat_id).isdigit()]
            print(f"[ASSIGN] 📌 Categorías explícitas seleccionadas: {categorias_para_asignar}")
        else:
            # No hay categorías explícitas - intentar auto-asignación
            print(f"[ASSIGN] 🔍 No hay categorías explícitas, intentando auto-asignación...")
            categorias_para_asignar = _auto_asignar_categoria(nombre, descripcion)
        
        # Paso 2: Insertar relaciones producto-categoría
        if categorias_para_asignar:
            for cat_id in categorias_para_asignar:
                try:
                    cat_id_int = int(cat_id)
                    cur.execute(
                        """
                        INSERT INTO producto_categorias (producto_id, categoria_id)
                        VALUES (%s, %s)
                    """,
                        (producto_id, cat_id_int),
                    )
                    print(f"[ASSIGN] ✅ Asignada categoría {cat_id_int} al producto {producto_id}")
                except (ValueError, TypeError) as e:
                    print(f"[ASSIGN] ⚠️ Error al procesar categoría {cat_id}: {e}")
                    continue
            mysql.connection.commit()
        else:
            print(f"[ASSIGN] ⚠️ Producto {producto_id} quedó sin categoría asignada")

        cur.close()

        return {
            "success": True,
            "message": "Producto creado exitosamente",
            "producto_id": producto_id,
            "categorias_asignadas": categorias_para_asignar,
        }, 201

    except Exception as e:
        print(f"[ERROR] ❌ Error al crear producto: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}, 500


# Función para auto-asignar categorías basado en palabras clave
def _auto_asignar_categoria(nombre, descripcion):
    """
    Auto-asigna categorías a un producto basándose en palabras clave en nombre/descripción.
    Retorna una lista de IDs de categoría.
    
    Mapeo de palabras clave actualizado basado en tu script SQL:
    - 1: Carne de Res / Vacuno
    - 2: Carne de Cerdo
    - 3: Carne de Pollo
    - 4: Todo para Asar
    - 5: Cuchillos y Utensilios
    - 6: Parrillas y Soportes
    - 7: Limpieza y Mantenimiento
    - 8: Combustible y Encendido
    - 9: Equipos adicionales
    """
    
    categorias_keywords = {
        1: ['res', 'vacuno', 'bife', 'asado', 'costilla', 'lomo', 'carne roja', 'ternera', 'solomillo', 'falda', 'cadera', 'malaya', 'pecho', 'dracula', 'draco'],
        2: ['cerdo', 'puerco', 'jamón', 'panceta', 'lechón', 'pork', 'chuleta', 'costilla cerdo'],
        3: ['pollo', 'pechuga', 'muslo', 'alita', 'chicken', 'ave'],
        6: ['parrilla', 'asador', 'soporte', 'grill', 'brasero', 'juego'],
        5: ['cuchillo', 'cuchilla', 'utensilio', 'tenedor', 'pinza', 'espada', 'tabla'],
        8: ['encendido', 'combustible', 'carbón', 'leña', 'fuego', 'gas'],
        7: ['limpieza', 'detergente', 'trapo', 'escoba', 'mantenimiento', 'jabón'],
        9: ['equipo', 'adicional', 'extra', 'accesorio', 'complemento']
    }
    
    texto_completo = (nombre + " " + (descripcion or "")).lower()
    categorias_asignadas = []
    
    # Buscar coincidencias de palabras clave
    for cat_id, keywords in categorias_keywords.items():
        for keyword in keywords:
            if keyword in texto_completo:
                if cat_id not in categorias_asignadas:
                    categorias_asignadas.append(cat_id)
                break  # Solo una coincidencia por categoría
    
    # FALLBACK: Si no encontramos coincidencias, asumir que es carne (categoría 1)
    # basado en que la mayoría de productos de esta carnicería son carnes
    if not categorias_asignadas:
        print(f"[AUTO-ASSIGN] ⚠️ No encontrada palabra clave específica. Usando fallback: categoría 1 (Carne de Res)")
        categorias_asignadas = [1]
    
    print(f"[AUTO-ASSIGN] Producto: '{nombre}' → Categorías encontradas: {categorias_asignadas}")
    return categorias_asignadas

# ✏️ Actualizar producto
@app.route("/api/productos/<int:producto_id>", methods=["PUT"])
def update_producto(producto_id):
    try:
        data = request.get_json()

        nombre = data.get("nombre", "").strip()
        descripcion = data.get("descripcion", "").strip()
        precio = float(data.get("precio", 0))
        tiene_oferta = data.get("tiene_oferta", False)
        imagen = data.get("imagen", "").strip()
        stock = int(data.get("stock", 0))
        categorias_ids = data.get("categorias_ids", [])  # Array de IDs de categorías

        # Validaciones
        if not nombre or not descripcion or precio <= 0 or stock < 0:
            return {"success": False, "error": "Datos inválidos"}, 400

        cur = mysql.connection.cursor()

        # Actualizar producto
        cur.execute(
            """
            UPDATE productos
            SET nombre=%s, descripcion=%s, precio=%s, tiene_oferta=%s, imagen=%s, stock=%s
            WHERE id=%s
        """,
            (nombre, descripcion, precio, tiene_oferta, imagen, stock, producto_id),
        )
        mysql.connection.commit()

        if cur.rowcount == 0:
            return {"success": False, "error": "Producto no encontrado"}, 404

        # Si NO hay categorías explícitas, auto-asignar basado en nombre/descripción
        if not categorias_ids or not isinstance(categorias_ids, list) or len(categorias_ids) == 0:
            categorias_ids = _auto_asignar_categoria(nombre, descripcion)
            print(f"[AUTO-ASSIGN] Categorías auto-asignadas (UPDATE): {categorias_ids}")

        # Actualizar categorías: primero eliminar las antiguas, luego agregar las nuevas
        cur.execute(
            "DELETE FROM producto_categorias WHERE producto_id=%s", (producto_id,)
        )
        mysql.connection.commit()

        # Insertar nuevas relaciones producto-categoría
        if categorias_ids and isinstance(categorias_ids, list):
            for cat_id in categorias_ids:
                try:
                    cat_id_int = int(cat_id)
                    cur.execute(
                        """
                        INSERT INTO producto_categorias (producto_id, categoria_id)
                        VALUES (%s, %s)
                    """,
                        (producto_id, cat_id_int),
                    )
                except (ValueError, TypeError):
                    continue
            mysql.connection.commit()

        cur.close()
        return {"success": True, "message": "Producto actualizado exitosamente"}, 200

    except Exception as e:
        print(f"Error al actualizar producto: {e}")
        return {"success": False, "error": str(e)}, 500


# 🗑️ Eliminar producto
@app.route("/api/productos/<int:producto_id>", methods=["DELETE"])
def delete_producto(producto_id):
    try:
        cur = mysql.connection.cursor()
        cur.execute("DELETE FROM productos WHERE id=%s", (producto_id,))
        mysql.connection.commit()

        if cur.rowcount == 0:
            return {"success": False, "error": "Producto no encontrado"}, 404

        cur.close()
        return {"success": True, "message": "Producto eliminado exitosamente"}, 200

    except Exception as e:
        print(f"Error al eliminar producto: {e}")
        return {"success": False, "error": str(e)}, 500


# 🔐 Verificación de sesión (protección contra contaminación)

# 🔐 Verificación de sesión (protección contra contaminación)
@app.route("/api/verify-session", methods=["GET"])
def verify_session():
    """Endpoint para verificar y sanear la sesión en tiempo real"""
    user_id = session.get("user_id")
    admin_id = session.get("admin_id")
    is_admin = session.get("is_admin")
    
    # VALIDACIÓN: Si hay AMBOS user_id Y admin_id, es contaminación - limpiar
    if user_id and admin_id:
        session.clear()
        return {"contaminated": True, "action": "cleared", "message": "Sesión contaminada - limpiada"}, 200
    
    # Si es usuario normal, no debe tener admin_id
    if user_id and admin_id:
        session.clear()
        return {"valid": False}, 401
    
    # Si es admin, no debe tener user_id
    if admin_id and user_id:
        session.clear()
        return {"valid": False}, 401
    
    # Si tiene is_admin pero no admin_id, es inválido
    if is_admin and not admin_id:
        session.clear()
        return {"valid": False}, 401
    
    return {"valid": True, "user_id": user_id, "admin_id": admin_id, "is_admin": is_admin}, 200


# ============================================
# INICIALIZACIÓN Y REGISTRO DE RUTAS
# ============================================

# 📋 Importar y registrar rutas del panel administrativo
try:
    from admin_routes import register_admin_routes
    register_admin_routes(app, mysql)
    print("[OK] Rutas de admin_routes.py importadas y registradas correctamente")
except ImportError as e:
    print(f"[WARNING] No se pudo importar admin_routes.py: {e}")
except Exception as e:
    print(f"[WARNING] Error al registrar rutas del admin: {e}")



# 🚀 Ejecutar servidor
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
