# 📸 Guía: Subir Imágenes desde CRUD Java y Visualizarlas en la Web

## ✅ Cambios Realizados

Se han mejorado los endpoints de Flask para:

1. **Mejor manejo de uploads** (`/api/upload`)
   - Valida correctamente las extensiones de archivo
   - Soporta: JPG, JPEG, PNG, GIF, WebP, BMP, SVG, TIFF, ICO, HEIC, HEIF
   - Crea logs detallados de cada subida
   - Retorna la URL correcta para la web

2. **Mejor listado de imágenes** (`/api/imagenes-disponibles`)
   - Retorna todas las imágenes disponibles en el servidor
   - Incluye información de tamaño y fecha
   - Con logs detallados

3. **Mejor manejo en el frontend** (`productos_dinamico.js`)
   - Valida correctamente la ruta de imagen
   - Muestra placeholder si la imagen falta
   - Soporta tanto rutas relativas como absolutas

## 🔧 Cómo Funciona

### Flujo de Subida (CRUD Java → Flask)

```
1. CRUD Java selecciona una imagen local
2. Envía POST a http://localhost:5000/api/upload con:
   - file: archivo de imagen (multipart/form-data)
   - nombre: nombre del producto (opcional)
3. Flask recibe y guarda en static/image/
4. Retorna: { "success": true, "url": "/static/image/nombreImagen.jpg" }
5. CRUD actualiza el combo de imágenes con nuevas imágenes del servidor
```

### Flujo de Visualización (Web)

```
1. Página de productos carga /api/productos
2. Cada producto trae su campo "imagen" (nombre del archivo)
3. JavaScript construye URL: /static/image/nombreImagen.jpg
4. Si imagen falta, muestra placeholder de "Sin Imagen"
```

## ✨ Ejemplo de Uso

### Desde tu CRUD Java:

```java
// 1. Seleccionar imagen local
File imagen = new File("C:/fotos/mi_imagen.jpg");

// 2. Llamar al método de upload
boolean exito = ProductoController.subirImagenAFlask(imagen, "Nombre Producto");

// 3. Si es exitoso, la imagen aparecerá automáticamente en la web
```

### En la Base de Datos:

```sql
-- La tabla productos debe tener el campo "imagen"
-- Contiene SOLO el nombre del archivo (sin ruta)
INSERT INTO productos (nombre, descripcion, precio, imagen, stock)
VALUES ('Asado de Costilla', 'Costilla fresca de res', 150.00, 'costilla.jpg', 10);
```

### En la Web (HTML):

```html
<!-- Automáticamente se construye la URL -->
<img src="/static/image/costilla.jpg" alt="Asado de Costilla">

<!-- Si falta imagen, muestra placeholder -->
<img src="/static/image/costilla.jpg" 
     onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'">
```

## 🔍 Cómo Verificar que Funciona

### 1. Verifica los logs en consola de Flask:

```
[UPLOAD] 📥 Solicitud de subida recibida
[UPLOAD] 📄 Archivo original: costilla.jpg
[UPLOAD] 🏷️  Nombre del producto: Costilla fresca
[UPLOAD] ✅ Imagen guardada exitosamente
[UPLOAD] 📍 Ubicación: static/image/costilla.jpg
[UPLOAD] 📊 Tamaño: 125342 bytes
[UPLOAD] 🌐 URL web: /static/image/costilla.jpg
```

### 2. Verifica que la imagen se guardó:

```
Carpeta: c:\Users\anacr\OneDrive\Desktop\asdfghjkl\TEAM12_WP\static\image\
Archivo: costilla.jpg
```

### 3. Abre en navegador:

```
http://localhost:5000/static/image/costilla.jpg
```

Deberías ver la imagen.

### 4. Verifica en tu página web:

```
http://localhost:5000/productos

Deberías ver los productos con sus imágenes.
```

## 🐛 Troubleshooting

### Problema: No se ve la imagen en la web

**Solución:**
1. Verifica que Flask está corriendo en puerto 5000: `python app.py`
2. Verifica que la imagen se subió correctamente revisando `static/image/`
3. Revisa los logs de Flask para errores
4. Abre la URL directa: `http://localhost:5000/static/image/nombreArchivo.jpg`

### Problema: CRUD no puede conectar con Flask

**Solución:**
1. Asegúrate que Flask está ejecutándose: `python app.py`
2. Verifica que el puerto es 5000 en `app.py`
3. Actualiza la URL en el CRUD Java en `ProductoController.java`:
   ```java
   private static final String FLASK_BASE_URL = "http://localhost:5000";
   ```
4. Reinicia el CRUD Java

### Problema: Archivo tipo no permitido

**Solución:**
Los tipos permitidos son:
- Imágenes: JPG, JPEG, PNG, GIF, WebP, BMP, SVG, TIFF, ICO, HEIC, HEIF

Asegúrate de usar uno de estos formatos.

## 📋 Resumen de Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/upload` | POST | Subir imagen desde CRUD Java |
| `/api/imagenes-disponibles` | GET | Obtener lista de imágenes del servidor |
| `/api/productos` | GET | Obtener todos los productos (con campos imagen) |
| `/static/image/{archivo}` | GET | Acceder directamente a una imagen guardada |

## 🚀 Conclusión

Ahora puedes:

✅ Subir imágenes desde tu CRUD Java
✅ Visualizar las imágenes en la web automáticamente
✅ Sincronizar el combo de imágenes con el servidor
✅ Ver logs detallados del proceso

¡Los cambios ya están en GitHub! 🎉
