"""
============================================
RUTAS DEL PANEL ADMINISTRATIVO
Panel admin completo: Usuarios, Productos, 
Carrito/Pedidos, Reclamos, Imágenes
============================================
"""

from functools import wraps
from flask import session, redirect, url_for, render_template, request, jsonify


# ============================================================================
# 🔐 DECORADOR PARA PROTEGER RUTAS ADMINISTRATIVAS
# ============================================================================

def admin_required(f):
    """Decorador que verifica si el usuario está autenticado como administrador"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "is_admin" not in session or not session["is_admin"]:
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function


# ============================================================================
# FUNCIÓN PARA REGISTRAR TODAS LAS RUTAS DEL ADMIN
# ============================================================================

def register_admin_routes(app, mysql):
    """Registra todas las rutas del panel administrativo en la aplicación Flask"""

    # ============================================================================
    # 📊 PANEL ADMIN - DASHBOARD PRINCIPAL
    # ============================================================================

    @app.route("/admin/dashboard")
    @admin_required
    def admin_dashboard():
        """Panel principal del admin"""
        cur = mysql.connection.cursor()

        # Estadísticas
        cur.execute("SELECT COUNT(*) FROM usuarios")
        total_usuarios = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM productos")
        total_productos = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM pedidos")
        total_pedidos = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM reclamos")
        total_reclamos = cur.fetchone()[0]

        cur.close()

        return render_template(
            "admin_dashboard.html",
            admin_name=session.get("admin_name"),
            total_usuarios=total_usuarios,
            total_productos=total_productos,
            total_pedidos=total_pedidos,
            total_reclamos=total_reclamos,
        )

    @app.route("/admin/logout")
    def admin_logout():
        """Cerrar sesión del admin"""
        session.clear()
        return redirect(url_for("login"))

    # ============================================================================
    # 👤 GESTIÓN DE USUARIOS
    # ============================================================================

    @app.route("/admin/usuarios")
    @admin_required
    def admin_usuarios():
        """Vista de gestión de usuarios"""
        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM usuarios ORDER BY fecha_creacion DESC")
        usuarios = cur.fetchall()
        cur.close()
        return render_template("admin_usuarios.html", usuarios=usuarios)

    @app.route("/api/usuarios", methods=["GET"])
    @admin_required
    def api_usuarios():
        """API para obtener usuarios"""
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, nombre, apellido, email, dni, direccion FROM usuarios")
        usuarios = cur.fetchall()
        cur.close()

        resultado = []
        for u in usuarios:
            resultado.append(
                {
                    "id": u[0],
                    "nombre": u[1],
                    "apellido": u[2],
                    "email": u[3],
                    "dni": u[4],
                    "direccion": u[5],
                }
            )

        return {"usuarios": resultado}

    @app.route("/api/usuarios/<int:usuario_id>", methods=["GET", "PUT", "DELETE"])
    @admin_required
    def api_usuario(usuario_id):
        """API para obtener, editar o eliminar un usuario"""
        cur = mysql.connection.cursor()

        if request.method == "GET":
            cur.execute("SELECT * FROM usuarios WHERE id=%s", (usuario_id,))
            u = cur.fetchone()
            cur.close()

            if u:
                return {
                    "id": u[0],
                    "nombre": u[1],
                    "apellido": u[2],
                    "email": u[3],
                    "dni": u[5],
                    "direccion": u[6],
                    "fecha_nacimiento": str(u[7]) if u[7] else None,
                }
            return {"error": "Usuario no encontrado"}, 404

        elif request.method == "PUT":
            data = request.json
            cur.execute(
                """
                UPDATE usuarios SET nombre=%s, apellido=%s, email=%s, dni=%s, direccion=%s
                WHERE id=%s
            """,
                (
                    data["nombre"],
                    data["apellido"],
                    data["email"],
                    data["dni"],
                    data["direccion"],
                    usuario_id,
                ),
            )
            mysql.connection.commit()
            cur.close()
            return {"success": True}

        elif request.method == "DELETE":
            cur.execute("DELETE FROM usuarios WHERE id=%s", (usuario_id,))
            mysql.connection.commit()
            cur.close()
            return {"success": True}

    # ============================================================================
    # 🏪 GESTIÓN DE PRODUCTOS
    # ============================================================================

    @app.route("/admin/productos")
    @admin_required
    def admin_productos():
        """Vista de gestión de productos"""
        cur = mysql.connection.cursor()
        cur.execute(
            """
            SELECT id, nombre, descripcion, precio, stock, imagen, activo
            FROM productos ORDER BY id DESC
        """
        )
        productos = cur.fetchall()
        cur.close()
        return render_template("admin_productos.html", productos=productos)

    @app.route("/api/productos", methods=["GET", "POST"])
    def api_productos():
        """API para obtener todos los productos públicos o crear nuevo"""
        cur = mysql.connection.cursor()

        if request.method == "GET":
            # Solo devuelve productos activos para la vista pública
            cur.execute(
                """
                SELECT id, nombre, descripcion, precio, stock, imagen, activo
                FROM productos WHERE activo=1 ORDER BY id DESC
            """
            )
            productos = cur.fetchall()
            cur.close()

            resultado = []
            for p in productos:
                resultado.append(
                    {
                        "id": p[0],
                        "nombre": p[1],
                        "descripcion": p[2],
                        "precio": float(p[3]),
                        "stock": p[4],
                        "imagen": p[5],
                        "activo": p[6],
                    }
                )

            return {"productos": resultado}

        elif request.method == "POST":
            if not session.get("is_admin"):
                return {"error": "No autorizado"}, 401

            data = request.json
            cur.execute(
                """
                INSERT INTO productos (nombre, descripcion, precio, stock, imagen, activo)
                VALUES (%s, %s, %s, %s, %s, 1)
            """,
                (
                    data["nombre"],
                    data["descripcion"],
                    data["precio"],
                    data["stock"],
                    data["imagen"],
                ),
            )
            mysql.connection.commit()

            producto_id = cur.lastrowid
            cur.close()

            # Manejar las categorías del producto si se proporcionan
            if "categorias_ids" in data and data["categorias_ids"]:
                cur = mysql.connection.cursor()
                for cat_id in data["categorias_ids"]:
                    cur.execute(
                        "INSERT INTO producto_categorias (producto_id, categoria_id) VALUES (%s, %s)",
                        (producto_id, cat_id)
                    )
                mysql.connection.commit()
                cur.close()

            return {"success": True, "id": producto_id}, 201

    @app.route("/api/productos/admin", methods=["GET"])
    @admin_required
    def api_productos_admin():
        """API para obtener todos los productos (incluyendo inactivos) - Solo admin"""
        cur = mysql.connection.cursor()
        cur.execute(
            """
            SELECT id, nombre, descripcion, precio, stock, imagen, activo
            FROM productos ORDER BY id DESC
        """
        )
        productos = cur.fetchall()
        cur.close()

        resultado = []
        for p in productos:
            resultado.append(
                {
                    "id": p[0],
                    "nombre": p[1],
                    "descripcion": p[2],
                    "precio": float(p[3]),
                    "stock": p[4],
                    "imagen": p[5],
                    "activo": p[6],
                }
            )

        return {"productos": resultado}

    @app.route("/api/productos/<int:producto_id>", methods=["GET", "PUT", "DELETE"])
    @admin_required
    def api_producto(producto_id):
        """API para obtener, editar o eliminar un producto"""
        cur = mysql.connection.cursor()

        if request.method == "GET":
            cur.execute(
                """
                SELECT id, nombre, descripcion, precio, stock, imagen, activo
                FROM productos WHERE id=%s
            """,
                (producto_id,),
            )
            p = cur.fetchone()
            cur.close()

            if p:
                return {
                    "id": p[0],
                    "nombre": p[1],
                    "descripcion": p[2],
                    "precio": float(p[3]),
                    "stock": p[4],
                    "imagen": p[5],
                    "activo": p[6],
                }
            return {"error": "Producto no encontrado"}, 404

        elif request.method == "PUT":
            data = request.json
            cur.execute(
                """
                UPDATE productos SET nombre=%s, descripcion=%s, precio=%s, stock=%s, imagen=%s
                WHERE id=%s
            """,
                (
                    data["nombre"],
                    data["descripcion"],
                    data["precio"],
                    data["stock"],
                    data["imagen"],
                    producto_id,
                ),
            )
            mysql.connection.commit()

            # Actualizar las categorías si se proporcionan
            if "categorias_ids" in data:
                # Eliminar categorías anteriores
                cur.execute("DELETE FROM producto_categorias WHERE producto_id=%s", (producto_id,))
                mysql.connection.commit()
                
                # Insertar nuevas categorías
                for cat_id in data["categorias_ids"]:
                    cur.execute(
                        "INSERT INTO producto_categorias (producto_id, categoria_id) VALUES (%s, %s)",
                        (producto_id, cat_id)
                    )
                mysql.connection.commit()

            cur.close()
            return {"success": True}

        elif request.method == "DELETE":
            # Soft delete (marcar como inactivo)
            cur.execute("UPDATE productos SET activo=0 WHERE id=%s", (producto_id,))
            mysql.connection.commit()
            cur.close()
            return {"success": True}

    @app.route("/api/productos/<int:producto_id>/categorias", methods=["GET"])
    @admin_required
    def api_producto_categorias(producto_id):
        """Obtener las categorías asignadas a un producto"""
        cur = mysql.connection.cursor()
        cur.execute(
            """
            SELECT categoria_id FROM producto_categorias WHERE producto_id=%s
            """,
            (producto_id,)
        )
        categorias = cur.fetchall()
        cur.close()

        categorias_ids = [c[0] for c in categorias]
        return {"categorias_ids": categorias_ids}

    # ============================================================================
    # 🛒 GESTIÓN DE CARRITO / PEDIDOS
    # ============================================================================

    @app.route("/admin/carrito")
    @admin_required
    def admin_carrito():
        """Vista de gestión de carrito/pedidos"""
        cur = mysql.connection.cursor()
        cur.execute(
            """
            SELECT p.id, u.nombre, u.apellido, p.total, p.estado, p.fecha
            FROM pedidos p
            INNER JOIN usuarios u ON p.usuario_id = u.id
            ORDER BY p.fecha DESC
        """
        )
        pedidos = cur.fetchall()
        cur.close()
        return render_template("admin_carrito.html", pedidos=pedidos)

    @app.route("/api/pedidos", methods=["GET"])
    @admin_required
    def api_pedidos():
        """API para obtener todos los pedidos"""
        try:
            cur = mysql.connection.cursor()
            
            cur.execute(
                """
                SELECT p.id, u.nombre, u.apellido, p.total, p.metodo_pago, p.tipo_entrega, p.fecha, p.usuario_id
                FROM pedidos p
                INNER JOIN usuarios u ON p.usuario_id = u.id
                ORDER BY p.fecha DESC
            """
            )
            
            pedidos = cur.fetchall()
            cur.close()

            resultado = []
            for p in pedidos:
                resultado.append(
                    {
                        "id": p[0],
                        "usuario_nombre": f"{p[1]} {p[2]}",
                        "usuario_id": p[7],
                        "total": float(p[3]) if p[3] else 0,
                        "metodo_pago": p[4] if p[4] else "No especificado",
                        "tipo_entrega": p[5] if p[5] else "No especificado",
                        "fecha": str(p[6]) if p[6] else "",
                        "estado": "Completado"
                    }
                )

            return {"pedidos": resultado}, 200
        
        except Exception as e:
            print(f"Error en api_pedidos: {e}")
            return {"error": str(e), "pedidos": []}, 500

    # ============================================================================
    # 📘 GESTIÓN DE RECLAMOS
    # ============================================================================

    @app.route("/admin/reclamos")
    @admin_required
    def admin_reclamos():
        """Vista de gestión de reclamos"""
        cur = mysql.connection.cursor()
        cur.execute(
            """
            SELECT r.id, u.nombre, u.apellido, r.tipo, r.mensaje, r.fecha
            FROM reclamos r
            INNER JOIN usuarios u ON r.usuario_id = u.id
            ORDER BY r.fecha DESC
        """
        )
        reclamos = cur.fetchall()
        cur.close()
        return render_template("admin_reclamos.html", reclamos=reclamos)

    @app.route("/api/reclamos", methods=["GET"])
    @admin_required
    def api_reclamos():
        """API para obtener todos los reclamos"""
        cur = mysql.connection.cursor()
        cur.execute(
            """
            SELECT r.id, u.nombre, u.apellido, u.id, r.tipo, r.mensaje, r.fecha
            FROM reclamos r
            INNER JOIN usuarios u ON r.usuario_id = u.id
            ORDER BY r.fecha DESC
        """
        )
        reclamos = cur.fetchall()
        cur.close()

        resultado = []
        for r in reclamos:
            resultado.append(
                {
                    "id": r[0],
                    "usuario_nombre": f"{r[1]} {r[2]}",
                    "usuario_id": r[3],
                    "tipo": r[4],
                    "descripcion": r[5],
                    "fecha": str(r[6]),
                }
            )

        return {"reclamos": resultado}

    @app.route("/api/pedidos/<int:pedido_id>", methods=["GET"])
    @admin_required
    def api_pedido_detalle(pedido_id):
        """Obtener detalles de un pedido específico"""
        cur = mysql.connection.cursor()
        cur.execute(
            """
            SELECT p.id, u.nombre, u.apellido, u.id, p.total, p.metodo_pago, p.tipo_entrega, p.fecha
            FROM pedidos p
            INNER JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.id = %s
            """,
            (pedido_id,),
        )
        pedido = cur.fetchone()
        
        if not pedido:
            cur.close()
            return {"error": "Pedido no encontrado"}, 404
        
        cur.close()
        
        return {
            "id": pedido[0],
            "usuario_nombre": f"{pedido[1]} {pedido[2]}",
            "usuario_id": pedido[3],
            "total": float(pedido[4]),
            "metodo_pago": pedido[5],
            "tipo_entrega": pedido[6],
            "fecha": str(pedido[7]),
            "estado": "Completado"
        }

    @app.route("/api/pedidos/<int:pedido_id>/items", methods=["GET"])
    @admin_required
    def api_pedido_items(pedido_id):
        """Obtener items de un pedido específico"""
        cur = mysql.connection.cursor()
        cur.execute(
            """
            SELECT producto_id, nombre, precio, cantidad, subtotal
            FROM pedido_items
            WHERE pedido_id = %s
            ORDER BY id ASC
            """,
            (pedido_id,),
        )
        items = cur.fetchall()
        cur.close()
        
        items_list = []
        for item in items:
            items_list.append(
                {
                    "producto_id": item[0],
                    "producto_nombre": item[1],
                    "precio_unitario": float(item[2]),
                    "cantidad": int(item[3]),
                    "subtotal": float(item[4]),
                }
            )
        
        return {"items": items_list}

    @app.route("/api/reclamos/<int:reclamo_id>", methods=["DELETE"])
    @admin_required
    def api_reclamo_delete(reclamo_id):
        """Eliminar un reclamo"""
        cur = mysql.connection.cursor()
        cur.execute("DELETE FROM reclamos WHERE id=%s", (reclamo_id,))
        mysql.connection.commit()
        cur.close()
        return {"success": True}
