document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================
    // 1. CARRUSEL
    // ==========================================================
    const track = document.querySelector('.carousel-track');
    const slides = track ? Array.from(track.children) : [];
    const carousel = document.getElementById('carousel');

    if (carousel && slides.length > 0) {
        let currentIndex = 0;
        let autoSlide;
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');
        const indicatorsContainer = document.getElementById('carousel-indicators');

        slides.forEach((_, idx) => {
            const btn = document.createElement('button');
            btn.className = 'w-3 h-3 rounded-full bg-white/60 hover:bg-white transition';
            btn.dataset.index = idx;
            btn.setAttribute('aria-label', `Slide ${idx + 1}`);
            btn.addEventListener('click', () => {
                moveToSlide(idx);
                currentIndex = idx;
                resetAutoSlide();
                updateIndicators();
            });
            indicatorsContainer.appendChild(btn);
        });

        function updateIndicators() {
            Array.from(indicatorsContainer.children).forEach((b, i) => {
                b.classList.toggle('bg-white', i === currentIndex);
            });
        }

        function moveToSlide(index) {
            const slideWidth = slides[0].getBoundingClientRect().width;
            track.style.transform = `translateX(-${slideWidth * index}px)`;
        }

        function nextSlide() {
            currentIndex = (currentIndex + 1) % slides.length;
            moveToSlide(currentIndex);
            updateIndicators();
        }

        function startAutoSlide() { autoSlide = setInterval(nextSlide, 3500); }
        function stopAutoSlide() { clearInterval(autoSlide); }
        function resetAutoSlide() { stopAutoSlide(); startAutoSlide(); }

        carousel.addEventListener('mouseenter', stopAutoSlide);
        carousel.addEventListener('mouseleave', startAutoSlide);
        if (prevBtn) prevBtn.addEventListener('click', () => { currentIndex = (currentIndex - 1 + slides.length) % slides.length; moveToSlide(currentIndex); updateIndicators(); resetAutoSlide(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoSlide(); });

        updateIndicators();
        startAutoSlide();
    }

    // ==========================================================
    // 2. CARRITO
    // ==========================================================
    const modal = document.getElementById('carritoModal');
    const cerrar = document.getElementById('cerrarCarrito');
    const itemsEl = document.getElementById('carritoItems');
    const totalEl = document.getElementById('carritoTotal');
    const vaciar = document.getElementById('vaciarCarrito');
    const finalizar = document.getElementById('finalizarCompra');

    async function renderModalCart() {
        let items = [];

        // Si el usuario está logueado, cargar desde BD
        if (window.USER_ID) {
            try {
                const res = await fetch('/carrito_items');
                items = await res.json();
            } catch (err) {
                console.error('Error cargando carrito desde BD', err);
            }
        } else {
            items = JSON.parse(localStorage.getItem('carrito')) || [];
        }

        if (finalizar) finalizar.disabled = items.length === 0;

        if (!items || items.length === 0) {
            itemsEl.innerHTML = '<p class="text-gray-500 text-center">Tu carrito está vacío.</p>';
            totalEl.textContent = 'S/ 0.00';
            return;
        }

        let html = '';
        let total = 0;

        items.forEach(p => {
            const subtotal = (p.precio || 0) * (p.cantidad || 0);
            total += subtotal;
            const idAttr = p.id || p.nombre || '';
            const img = p.imagen ? `<img src="${p.imagen}" class="w-12 h-12 object-cover rounded mr-2">` : '';
            html += `
                <div class="flex justify-between items-center border-b py-2">
                    <div class="flex items-center">
                        ${img}
                        <div>
                            <span class="font-medium">${p.nombre}</span>
                            <span class="text-sm text-gray-500 ml-2">(x${p.cantidad})</span>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <span class="text-red-600 font-semibold">S/ ${subtotal.toFixed(2)}</span>
                        <button class="remove-item ml-3 text-red-500 hover:text-red-700" data-id="${idAttr}" aria-label="Eliminar">✕</button>
                    </div>
                </div>
            `;
        });

        itemsEl.innerHTML = html;
        totalEl.textContent = `S/ ${total.toFixed(2)}`;

        // Eliminar producto
        itemsEl.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                if (window.USER_ID) {
                    await fetch('/vaciar_carrito', { method: 'POST' }); // o endpoint específico para eliminar solo ese producto
                } else {
                    let arr = JSON.parse(localStorage.getItem('carrito')) || [];
                    arr = arr.filter(it => ((it.id || it.nombre) !== id));
                    localStorage.setItem('carrito', JSON.stringify(arr));
                }
                renderModalCart();
            });
        });
    }

    document.querySelectorAll('.agregar-carrito').forEach(boton => {
        boton.addEventListener('click', async () => {
            const producto_id = boton.dataset.id;
            const cantidad = parseInt(boton.previousElementSibling.value) || 1;

            if (window.USER_ID) {
                await fetch('/agregar_carrito', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ producto_id, cantidad })
                });
            } else {
                let arr = JSON.parse(localStorage.getItem('carrito')) || [];
                const existe = arr.find(p => p.id === producto_id);
                if (existe) {
                    existe.cantidad += cantidad;
                } else {
                    arr.push({ id: producto_id, nombre: boton.dataset.nombre, precio: parseFloat(boton.dataset.precio), cantidad, imagen: boton.dataset.imagen });
                }
                localStorage.setItem('carrito', JSON.stringify(arr));
            }

            renderModalCart();
            if (modal) modal.classList.remove('hidden');
        });
    });

    if (cerrar) cerrar.addEventListener('click', () => modal.classList.add('hidden'));
    if (vaciar) vaciar.addEventListener('click', async () => {
        if (window.USER_ID) {
            await fetch('/vaciar_carrito', { method: 'POST' });
        } else {
            localStorage.setItem('carrito', JSON.stringify([]));
        }
        renderModalCart();
    });
    if (finalizar) finalizar.addEventListener('click', () => { window.location.href = '/carrito'; });

    renderModalCart();

    // ==========================================================
    // 3. FILTROS Y ORDENAMIENTO
    // ==========================================================
    const contenedor = document.getElementById('products-grid');
    const selectOrden = document.getElementById('sort-home');
    const searchSidebar = document.getElementById('search-product');
    const typeCheckboxes = Array.from(document.querySelectorAll('.type-filter'));
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    const btnApply = document.getElementById('apply-filters');
    const btnReset = document.getElementById('reset-filters');

    if (!contenedor) return;

    const tarjetasNodeList = Array.from(contenedor.querySelectorAll('.product-card'));
    const originalOrder = tarjetasNodeList.slice();

    function precioDe(card) {
        const val = card.dataset.precio;
        const n = parseFloat(String(val).replace(',', '.'));
        return Number.isFinite(n) ? n : 0;
    }

    function aplicarFiltrosYOrden() {
        const query = (searchSidebar?.value || '').trim().toLowerCase();
        const tiposSeleccionados = typeCheckboxes.filter(c => c.checked).map(c => c.value);
        const min = priceMin?.value ? parseFloat(priceMin.value) : null;
        const max = priceMax?.value ? parseFloat(priceMax.value) : null;
        const orden = selectOrden?.value || 'default';

        let visibles = originalOrder.filter(card => {
            const nombre = (card.querySelector('h3')?.textContent || '').trim().toLowerCase();
            if (query && !nombre.includes(query)) return false;

            const tipo = (card.dataset.tipo || '').toLowerCase();
            if (tiposSeleccionados.length > 0 && !tiposSeleccionados.includes(tipo)) return false;

            const p = precioDe(card);
            if (min !== null && p < min) return false;
            if (max !== null && p > max) return false;

            return true;
        });

        if (orden === 'precio-asc') visibles.sort((a, b) => precioDe(a) - precioDe(b));
        else if (orden === 'precio-desc') visibles.sort((a, b) => precioDe(b) - precioDe(a));

        contenedor.innerHTML = '';
        if (visibles.length === 0) {
            contenedor.innerHTML = '<div class="col-span-3 text-center text-gray-500 p-6">No hay productos que coincidan con los filtros.</div>';
            return;
        }
        visibles.forEach(card => contenedor.appendChild(card));
    }

    if (selectOrden) selectOrden.addEventListener('change', aplicarFiltrosYOrden);
    if (searchSidebar) {
        let debounceTimer;
        searchSidebar.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => aplicarFiltrosYOrden(), 200);
        });
    }
    typeCheckboxes.forEach(cb => cb.addEventListener('change', aplicarFiltrosYOrden));
    if (btnApply) btnApply.addEventListener('click', aplicarFiltrosYOrden);
    if (btnReset) btnReset.addEventListener('click', () => {
        if (searchSidebar) searchSidebar.value = '';
        typeCheckboxes.forEach(c => c.checked = false);
        if (priceMin) priceMin.value = '';
        if (priceMax) priceMax.value = '';
        if (selectOrden) selectOrden.value = 'default';
        aplicarFiltrosYOrden();
    });

    aplicarFiltrosYOrden();

    console.debug('Carrito y filtros inicializados correctamente.');

});
