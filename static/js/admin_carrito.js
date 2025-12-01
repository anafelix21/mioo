/* ============================================
   ADMIN - GESTIÓN DE CARRITO/PEDIDOS
   Búsqueda en tiempo real de pedidos
   ============================================ */

// 🔍 Búsqueda en tiempo real de pedidos
document.addEventListener('DOMContentLoaded', function() {
    const inputBuscar = document.getElementById('buscar-pedido');
    const tabla = document.querySelector('table');
    const filas = tabla.querySelectorAll('tbody tr');
    
    // Guardar filas originales
    const filasOriginales = Array.from(filas);
    
    if (inputBuscar) {
        inputBuscar.addEventListener('keyup', function() {
            const termino = this.value.toLowerCase();
            
            // Si el campo está vacío, mostrar todas las filas
            if (termino === '') {
                filasOriginales.forEach(fila => {
                    fila.style.display = '';
                });
                return;
            }
            
            // Filtrar filas
            filasOriginales.forEach(fila => {
                // Obtener contenido de la fila
                const id = fila.cells[0].textContent.toLowerCase();
                const cliente = fila.cells[1].textContent.toLowerCase();
                const total = fila.cells[2].textContent.toLowerCase();
                const estado = fila.cells[3].textContent.toLowerCase();
                const fecha = fila.cells[4].textContent.toLowerCase();
                
                // Buscar en todos los campos
                const coincide = id.includes(termino) || 
                                 cliente.includes(termino) || 
                                 total.includes(termino) || 
                                 estado.includes(termino) ||
                                 fecha.includes(termino);
                
                // Mostrar u ocultar
                fila.style.display = coincide ? '' : 'none';
            });
        });
    }
});

console.log("✅ Búsqueda de pedidos activada");