/* ============================================
   PRODUCTOS DINÁMICOS
   Carga y gestión de productos desde API
   ============================================ */

// ===== VARIABLES =====
let productos_original = [];
let productos_filtrados = [];
let categorias_lista = [];
let intervalo_refresh = null;

// ===== CARGAR CATEGORÍAS =====
async function cargarCategorias() {
    try {
        const response = await fetch('/api/categorias');
        const data = await response.json();

        if (data.success) {
            categorias_lista = data.categorias;

            const select = document.getElementById('filter-categoria');

            categorias_lista.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nombre;
                select.appendChild(option);
            });
        }

    } catch (error) {
        console.error("Error al cargar categorías:", error);
    }
}

// ===== CARGAR PRODUCTOS =====
async function cargarProductos() {
    try {
        const response = await fetch('/api/productos');
        const data = await response.json();

        if (data.success) {
            productos_original = data.productos;
            productos_filtrados = [...productos_original];
            mostrarProductos();
        }

    } catch (error) {
        mostrarError("Error al cargar los productos");
        console.error(error);
    }
}

// ===== MOSTRAR PRODUCTOS =====
function mostrarProductos() {
    const container = document.getElementById('productos-container');

    if (productos_filtrados.length === 0) {
        container.innerHTML = `<div class="loading">No hay productos disponibles</div>`;
        return;
    }

    container.innerHTML = productos_filtrados.map(prod => `
        <div class="card">
            <img src="/static/image/${prod.imagen}"
                 alt="${prod.nombre}"
                 onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'">

            <div class="card-body">
                <h3>${prod.nombre}</h3>
                <p>${prod.descripcion || "Producto de calidad"}</p>
                <p class="precio">S/. ${parseFloat(prod.precio).toFixed(2)}</p>
                <p class="stock">Stock: ${prod.stock} unidades</p>

                <button class="agregar-carrito"
                        data-id="${prod.id}"
                        data-nombre="${prod.nombre}"
                        data-precio="${prod.precio}"
                        data-imagen="/static/image/${prod.imagen}">
                    Agregar al carrito
                </button>
            </div>
        </div>
    `).join("");

    asignarListenersCarrito();
}

// ===== FILTRAR =====
document.addEventListener('DOMContentLoaded', () => {
    const filterCategoria = document.getElementById('filter-categoria');
    if (filterCategoria) {
        filterCategoria.addEventListener('change', function () {
            const categoriaId = this.value;

            productos_filtrados = categoriaId === ""
                ? [...productos_original]
                : productos_original.filter(p => 
                    p.categorias && p.categorias.some(c => c.id == categoriaId)
                  );

            ordenar();
        });
    }
});

// ===== ORDENAR =====
document.addEventListener('DOMContentLoaded', () => {
    const sortPrecio = document.getElementById('sort-precio');
    if (sortPrecio) {
        sortPrecio.addEventListener('change', ordenar);
    }
});

function ordenar() {
    const sortElement = document.getElementById('sort-precio');
    const orden = sortElement ? sortElement.value : 'default';

    const arr = [...productos_filtrados];

    switch (orden) {
        case "precio-asc":
            arr.sort((a, b) => a.precio - b.precio);
            break;
        case "precio-desc":
            arr.sort((a, b) => b.precio - a.precio);
            break;
        default:
            arr.sort((a, b) => a.id - b.id);
    }

    productos_filtrados = arr;
    mostrarProductos();
}

// ===== AÑADIR AL CARRITO =====
function asignarListenersCarrito() {
    document.querySelectorAll('.agregar-carrito').forEach(btn => {
        btn.addEventListener('click', function () {

            const item = {
                id: this.dataset.id,
                nombre: this.dataset.nombre,
                precio: parseFloat(this.dataset.precio),
                imagen: this.dataset.imagen,
                cantidad: 1
            };

            let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

            const existe = carrito.find(p => p.id === item.id);

            if (existe) {
                existe.cantidad++;
            } else {
                carrito.push(item);
            }

            localStorage.setItem('carrito', JSON.stringify(carrito));
            alert(`✅ ${item.nombre} agregado al carrito`);
        });
    });
}

// ===== AUTO-ACTUALIZACIÓN EN TIEMPO REAL =====
function iniciarAutoRefresh() {
    // Actualizar productos cada 10 segundos automáticamente
    intervalo_refresh = setInterval(async () => {
        try {
            const response = await fetch('/api/productos');
            const data = await response.json();

            if (data.success) {
                const nuevos_productos = data.productos;
                
                // Verificar si hay cambios (nuevos productos o actualizaciones)
                if (JSON.stringify(nuevos_productos) !== JSON.stringify(productos_original)) {
                    console.log('📡 Actualizando productos en tiempo real...');
                    productos_original = nuevos_productos;
                    
                    // Mantener filtro actual
                    const categoriaId = document.getElementById('filter-categoria').value;
                    productos_filtrados = categoriaId === ""
                        ? [...productos_original]
                        : productos_original.filter(p => 
                            p.categorias && p.categorias.some(c => c.id == categoriaId)
                          );
                    
                    mostrarProductos();
                }
            }
        } catch (error) {
            console.error('Error al auto-actualizar productos:', error);
        }
    }, 10000); // Cada 10 segundos
}

function detenerAutoRefresh() {
    if (intervalo_refresh) {
        clearInterval(intervalo_refresh);
        intervalo_refresh = null;
    }
}

// ===== ERROR =====
function mostrarError(msg) {
    document.getElementById('productos-container').innerHTML =
        `<div class="error">${msg}</div>`;
}

// ===== CARGAR DATOS INICIALES =====
document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    cargarProductos();
    iniciarAutoRefresh(); // Iniciar auto-actualización
});

// Detener auto-refresh si el usuario abandona la página
window.addEventListener('beforeunload', detenerAutoRefresh);