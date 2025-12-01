/* ============================================
   CARRITO FALLBACK
   Sistema de respaldo para agregar productos
   ============================================ */

// Fallback: enlaza explícitamente botones .agregar-carrito a window.carrito.agregarProducto
document.addEventListener('DOMContentLoaded', () => {
  try {
    if (!window.carrito || typeof window.carrito.agregarProducto !== 'function') return;
    document.querySelectorAll('.agregar-carrito').forEach(boton => {
      if (boton.dataset._fallbackBound) return;
      boton.dataset._fallbackBound = '1';
      boton.addEventListener('click', (e) => {
        // Evitar comportamiento por defecto y detener la propagación
        // para que el listener delegado en `document` no procese
        // el mismo click duplicadamente.
        e.preventDefault();
        e.stopPropagation();
        const rawId = boton.dataset.id || '';
        const rawNombre = boton.dataset.nombre || '';
        const rawPrecio = boton.dataset.precio || '';
        const rawImagen = boton.dataset.imagen || '';
        const card = boton.closest('.product-card') || boton.closest('div');
        const qtyInput = card ? card.querySelector('.producto-cantidad') : null;
        const cantidad = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
        const id = String(rawId).replace(/"+/g, '').trim();
        const nombre = String(rawNombre).replace(/"+/g, '').trim();
        const precio = parseFloat(String(rawPrecio).replace(/[^0-9,.-]/g, '').replace(',', '.')) || 0;
        const imagen = String(rawImagen).trim();
        if (!id || !nombre || isNaN(precio)) {
          console.warn('[carrito-fallback] datos inválidos:', boton.dataset);
          return;
        }
        window.carrito.agregarProducto(id, nombre, precio, imagen, cantidad);
        if (typeof window.renderModalCart === 'function') window.renderModalCart();
      });
    });
  } catch (err) {
    console.warn('[carrito-fallback] no se pudo enlazar fallback:', err);
  }
});
