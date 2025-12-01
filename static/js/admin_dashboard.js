/* ============================================
   PANEL ADMINISTRATIVO UNIFICADO
   Gestión de productos, usuarios, compras y reclamos
   ============================================ */

// =====================================
// PANEL ADMIN UNIFICADO - JavaScript
// =====================================

let categorias = [];
let productoEditando = null;

// Variables para almacenar datos originales (para búsqueda)
let usuariosData = [];
let comprasData = [];
let reclamosData = [];

// =====================================
// DARK MODE MANAGEMENT
// =====================================
function initializarDarkMode() {
    // Verificar si el modo oscuro fue guardado previamente
    const darkModeEnabled = localStorage.getItem('darkModeEnabled') === 'true';
    
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
        actualizarIconoDarkMode(true);
    }
    
    // Agregar event listener al botón de toggle
    const darkModeBtn = document.getElementById('darkModeToggle');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', toggleDarkMode);
    }
}

function toggleDarkMode() {
    const body = document.body;
    const isDarkMode = body.classList.toggle('dark-mode');
    localStorage.setItem('darkModeEnabled', isDarkMode);
    actualizarIconoDarkMode(isDarkMode);
}

function actualizarIconoDarkMode(isDarkMode) {
    const btn = document.getElementById('darkModeToggle');
    if (btn) {
        btn.textContent = isDarkMode ? '☀️' : '🌙';
    }
}

// =====================================
// GESTOR DE IMÁGENES
// =====================================
let imagenSeleccionada = null;

async function cargarImagenesDisponibles() {
    try {
        console.log('🖼️ Cargando imágenes disponibles...');
        const response = await fetch('/api/imagenes-disponibles');
        const data = await response.json();

        const gallery = document.getElementById('imagenesGallery');
        if (!gallery) return;

        gallery.innerHTML = '';

        if (!data.imagenes || data.imagenes.length === 0) {
            gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No hay imágenes disponibles</p>';
            return;
        }

        console.log(`✅ ${data.imagenes.length} imágenes cargadas`);

        data.imagenes.forEach(img => {
            const imagenDiv = document.createElement('div');
            imagenDiv.className = 'imagen-item';
            imagenDiv.title = img.nombre;
            
            const imagenTag = document.createElement('img');
            imagenTag.src = img.url;
            imagenTag.alt = img.nombre;
            imagenTag.onerror = () => {
                imagenDiv.textContent = '❌';
                imagenDiv.classList.add('sin-imagen');
            };
            
            imagenDiv.appendChild(imagenTag);
            
            imagenDiv.addEventListener('click', () => {
                seleccionarImagen(img.nombre, img.url);
            });
            
            gallery.appendChild(imagenDiv);
        });
    } catch (error) {
        console.error('❌ Error al cargar imágenes:', error);
        const gallery = document.getElementById('imagenesGallery');
        if (gallery) {
            gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Error al cargar imágenes</p>';
        }
    }
}

function seleccionarImagen(nombreImagen, urlImagen) {
    // Marcar como seleccionada
    document.querySelectorAll('.imagen-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Encontrar y marcar el item seleccionado
    document.querySelectorAll('.imagen-item').forEach(item => {
        if (item.querySelector('img')?.alt === nombreImagen) {
            item.classList.add('selected');
        }
    });
    
    // Actualizar input oculto
    document.getElementById('imagen').value = nombreImagen;
    imagenSeleccionada = nombreImagen;
    
    // Mostrar preview
    const preview = document.getElementById('previewImg');
    preview.src = urlImagen;
    preview.style.display = 'block';
    
    const nombre = document.getElementById('imagenNombre');
    nombre.textContent = `✅ Seleccionado: ${nombreImagen}`;
    nombre.style.color = '#27ae60';
    
    console.log('✅ Imagen seleccionada:', nombreImagen);
}

function inicializarSelectorImagenes() {
    // Botón de subir imagen
    const btnSubir = document.getElementById('btnSubirImagen');
    const inputFile = document.getElementById('imagenFile');
    
    if (btnSubir && inputFile) {
        btnSubir.addEventListener('click', () => {
            inputFile.click();
        });
        
        inputFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            await subirImagenNueva(file);
            inputFile.value = ''; // Limpiar input
        });
    }
    
    // Cargar imágenes disponibles
    cargarImagenesDisponibles();
}

