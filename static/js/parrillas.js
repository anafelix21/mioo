/* ============================================
   CATEGORÍA: PARRILLAS
   Carga dinámica de parrillas y soportes
   ============================================ */

// Cargar productos de categoría 6 (Parrillas y Soportes)
async function cargarProductos() {
    try {
        const response = await fetch('/api/productos/categoria/6');
        const data = await response.json();
        
        if (data.success && data.productos.length > 0) {
            const html = data.productos.map(prod => `
                <div class="product-card bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl">
                    <img src="/static/image/${prod.imagen}" 
                        alt="${prod.nombre}" 
                        class="w-full h-56 object-cover"
                        onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23ddd%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2224%22%3EImagen no disponible%3C/text%3E%3C/svg%3E'">
                    
                    <div class="p-5 text-center">
                        <h3 class="text-xl font-bold text-gray-800 mb-2">${prod.nombre}</h3>
                        <p class="text-sm text-gray-600 mb-2 h-12 overflow-hidden">
                            ${prod.descripcion || 'Producto de calidad'}
                        </p>
                        <p class="text-2xl font-extrabold text-pink-600 mb-2">
                            S/. ${parseFloat(prod.precio).toFixed(2)}
                        </p>
                        <p class="text-xs text-gray-500 mb-3">Stock: ${prod.stock} unidades</p>

                        <button 
                            data-id="${prod.id}"
                            data-nombre="${prod.nombre}"
                            data-precio="${prod.precio}"
                            data-imagen="/static/image/${prod.imagen}"
                            class="agregar-carrito bg-pink-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:bg-pink-700 transition duration-300 transform hover:scale-105">
                            Agregar al carrito
                        </button>
                    </div>
                </div>
            `).join('');

            document.getElementById('productos-container').innerHTML = html;
            asignarListenersCarrito();
        } else {
            document.getElementById('productos-container').innerHTML =
                '<div class="col-span-full text-center py-8"><p class="text-gray-600">No hay productos disponibles en esta categoría</p></div>';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('productos-container').innerHTML =
            '<div class="col-span-full text-center py-8"><p class="text-red-600">Error al cargar productos</p></div>';
    }
}

// Agregar al carrito
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
                existe.cantidad += 1;
            } else {
                carrito.push(item);
            }

            localStorage.setItem('carrito', JSON.stringify(carrito));
            alert(`✅ ${item.nombre} agregado al carrito`);
        });
    });
}

// Cargar al iniciar
document.addEventListener('DOMContentLoaded', cargarProductos);