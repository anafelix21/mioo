/* ============================================
   CATEGORÍA: LIMPIEZA
   Carga dinámica de productos de limpieza
   ============================================ */

// Cargar productos de categoría 7 (Limpieza y Mantenimiento)
async function cargarProductos() {
    try {
        const response = await fetch('/api/productos/categoria/7');
        const data = await response.json();

        const contenedor = document.getElementById('productos-container');

        if (data.success && data.productos.length > 0) {
            const html = data.productos.map(prod => `
                <div class="product-card">
                    <img src="/static/image/${prod.imagen}" 
                         alt="${prod.nombre}"
                         class="product-img"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23ddd%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2224%22%3EImagen no disponible%3C/text%3E%3C/svg%3E'">

                    <div class="product-info">
                        <h3>${prod.nombre}</h3>
                        <p class="descripcion">${prod.descripcion || "Producto de calidad"}</p>
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
            `).join('');

            contenedor.innerHTML = html;
            asignarListenersCarrito();

        } else {
            contenedor.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <p class="text-gray-600">No hay productos disponibles en esta categoría</p>
                </div>`;
        }

    } catch (error) {
        console.error("Error:", error);
        document.getElementById('productos-container').innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-red-600">Error al cargar productos</p>
            </div>`;
    }
}


// Agregar productos al carrito
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

            let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
            const existe = carrito.find(p => p.id === item.id);

            if (existe) {
                existe.cantidad++;
            } else {
                carrito.push(item);
            }

            localStorage.setItem("carrito", JSON.stringify(carrito));
            alert(`✅ ${item.nombre} agregado al carrito`);
        });
    });
}


// Cargar al iniciar
document.addEventListener("DOMContentLoaded", cargarProductos);