async function subirImagenNueva(file) {
    try {
        console.log('📤 Subiendo imagen:', file.name);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('nombre', file.name.split('.')[0]); // Nombre sin extensión
        
        const response = await fetch('/api/upload-imagen', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Imagen subida exitosamente:', data.filename);
            mostrarAlerta(`✅ Imagen "${data.filename}" subida correctamente`, 'success');
            
            // Recargar galería y seleccionar imagen
            await cargarImagenesDisponibles();
            seleccionarImagen(data.filename, data.url);
        } else {
            const error = data.error || 'Error desconocido';
            mostrarAlerta(`❌ Error al subir imagen: ${error}`, 'danger');
            console.error('Error:', data);
        }
    } catch (error) {
        mostrarAlerta(`❌ Error al subir imagen: ${error.message}`, 'danger');
        console.error('Error:', error);
    }
}

// =====================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// =====================================
document.addEventListener('DOMContentLoaded', () => {
    initializarDarkMode();
    initializarTabs();
    inicializarSelectorImagenes();
    cargarCategorias();
    cargarProductos();
    cargarUsuarios();
    cargarCompras();
    cargarReclamos();
    configurarFormularioProducto();
});

// =====================================
// SISTEMA DE TABS
// =====================================
function initializarTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            mostrarTab(tabName);
            
            // Actualizar estado activo del botón
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function mostrarTab(tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    const activeTab = document.getElementById(tabName);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

// =====================================
// ALERTAS
// =====================================
function mostrarAlerta(mensaje, tipo = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo}`;
    alert.textContent = mensaje;

    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);

    setTimeout(() => alert.remove(), 3000);
}

// =====================================
// CARGAR CATEGORÍAS
// =====================================
async function cargarCategorias() {
    try {
        console.log('📦 Iniciando carga de categorías...');
        
        const response = await fetch('/api/categorias');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Respuesta del servidor:', data);
        
        categorias = data.categorias || [];
        console.log('📦 Categorías cargadas:', categorias.length, 'items');
        
        renderizarCategorias();
    } catch (error) {
        console.error('❌ Error al cargar categorías:', error);
        mostrarAlerta('⚠️ Error al cargar categorías: ' + error.message, 'danger');
    }
}

function renderizarCategorias() {
    const container = document.getElementById('categoriasContainer');
    if (!container) {
        console.error('❌ Contenedor categoriasContainer no encontrado en el DOM');
        return;
    }
    
    console.log('📦 Renderizando categorías en contenedor...');
    container.innerHTML = '';

    if (categorias.length === 0) {
        console.warn('⚠️ No hay categorías para renderizar');
        container.innerHTML = '<p style="color: #999;">No hay categorías disponibles</p>';
        return;
    }

    categorias.forEach(cat => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = cat.id;
        checkbox.className = 'categoria-checkbox';

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(cat.nombre));
        container.appendChild(label);
    });
    
    console.log('✅ Categorías renderizadas exitosamente');
}

// =====================================
// FORMULARIO AGREGAR PRODUCTO
// =====================================
function configurarFormularioProducto() {
    const form = document.getElementById('productoForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const categoriasSeleccionadas = Array.from(
            document.querySelectorAll('.categoria-checkbox:checked')
        ).map(cb => parseInt(cb.value));

        const producto = {
            nombre: document.getElementById('nombre').value,
            descripcion: document.getElementById('descripcion').value,
            precio: parseFloat(document.getElementById('precio').value),
            stock: parseInt(document.getElementById('stock').value),
            imagen: document.getElementById('imagen').value,
            categorias_ids: categoriasSeleccionadas
        };

        console.log('📦 Enviando producto:', producto);

        try {
            const response = await fetch('/api/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(producto)
            });

            const data = await response.json();
            console.log('📦 Respuesta del servidor:', data);

            if (response.ok) {
                mostrarAlerta('✅ Producto agregado correctamente', 'success');
                form.reset();
                cargarProductos();
            } else {
                const errorMsg = data.error || 'Error desconocido al agregar producto';
                mostrarAlerta(`❌ ${errorMsg}`, 'danger');
                console.error('Error del servidor:', data);
            }
        } catch (error) {
            mostrarAlerta('❌ Error al guardar producto: ' + error.message, 'danger');
            console.error('Excepción:', error);
        }
    });
}

// =====================================
// CARGAR PRODUCTOS
// =====================================
async function cargarProductos() {
    try {
        console.log('📦 Iniciando carga de productos...');
        const response = await fetch('/api/productos');
        const data = await response.json();

        const container = document.getElementById('productosContainer');
        if (!container) return;

        container.innerHTML = '';

        if (!data.productos || data.productos.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; grid-column: 1/-1; color: #999;">No hay productos registrados</div>';
            return;
        }

        console.log(`✅ ${data.productos.length} productos cargados`);

        data.productos.forEach(p => {
            // Obtener nombres de categorías
            const categorias = p.categorias && p.categorias.length > 0 
                ? p.categorias.map(c => c.nombre).join(', ')
                : 'Sin categoría';
            
            const stockClass = p.stock <= 5 ? 'bajo' : '';
            
            const card = `
                <div class="producto-card">
                    <img src="/static/image/${p.imagen}" class="producto-imagen" alt="${p.nombre}" onerror="this.src='/static/image/default.jpg'">
                    <div class="producto-info">
                        <div class="producto-nombre">${p.nombre}</div>
                        <div class="producto-categoria">${categorias}</div>
                        <div class="producto-precio">₡${p.precio.toFixed(2)}</div>
                        <div class="producto-stock ${stockClass}">Stock: ${p.stock} unidades</div>
                        <div class="producto-acciones">
                            <button class="btn btn-info" onclick="editarProducto(${p.id})" title="Editar">✏️ Editar</button>
                            <button class="btn btn-danger" onclick="eliminarProducto(${p.id})" title="Eliminar">🗑️ Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });
    } catch (error) {
        mostrarAlerta('❌ Error al cargar productos', 'danger');
        console.error(error);
    }
}

