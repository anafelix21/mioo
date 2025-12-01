/* ============================================
   CLASE CARRITO
   Gestión del carrito de compras y localStorage
   ============================================ */

class Carrito {
    constructor() {
        // Recuperar items del localStorage o iniciar vacío
        this.items = JSON.parse(localStorage.getItem('carrito')) || [];
        this.actualizarContador();
        this.actualizarCarritoLateral();
        this.inicializarEventos();
        
        // Asegurarse de que el carrito lateral esté oculto inicialmente
        const sidebar = document.getElementById("sidebar-carrito");
        if (sidebar) {
            sidebar.classList.add("translate-x-full");
        }
    }

    // Escucha clicks en botones con la clase .agregar-carrito y toma los datos desde data-attributes
    inicializarEventos() {
        document.addEventListener('click', (e) => {
            const boton = e.target.closest('.agregar-carrito');
            if (!boton) return;
            e.preventDefault();
            console.debug('[carrito] boton agregar clic:', boton.dataset);
            // Normalizar y limpiar valores por si el HTML tiene comillas extra o espacios
            const rawId = boton.dataset.id || '';
            const rawNombre = boton.dataset.nombre || '';
            const rawPrecio = boton.dataset.precio || '';
            const rawImagen = boton.dataset.imagen || '';

            // quitar comillas extras y caracteres raros
            const id = String(rawId).replace(/"+/g, '').trim();
            const nombre = String(rawNombre).replace(/"+/g, '').trim();
            const precio = parseFloat(String(rawPrecio).replace(/[^0-9,.-]/g, '').replace(',', '.'));
            const imagen = String(rawImagen).trim();
            // cantidad puede venir por data-cantidad o por un input .producto-cantidad dentro del mismo card
            let cantidad = 1;
            if (boton.dataset.cantidad) {
                cantidad = parseInt(boton.dataset.cantidad);
            } else {
                const card = boton.closest('[class*="bg-"]') || boton.closest('div');
                if (card) {
                    const inputQty = card.querySelector('.producto-cantidad');
                    if (inputQty) cantidad = parseInt(inputQty.value) || 1;
                }
            }
            if (!id || !nombre || isNaN(precio) || isNaN(cantidad)) {
                console.warn('[carrito] datos inválidos al intentar agregar:', {id, nombre, precio, cantidad, imagen, dataset: boton.dataset});
                return;
            }

            console.info('[carrito] agregando producto:', {id, nombre, precio, cantidad});
            this.agregarProducto(id, nombre, precio, imagen, cantidad);
        });
    }

    toggleCarrito() {
        const sidebar = document.getElementById("sidebar-carrito");
        if (sidebar) {
            sidebar.classList.toggle("translate-x-full");
            this.actualizarCarritoLateral();
        }
    }

    agregarProducto(id, nombre, precio, imagen, cantidad = 1) {
        const producto = {
            id: id,
            nombre: nombre,
            precio: parseFloat(precio),
            imagen: imagen,
            cantidad: parseInt(cantidad) || 1
        };

        const existente = this.items.find(item => item.id === id);
        
        if (existente) {
            existente.cantidad += producto.cantidad;
        } else {
            this.items.push(producto);
        }

        this.guardarCarrito();
        this.actualizarCarritoLateral();
        this.mostrarMensaje(`¡${nombre} agregado al carrito!`);
        console.debug('[carrito] items ahora:', this.items);
        // Abrir sidebar automáticamente si está cerrado para que el usuario vea el cambio
        try {
            const sidebar = document.getElementById('sidebar-carrito');
            if (sidebar && sidebar.classList.contains('translate-x-full')) {
                this.toggleCarrito();
            }
        } catch (err) {
            console.warn('[carrito] no se pudo abrir sidebar automáticamente:', err);
        }
    }

    actualizarCantidad(id, nuevaCantidad) {
        const producto = this.items.find(item => (item.id === id) || (item.nombre === id));
        if (producto) {
            producto.cantidad = parseInt(nuevaCantidad);
            if (producto.cantidad <= 0) {
                this.eliminarProducto(id);
            } else {
                this.guardarCarrito();
                this.actualizarCarritoLateral();
            }
        }
    }

    incrementarCantidad(id) {
        const producto = this.items.find(item => item.id === id);
        if (producto) {
            producto.cantidad += 1;
            this.guardarCarrito();
            this.actualizarCarritoLateral();
        }
    }

    decrementarCantidad(id) {
        const producto = this.items.find(item => item.id === id);
        if (producto && producto.cantidad > 1) {
            producto.cantidad -= 1;
            this.guardarCarrito();
            this.actualizarCarritoLateral();
        }
    }

    limpiarCarrito() {
        if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
            this.items = [];
            this.guardarCarrito();
            this.actualizarCarritoLateral();
            this.mostrarMensaje('Carrito vaciado');
        }
    }

    eliminarProducto(id) {
        // Acepta tanto id (identificador) como nombre para compatibilidad con items anteriores
        this.items = this.items.filter(item => { 
            if (!item) return false;
            const itemId = item.id || '';
            const itemNombre = item.nombre || '';
            return (itemId !== id) && (itemNombre !== id);
        });
    this.guardarCarrito();
    this.actualizarCarritoLateral();
    }

    guardarCarrito() {
        localStorage.setItem('carrito', JSON.stringify(this.items));
        this.actualizarContador();
    }

    actualizarContador() {
        const contador = document.getElementById('contador-carrito');
        if (contador) {
            const total = this.items.reduce((sum, item) => sum + item.cantidad, 0);
            contador.textContent = total.toString();
        }
    }

    actualizarCarritoLateral() {
        const lista = document.getElementById("carrito-lista");
        if (lista) {
            if (!this.items || this.items.length === 0) {
                lista.innerHTML = '<p class="text-gray-500 dark:text-gray-400 p-4 text-center">El carrito está vacío.</p>';
            } else {
                let html = '';
                let total = 0;

                this.items.forEach((item) => {
                    const subtotal = item.precio * item.cantidad;
                    total += subtotal;

                    html += `
                    <div class="flex items-center gap-4 py-4 border-b dark:border-gray-700 cart-item hover:bg-gray-50 dark:hover:bg-gray-700 px-3 rounded transition">
                        <img src="${item.imagen}" alt="${item.nombre}" class="w-16 h-16 object-cover rounded-lg shadow">
                        <div class="flex-grow">
                            <h3 class="font-semibold text-gray-800 dark:text-white">${item.nombre}</h3>
                            <div class="flex items-center gap-2 mt-2">
                                <button onclick="carrito.decrementarCantidad('${item.id}')" class="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                                    </svg>
                                </button>
                                <input type="number" 
                                       value="${item.cantidad}" 
                                       min="1" 
                                       class="w-12 text-center border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded cantidad-input"
                                       onchange="carrito.actualizarCantidad('${item.id}', this.value)">
                                <button onclick="carrito.incrementarCantidad('${item.id}')" class="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                </button>
                                <span class="text-gray-600 dark:text-gray-300 text-sm ml-2">S/. ${item.precio.toFixed(2)}</span>
                            </div>
                            <p class="font-bold text-red-600 dark:text-red-400 mt-1">S/. ${subtotal.toFixed(2)}</p>
                        </div>
                        <button onclick="carrito.eliminarProducto('${item.id}')"
                                class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 rounded transition btn-carrito">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>`;
                });

                html += `
                <div class="mt-4 border-t dark:border-gray-700 pt-4 bg-gray-50 dark:bg-gray-700 dark:bg-opacity-50 -mx-6 -mb-6 px-6 py-4 rounded-b">
                    <div class="flex justify-between font-bold text-lg">
                        <span class="text-gray-800 dark:text-white">Total:</span>
                        <span class="text-red-600 dark:text-red-400">S/. ${total.toFixed(2)}</span>
                    </div>
                </div>`;

                lista.innerHTML = html;
            }
        }
        this.actualizarResumenPrincipal();
    }

    actualizarResumenPrincipal() {
        const subtotalEl = document.getElementById('subtotal');
        const totalEl = document.getElementById('total');
        const carritoDetalladoEl = document.getElementById('carrito-detallado');
        const carritoVacioEl = document.getElementById('carrito-vacio');

        if (!this.items || this.items.length === 0) {
            if (carritoDetalladoEl) carritoDetalladoEl.innerHTML = '';
            if (carritoVacioEl) carritoVacioEl.classList.remove('hidden');
            if (subtotalEl) subtotalEl.textContent = 'S/. 0.00';
            if (totalEl) totalEl.textContent = 'S/. 0.00';
            return;
        }

        if (carritoVacioEl) carritoVacioEl.classList.add('hidden');

        let total = 0;
        let html = '';

        this.items.forEach(item => {
            const subtotal = item.precio * item.cantidad;
            total += subtotal;

            html += `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:shadow-lg border border-gray-100 dark:border-gray-700 p-6 cart-item transition-all hover:shadow-lg dark:hover:shadow-xl">
                <div class="flex gap-6">
                    <img src="${item.imagen}" alt="${item.nombre}" class="w-24 h-24 object-cover rounded-lg">
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2">${item.nombre}</h3>
                        <p class="text-gray-600 dark:text-gray-300 text-sm mb-4">Precio unitario: <span class="font-semibold text-red-600 dark:text-red-400">S/. ${item.precio.toFixed(2)}</span></p>
                        <div class="flex items-center gap-2">
                            <button onclick="carrito.decrementarCantidad('${item.id}')" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition btn-carrito">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                                </svg>
                            </button>
                            <input type="number" 
                                   value="${item.cantidad}" 
                                   min="1" 
                                   class="w-16 text-center border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg font-semibold cantidad-input"
                                   onchange="carrito.actualizarCantidad('${item.id}', this.value)">
                            <button onclick="carrito.incrementarCantidad('${item.id}')" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition btn-carrito">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">S/. ${subtotal.toFixed(2)}</p>
                        <button onclick="carrito.eliminarProducto('${item.id}')\" 
                                class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-3 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 rounded-lg transition btn-carrito">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>`;
        });

        if (carritoDetalladoEl) carritoDetalladoEl.innerHTML = html;
        if (subtotalEl) subtotalEl.textContent = `S/. ${total.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `S/. ${total.toFixed(2)}`;
    }

    mostrarMensaje(mensaje) {
        const div = document.createElement('div');
        div.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-500';
        div.textContent = mensaje;
        document.body.appendChild(div);
        
        setTimeout(() => {
            div.style.opacity = '0';
            setTimeout(() => div.remove(), 500);
        }, 2000);
    }
}

// Inicializar carrito y exponerlo en window para que otros scripts puedan acceder
window.carrito = new Carrito();

// Función para toggle del sidebar (debe estar fuera de la clase para ser accesible globalmente)
function toggleCarrito() {
    if (window.carrito) window.carrito.toggleCarrito();
}
