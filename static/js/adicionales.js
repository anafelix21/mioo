/* ============================================
   CATEGORÍA: ADICIONALES
   Carga dinámica de productos complementarios
   ============================================ */

// Cargar productos de categoría 9 (Equipos Adicionales)
async function cargarProductos() {
    try {
        const response = await fetch('/api/productos/categoria/9');
        const data = await response.json();

        const contenedor = document.getElementById('productos-container');

        if (!data.success || data.productos.length === 0) {
            contenedor.innerHTML = `
                <div class="text-center col-span-full py-8">
                    <p class="no-productos">No hay productos disponibles en esta categoría</p>
                </div>`;
            return;
        }

        contenedor.innerHTML = data.productos.map(prod => `
            <div class="product-card">
                
                <img src="/static/image/${prod.imagen}"
                     alt="${prod.nombre}"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23ddd%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2224%22%3EImagen no disponible%3C/text%3E%3C/svg%3E'">

                <div class="product-info">
                    <h3>${prod.nombre}</h3>
                    <p>${prod.descripcion || "Producto de calidad"}</p>
                    <div class="product-price">S/. ${parseFloat(prod.precio).toFixed(2)}</div>
                    <div class="product-stock">Stock: ${prod.stock} unidades</div>

                    <button class="btn-carrito"
                            data-id="${prod.id}"
                            data-nombre="${prod.nombre}"
                            data-precio="${prod.precio}"
                            data-imagen="/static/image/${prod.imagen}">
                        Agregar al carrito
                    </button>
                </div>

            </div>
        `).join('');

        // Después de renderizar, ajustar imágenes problemáticas
        function adjustProductImages() {
            const imgs = contenedor.querySelectorAll('.product-card img');
            imgs.forEach(img => {
                // Forzamos la clase que muestra la imagen completa (contain)
                // Esto evita que imágenes panorámicas se recorten y aparezcan "muy grandes".
                img.classList.add('img-fit-contain');
                // Asegurar que listeners de carga mantengan la clase si la imagen se recarga
                if (!img.complete) {
                    img.addEventListener('load', () => img.classList.add('img-fit-contain'));
                    img.addEventListener('error', () => img.classList.add('img-fit-contain'));
                }
            });
        }

        // Ejecutar ajuste y re-ejecutar tras pequeña espera por si hay imágenes en lazy-load
        adjustProductImages();
        setTimeout(adjustProductImages, 500);

        asignarListenersCarrito();

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('productos-container').innerHTML =
            "<p class='text-center text-red-600 py-8'>Error al cargar productos</p>";
    }
}

// Eventos "Agregar al carrito"
function asignarListenersCarrito() {
    document.querySelectorAll('.btn-carrito').forEach(btn => {
        btn.addEventListener('click', () => {
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
                existe.cantidad += 1;
            } else {
                carrito.push(item);
            }

            localStorage.setItem("carrito", JSON.stringify(carrito));
            alert(`✅ ${item.nombre} agregado al carrito`);
        });
    });
}

// Cargar al iniciar
document.addEventListener('DOMContentLoaded', cargarProductos);