// =====================================
// EDITAR PRODUCTO
// =====================================
async function editarProducto(id) {
    try {
        const response = await fetch(`/api/productos/${id}`);
        const p = await response.json();

        productoEditando = id;
        
        const modal = document.getElementById('productoModal');
        const form = document.getElementById('productoEditForm');

        document.getElementById('productoId').value = id;
        document.getElementById('editNombre').value = p.nombre;
        document.getElementById('editDescripcion').value = p.descripcion;
        document.getElementById('editPrecio').value = p.precio;
        document.getElementById('editStock').value = p.stock;
        document.getElementById('editImagen').value = p.imagen;

        // Cargar categorías del producto
        const response2 = await fetch(`/api/productos/${id}/categorias`);
        const data = await response2.json();
        const categoriasProducto = data.categorias_ids || [];

        // No hay checkboxes en el modal de edición, pero podrías agregar si quieres

        modal.style.display = 'block';

        // Manejar envío del formulario
        form.onsubmit = async (e) => {
            e.preventDefault();

            const productoActualizado = {
                nombre: document.getElementById('editNombre').value,
                descripcion: document.getElementById('editDescripcion').value,
                precio: parseFloat(document.getElementById('editPrecio').value),
                stock: parseInt(document.getElementById('editStock').value),
                imagen: document.getElementById('editImagen').value,
                categorias_ids: categoriasProducto
            };

            try {
                const resp = await fetch(`/api/productos/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productoActualizado)
                });

                if (resp.ok) {
                    mostrarAlerta('✅ Producto actualizado correctamente', 'success');
                    cerrarModalProducto();
                    cargarProductos();
                } else {
                    mostrarAlerta('❌ Error al actualizar producto', 'danger');
                }
            } catch (error) {
                mostrarAlerta('❌ Error al actualizar producto', 'danger');
                console.error(error);
            }
        };
    } catch (error) {
        mostrarAlerta('❌ Error al cargar producto', 'danger');
        console.error(error);
    }
}

// =====================================
// ELIMINAR PRODUCTO
// =====================================
async function eliminarProducto(id) {
    if (confirm('¿Deseas eliminar este producto? Esta acción no se puede deshacer.')) {
        try {
            const response = await fetch(`/api/productos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                mostrarAlerta('✅ Producto eliminado correctamente', 'success');
                cargarProductos();
            } else {
                mostrarAlerta('❌ Error al eliminar producto', 'danger');
            }
        } catch (error) {
            mostrarAlerta('❌ Error al eliminar producto', 'danger');
            console.error(error);
        }
    }
}

function cerrarModalProducto() {
    const modal = document.getElementById('productoModal');
    modal.style.display = 'none';
}

// =====================================
// CARGAR USUARIOS
// =====================================
async function cargarUsuarios() {
    try {
        console.log('👤 Iniciando carga de usuarios...');
        const response = await fetch('/api/usuarios');
        console.log('👤 Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('👤 Usuarios cargados:', data.usuarios?.length || 0);

        usuariosData = data.usuarios || [];

        const container = document.getElementById('usuariosContainer');
        if (!container) {
            console.error('❌ Element usuariosContainer not found');
            return;
        }

        // Agregar evento de búsqueda
        const searchInput = document.getElementById('buscar-usuario-admin');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const termino = e.target.value.toLowerCase();
                filtrarUsuarios(termino);
            });
        }

        renderizarUsuarios(usuariosData);
        console.log('✅ Usuarios renderizados exitosamente');
    } catch (error) {
        console.error('❌ Error al cargar usuarios:', error);
        const container = document.getElementById('usuariosContainer');
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; grid-column: 1/-1; color: red;">Error: ' + error.message + '</div>';
        }
    }
}

