/* ============================================
   CLASE CARRITO DETALLADO
   Vista detallada del carrito de compras
   ============================================ */

class CarritoDetallado {
    constructor() {
        this.carritoBase = window.carrito;
        this.actualizarCarritoDetallado();
        // Escuchar cambios en el carrito base
        document.addEventListener('carritoActualizado', () => {
            this.actualizarCarritoDetallado();
        });
    }

    actualizarCarritoDetallado() {
        const carritoDetallado = document.getElementById('carrito-detallado');
        const carritoVacio = document.getElementById('carrito-vacio');
        const items = this.carritoBase.items;
        
        if (!carritoDetallado) return;

        if (items.length === 0) {
            if (carritoDetallado) carritoDetallado.innerHTML = '';
            if (carritoVacio) carritoVacio.classList.remove('hidden');
            document.getElementById('btn-proceder-pago').disabled = true;
            this.actualizarResumen(0);
            return;
        }

        if (carritoVacio) carritoVacio.classList.add('hidden');

        let html = '';
        let subtotal = 0;

        items.forEach(item => {
            const itemSubtotal = item.precio * item.cantidad;
            subtotal += itemSubtotal;

            html += `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:shadow-lg border border-gray-100 dark:border-gray-700 p-6 cart-item transition-all hover:shadow-lg dark:hover:shadow-xl">
                <div class="flex gap-6">
                    <img src="${item.imagen}" 
                         alt="${item.nombre}" 
                         class="w-24 h-24 object-cover rounded-lg">
                    
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white">${item.nombre}</h3>
                        <p class="text-gray-600 dark:text-gray-300 text-sm mb-2">Precio unitario: <span class="font-semibold text-red-600 dark:text-red-400">S/. ${item.precio.toFixed(2)}</span></p>
                        <p class="font-semibold text-green-600 dark:text-green-400">Subtotal: S/. ${itemSubtotal.toFixed(2)}</p>
                        <div class="flex items-center gap-2 mt-4">
                            <button onclick="carritoDetallado.decrementarCantidad('${item.id}')" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition btn-carrito">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                                </svg>
                            </button>
                            <input type="number" 
                                   value="${item.cantidad}" 
                                   min="1" 
                                   class="w-16 text-center border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 font-semibold cantidad-input"
                                   onchange="carritoDetallado.actualizarCantidad('${item.id}', this.value)">
                            <button onclick="carritoDetallado.incrementarCantidad('${item.id}')" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition btn-carrito">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="text-right">
                        <button onclick="carritoDetallado.eliminarProducto('${item.id}')"
                                class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-3 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 rounded-lg transition btn-carrito">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>`;
        });

        carritoDetallado.innerHTML = html;
        this.actualizarResumen(subtotal);
        document.getElementById('btn-proceder-pago').disabled = false;
    }

    actualizarCantidad(id, nuevaCantidad) {
        this.carritoBase.actualizarCantidad(id, nuevaCantidad);
        this.actualizarCarritoDetallado();
    }

    incrementarCantidad(id) {
        this.carritoBase.incrementarCantidad(id);
        this.actualizarCarritoDetallado();
    }

    decrementarCantidad(id) {
        this.carritoBase.decrementarCantidad(id);
        this.actualizarCarritoDetallado();
    }

    eliminarProducto(id) {
        this.carritoBase.eliminarProducto(id);
        this.actualizarCarritoDetallado();
    }

    actualizarResumen(subtotal) {
        const igv = 0; // IGV eliminado
        const total = subtotal + igv;

        const elSubtotal = document.getElementById('subtotal');
        const elTotal = document.getElementById('total');
        if (elSubtotal) elSubtotal.textContent = `S/. ${subtotal.toFixed(2)}`;
        if (elTotal) elTotal.textContent = `S/. ${total.toFixed(2)}`;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.carritoDetallado = new CarritoDetallado();
});