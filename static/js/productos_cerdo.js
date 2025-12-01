/* ============================================
   PRODUCTOS DE CERDO
   Carga dinámica de productos de carne de cerdo
   ============================================ */

// Cargar productos categoría 2 (Cerdo)

let intervalo_refresh = null;
let productos_cache = [];

async function cargarProductos() {
    try {
        const response = await fetch('/api/productos/categoria/2');
        const data = await response.json();

        if (data.success && data.productos.length > 0) {
            // Verificar si hay cambios
            const productosString = JSON.stringify(data.productos);
            if (productosString !== JSON.stringify(productos_cache)) {
                productos_cache = data.productos;
                mostrarProductos(data.productos);
            }
        } else {
            document.getElementById('productos-container').innerHTML =
                '<div class="col-span-full text-center py-8"><p class="text-gray-600">No hay productos disponibles en esta categoría</p></div>';
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function mostrarProductos(productos) {
    const html = productos.map(prod => `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden product-card">
            <img src="/static/image/${prod.imagen}"
                 alt="${prod.nombre}"
                 class="w-full h-56 object-cover">

            <div class="p-5 text-center">
                <h3 class="text-xl font-bold text-gray-800 mb-2">${prod.nombre}</h3>
                <p class="text-sm text-gray-600 mb-2 h-12 overflow-hidden">
                    ${prod.descripcion || 'Producto de calidad'}
                </p>

                <p class="text-2xl font-extrabold text-pink-600 mb-2">
                    S/. ${parseFloat(prod.precio).toFixed(2)}
                </p>

                <p class="text-xs text-gray-500 mb-3">Stock: ${prod.stock} unidades</p>

                <button data-id="${prod.id}"
                        data-nombre="${prod.nombre}"
                        data-precio="${prod.precio}"
                        data-imagen="/static/image/${prod.imagen}"
                        class="agregar-carrito">
                    Agregar
                </button>
            </div>
        </div>
    `).join('');

    document.getElementById('productos-container').innerHTML = html;
    asignarListenersCarrito();
    animacionesEntrada();
}

// Botones animados
function asignarListenersCarrito() {
    document.querySelectorAll(".agregar-carrito").forEach(btn => {
        btn.addEventListener("click", () => {
            const item = {
                id: btn.dataset.id,
                nombre: btn.dataset.nombre,
                precio: parseFloat(btn.dataset.precio),
                imagen: btn.dataset.imagen,
                cantidad: 1
            };

            let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
            const existe = carrito.find(p => p.id === item.id);

            if (existe) {
                existe.cantidad += 1;
            } else {
                carrito.push(item);
            }

            localStorage.setItem('carrito', JSON.stringify(carrito));
            alert(`🐷 ${item.nombre} agregado al carrito`);
        });
    });
}

// Animación de entrada
function animacionesEntrada() {
    const cards = document.querySelectorAll(".product-card");
    cards.forEach((card, index) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(30px)";
        setTimeout(() => {
            card.style.transition = "all 0.6s ease";
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
        }, 200 * index);
    });
}

// Auto-refresh cada 10 segundos
function iniciarAutoRefresh() {
    intervalo_refresh = setInterval(cargarProductos, 10000);
}

function detenerAutoRefresh() {
    if (intervalo_refresh) {
        clearInterval(intervalo_refresh);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    iniciarAutoRefresh();
});

window.addEventListener('beforeunload', detenerAutoRefresh);
