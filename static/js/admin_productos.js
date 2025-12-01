/* ============================================
   ADMIN - GESTIÓN DE PRODUCTOS
   CRUD completo de productos con modal
   ============================================ */

let productoEditando = null;
let categorias = [];
let archivoImagenSeleccionado = null;
const modal = document.getElementById('productoModal');
const form = document.getElementById('productoForm');

// Cargar productos y categorías al iniciar
window.addEventListener('load', () => {
    cargarCategorias();
    cargarProductos();
    
    // Listener para el input de archivo
    const imagenFile = document.getElementById('imagenFile');
    if (imagenFile) {
        imagenFile.addEventListener('change', manejarSeleccionImagen);
    }
});

// ==========================
// CARGAR CATEGORÍAS
// ==========================
async function cargarCategorias() {
    try {
        const response = await fetch('/api/categorias/publicas');
        const data = await response.json();
        categorias = data.categorias || [];
        console.log("Categorias cargadas:", categorias);
        renderizarCategorias();
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

function renderizarCategorias() {
    const container = document.getElementById('categoriasContainer');
    container.innerHTML = '';

    console.log("Renderizando categorías:", categorias);

    categorias.forEach(cat => {
        const label = document.createElement('label');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = cat.id;
        checkbox.className = 'categoria-checkbox';

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(cat.nombre));
        container.appendChild(label);
    });

    console.log("Checkboxes creados:", document.querySelectorAll('.categoria-checkbox').length);
}

// ==========================
// CARGAR PRODUCTOS
// ==========================
async function cargarProductos() {
    try {
        // Usar el endpoint /api/productos/admin para ver todos los productos (incluyendo inactivos)
        const response = await fetch('/api/productos/admin');
        const data = await response.json();

        const tbody = document.getElementById('productosBody');
        tbody.innerHTML = '';

        if (!data.productos || data.productos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay productos</td></tr>';
            return;
        }

        data.productos.forEach(p => {
            const row = `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.nombre}</td>
                    <td>S/. ${p.precio.toFixed(2)}</td>
                    <td>${p.stock}</td>
                    <td><img src="/static/image/${p.imagen}" class="img-preview" alt="${p.nombre}" onerror="this.src='/static/image/default.jpg'"></td>
                    <td>${p.activo ? '✅ Activo' : '❌ Inactivo'}</td>
                    <td>
                        <button class="btn" onclick="editarProducto(${p.id})">✏️</button>
                        <button class="btn btn-danger" onclick="eliminarProducto(${p.id})">🗑️</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        mostrarAlerta('Error al cargar productos', 'danger');
        console.error(error);
    }
}

// ==========================
// MODAL AGREGAR
// ==========================
function abrirModalAgregar() {
    productoEditando = null;
    document.getElementById('modalTitle').textContent = 'Agregar Producto';
    form.reset();
    archivoImagenSeleccionado = null;
    document.getElementById('imagenPreview').style.display = 'none';
    document.getElementById('imagenFile').value = '';

    document.querySelectorAll('.categoria-checkbox').forEach(cb => cb.checked = false);
    modal.style.display = 'block';
}

// ==========================
// MANEJO DE IMAGEN
// ==========================
function manejarSeleccionImagen(event) {
    const file = event.target.files[0];
    if (file) {
        archivoImagenSeleccionado = file;
        
        // Mostrar vista previa
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('imagenPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
        
        // Auto-llenar el nombre del archivo si está vacío
        if (!document.getElementById('imagen').value) {
            document.getElementById('imagen').value = file.name;
        }
    }
}

// ==========================
// EDITAR PRODUCTO
// ==========================
async function editarProducto(id) {
    try {
        const response = await fetch(`/api/productos/${id}`);
        const p = await response.json();

        productoEditando = id;
        document.getElementById('modalTitle').textContent = 'Editar Producto';
        document.getElementById('nombre').value = p.nombre;
        document.getElementById('descripcion').value = p.descripcion;
        document.getElementById('precio').value = p.precio;
        document.getElementById('stock').value = p.stock;
        document.getElementById('imagen').value = p.imagen;

        const response2 = await fetch(`/api/productos/${id}/categorias`);
        const data = await response2.json();
        const categoriasProducto = data.categorias_ids || [];

        document.querySelectorAll('.categoria-checkbox').forEach(cb => {
            cb.checked = categoriasProducto.includes(parseInt(cb.value));
        });

        modal.style.display = 'block';
    } catch (error) {
        mostrarAlerta('Error al cargar producto', 'danger');
    }
}

// ==========================
// CERRAR MODAL
// ==========================
function cerrarModal() {
    modal.style.display = 'none';
}

window.onclick = (event) => {
    if (event.target === modal) {
        cerrarModal();
    }
};

// ==========================
// GUARDAR PRODUCTO
// ==========================
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const categoriasSeleccionadas = Array.from(
        document.querySelectorAll('.categoria-checkbox:checked')
    ).map(cb => parseInt(cb.value));

    const nombreImagen = document.getElementById('imagen').value || (archivoImagenSeleccionado ? archivoImagenSeleccionado.name : 'sin-imagen.jpg');

    const producto = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        precio: parseFloat(document.getElementById('precio').value),
        stock: parseInt(document.getElementById('stock').value),
        imagen: nombreImagen,
        categorias_ids: categoriasSeleccionadas
    };

    console.log("Categorías seleccionadas:", categoriasSeleccionadas);
    console.log("Producto a guardar:", producto);

    try {
        let response;

        if (productoEditando) {
            // EDITAR PRODUCTO EXISTENTE
            response = await fetch(`/api/productos/${productoEditando}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(producto)
            });

            if (!response.ok) {
                throw new Error('Error al actualizar producto');
            }

            if (archivoImagenSeleccionado) {
                await subirImagenProducto(archivoImagenSeleccionado, nombreImagen);
            }

            mostrarAlerta('Producto actualizado correctamente', 'success');
        } else {
            // CREAR NUEVO PRODUCTO
            response = await fetch('/api/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(producto)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear producto');
            }

            const respData = await response.json();
            console.log("Producto creado con ID:", respData.id);

            // Subir imagen si se seleccionó una
            if (archivoImagenSeleccionado) {
                await subirImagenProducto(archivoImagenSeleccionado, nombreImagen);
            }

            mostrarAlerta('Producto agregado correctamente', 'success');
        }

        cerrarModal();
        await cargarProductos();
        archivoImagenSeleccionado = null;
        
    } catch (error) {
        mostrarAlerta('Error: ' + error.message, 'danger');
        console.error('Error completo:', error);
    }
});

