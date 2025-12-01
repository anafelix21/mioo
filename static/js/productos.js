/* ============================================
   SCRIPTS DE PRODUCTOS
   Eventos de botones en tarjetas de productos
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  console.log("Productos cargado");

  const botones = document.querySelectorAll('.product-card button');
  botones.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.product-card').classList.add('fade-in');
      alert("Producto agregado al carrito 🛒");
    });
  });
});