function renderizarUsuarios(usuarios) {
    const container = document.getElementById('usuariosContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!usuarios || usuarios.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; grid-column: 1/-1; color: #999;">No hay usuarios registrados</div>';
        return;
    }

    usuarios.forEach(u => {
        const iniciales = `${u.nombre.charAt(0)}${u.apellido ? u.apellido.charAt(0) : ''}`.toUpperCase();
        const card = `
            <div class="usuario-card">
                <div class="usuario-header">
                    <div class="usuario-avatar">${iniciales}</div>
                    <div class="usuario-info-header">
                        <h3>${u.nombre} ${u.apellido || ''}</h3>
                        <p>ID: ${u.id}</p>
                    </div>
                </div>
                <div class="usuario-detalle">
                    <strong>Email:</strong>
                    <span>${u.email}</span>
                </div>
                <div class="usuario-detalle">
                    <strong>DNI:</strong>
                    <span>${u.dni || 'N/A'}</span>
                </div>
                <div class="usuario-detalle">
                    <strong>Dirección:</strong>
                    <span>${u.direccion || 'N/A'}</span>
                </div>
                <div class="usuario-estado activo">✓ Activo</div>
                <div class="usuario-acciones">
                    <button class="btn btn-info" onclick="verDetallesUsuario(${u.id})" title="Ver">👁️ Ver</button>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

function filtrarUsuarios(termino) {
    if (!termino.trim()) {
        renderizarUsuarios(usuariosData);
        return;
    }

    const usuariosFiltrados = usuariosData.filter(u => 
        u.nombre.toLowerCase().includes(termino) ||
        (u.apellido && u.apellido.toLowerCase().includes(termino)) ||
        u.email.toLowerCase().includes(termino) ||
        (u.dni && u.dni.toLowerCase().includes(termino)) ||
        u.id.toString().includes(termino)
    );

    renderizarUsuarios(usuariosFiltrados);
}

function verDetallesUsuario(id) {
    alert(`Detalles del usuario ${id}. Función en desarrollo.`);
}

// =====================================
// CARGAR COMPRAS/PEDIDOS
// =====================================
async function cargarCompras() {
    try {
        console.log('🛒 Iniciando carga de compras...');
        const response = await fetch('/api/pedidos');
        console.log('🛒 Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🛒 Compras cargadas:', data.pedidos?.length || 0);

        comprasData = data.pedidos || [];

        // Agregar evento de búsqueda
        const searchInput = document.getElementById('buscar-compra-admin');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const termino = e.target.value.toLowerCase();
                filtrarCompras(termino);
            });
        }

        renderizarCompras(comprasData);
        console.log('✅ Compras renderizadas exitosamente');
    } catch (error) {
        console.error('❌ Error al cargar compras:', error);
        const container = document.getElementById('comprasContainer');
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; grid-column: 1/-1; color: red;">Error: ' + error.message + '</div>';
        }
    }
}

function renderizarCompras(compras) {
    const container = document.getElementById('comprasContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!compras || compras.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; grid-column: 1/-1; color: #999;">No hay compras registradas</div>';
        return;
    }

    compras.forEach(p => {
        const fecha = new Date(p.fecha).toLocaleDateString('es-ES');
        const estado = p.estado || 'Completado';
        
        const card = `
            <div class="compra-card">
                <div class="compra-numero">Pedido #${p.id}</div>
                <div class="compra-cliente">${p.usuario_nombre || 'Usuario ' + p.usuario_id}</div>
                <div class="compra-detalles">
                    <strong>Fecha:</strong>
                    <span>${fecha}</span>
                </div>
                <div class="compra-detalles">
                    <strong>Usuario ID:</strong>
                    <span>#${p.usuario_id}</span>
                </div>
                <div class="compra-total">₡${p.total.toFixed(2)}</div>
                <div class="compra-estado">${estado}</div>
                <div class="compra-acciones">
                    <button class="btn btn-info" onclick="verDetallesCompra(${p.id})" title="Ver">👁️ Ver Detalles</button>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

function filtrarCompras(termino) {
    if (!termino.trim()) {
        renderizarCompras(comprasData);
        return;
    }

    const comprasFiltradas = comprasData.filter(p => {
        const fecha = new Date(p.fecha).toLocaleDateString('es-ES');
        return (
            p.usuario_nombre?.toLowerCase().includes(termino) ||
            p.usuario_id.toString().includes(termino) ||
            p.id.toString().includes(termino) ||
            fecha.includes(termino) ||
            p.total.toString().includes(termino)
        );
    });

    renderizarCompras(comprasFiltradas);
}

function verDetallesCompra(id) {
    const modal = document.getElementById('compraModal');
    modal.style.display = 'block';

    fetch(`/api/pedidos/${id}`)
        .then(res => res.json())
        .then(p => {
            const details = document.getElementById('compraDetails');
            const fecha = new Date(p.fecha).toLocaleDateString('es-ES');
            
            details.innerHTML = `
                <p><strong>ID Pedido:</strong> ${p.id}</p>
                <p><strong>Usuario:</strong> ${p.usuario_nombre || 'Usuario ' + p.usuario_id}</p>
                <p><strong>Total:</strong> ₡${p.total.toFixed(2)}</p>
                <p><strong>Estado:</strong> ${p.estado || 'Pendiente'}</p>
                <p><strong>Fecha:</strong> ${fecha}</p>
                <h4>Artículos:</h4>
                <ul id="itemsList"></ul>
            `;

            // Cargar items del pedido
            fetch(`/api/pedidos/${id}/items`)
                .then(res => res.json())
                .then(data => {
                    const itemsList = document.getElementById('itemsList');
                    if (data.items && data.items.length > 0) {
                        data.items.forEach(item => {
                            const li = document.createElement('li');
                            li.textContent = `${item.producto_nombre} - Cantidad: ${item.cantidad} - Precio: ₡${item.precio_unitario.toFixed(2)}`;
                            itemsList.appendChild(li);
                        });
                    }
                })
                .catch(err => console.error('Error al cargar items:', err));
        })
        .catch(err => console.error('Error al cargar compra:', err));
}

function cerrarModalCompra() {
    const modal = document.getElementById('compraModal');
    modal.style.display = 'none';
}

// =====================================
// CARGAR RECLAMOS
// =====================================
async function cargarReclamos() {
    try {
        console.log('📋 Iniciando carga de reclamos...');
        const response = await fetch('/api/reclamos');
        console.log('📋 Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📋 Reclamos cargados:', data.reclamos?.length || 0);

        reclamosData = data.reclamos || [];

        // Agregar evento de búsqueda
        const searchInput = document.getElementById('buscar-reclamo-admin');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const termino = e.target.value.toLowerCase();
                filtrarReclamos(termino);
            });
        }

        renderizarReclamos(reclamosData);
        console.log('✅ Reclamos renderizados exitosamente');
    } catch (error) {
        console.error('❌ Error al cargar reclamos:', error);
        const container = document.getElementById('reclamosContainer');
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; grid-column: 1/-1; color: red;">Error: ' + error.message + '</div>';
        }
    }
}