// ==========================
// SUBIR IMAGEN DEL PRODUCTO
// ==========================
async function subirImagenProducto(archivo, nombreArchivo) {
    try {
        const formData = new FormData();
        formData.append('file', archivo);
        
        // Si no se especificó nombre, usar el del archivo
        const nombre = nombreArchivo || archivo.name;
        formData.append('nombre', nombre);

        console.log("Subiendo imagen con nombre:", nombre);

        const response = await fetch('/api/upload-imagen', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Imagen subida correctamente:', data);
            return true;
        } else {
            console.error('Error al subir imagen, status:', response.status);
            const errorData = await response.json();
            console.error('Error data:', errorData);
            return false;
        }
    } catch (error) {
        console.error('Error en la carga de imagen:', error);
        return false;
    }
}

// ==========================
// ELIMINAR PRODUCTO
// ==========================
async function eliminarProducto(id) {
    if (confirm('¿Deseas eliminar este producto?')) {
        try {
            const response = await fetch(`/api/productos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                mostrarAlerta('Producto eliminado correctamente', 'success');
                cargarProductos();
            }
        } catch (error) {
            mostrarAlerta('Error al eliminar producto', 'danger');
        }
    }
}

// ==========================
// ALERTAS
// ==========================
function mostrarAlerta(mensaje, tipo) {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo}`;
    alert.textContent = mensaje;

    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);

    setTimeout(() => alert.remove(), 3000);
}