function renderizarReclamos(reclamos) {
    const container = document.getElementById('reclamosContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!reclamos || reclamos.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; grid-column: 1/-1; color: #999;">No hay reclamos registrados</div>';
        return;
    }

    reclamos.forEach(r => {
        const fecha = new Date(r.fecha).toLocaleDateString('es-ES');
        const tipoClass = r.tipo === 'reclamo' ? 'reclamo' : 'sugerencia';
        const tipoTexto = r.tipo === 'reclamo' ? 'Reclamo' : 'Sugerencia';
        
        const card = `
            <div class="reclamo-card">
                <div class="reclamo-header">
                    <div class="reclamo-id">ID: #${r.id}</div>
                    <div class="reclamo-tipo ${tipoClass}">${tipoTexto}</div>
                </div>
                <div class="reclamo-usuario">${r.usuario_nombre || 'Usuario ' + r.usuario_id}</div>
                <div class="reclamo-mensaje">${r.descripcion}</div>
                <div class="reclamo-fecha">📅 ${fecha}</div>
                <div class="reclamo-acciones">
                    <button class="btn btn-danger" onclick="eliminarReclamo(${r.id})" title="Eliminar">🗑️ Eliminar</button>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

function filtrarReclamos(termino) {
    if (!termino.trim()) {
        renderizarReclamos(reclamosData);
        return;
    }

    const reclamosFiltrados = reclamosData.filter(r => {
        const fecha = new Date(r.fecha).toLocaleDateString('es-ES');
        return (
            r.usuario_nombre?.toLowerCase().includes(termino) ||
            r.usuario_id.toString().includes(termino) ||
            r.descripcion.toLowerCase().includes(termino) ||
            r.tipo.toLowerCase().includes(termino) ||
            fecha.includes(termino) ||
            r.id.toString().includes(termino)
        );
    });

    renderizarReclamos(reclamosFiltrados);
}

function eliminarReclamo(id) {
    if (confirm('¿Deseas eliminar este reclamo?')) {
        fetch(`/api/reclamos/${id}`, {
            method: 'DELETE'
        })
            .then(res => {
                if (res.ok) {
                    mostrarAlerta('✅ Reclamo eliminado correctamente', 'success');
                    cargarReclamos();
                } else {
                    mostrarAlerta('❌ Error al eliminar reclamo', 'danger');
                }
            })
            .catch(err => {
                mostrarAlerta('❌ Error al eliminar reclamo', 'danger');
                console.error(err);
            });
    }
}

// =====================================
// CERRAR MODALES
// =====================================
window.onclick = (event) => {
    const productoModal = document.getElementById('productoModal');
    const compraModal = document.getElementById('compraModal');

    if (event.target === productoModal) {
        cerrarModalProducto();
    }
    if (event.target === compraModal) {
        cerrarModalCompra();
    }
};