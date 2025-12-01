/* ============================================
   ADMIN - GESTIÓN DE USUARIOS
   Búsqueda en tiempo real de usuarios
   ============================================ */

// 🔍 Búsqueda en tiempo real de usuarios
document.addEventListener('DOMContentLoaded', function() {
    const inputBuscar = document.getElementById('buscar-usuario');
    const tabla = document.getElementById('tabla-usuarios');
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
                const nombre = fila.cells[1].textContent.toLowerCase();
                const apellido = fila.cells[2].textContent.toLowerCase();
                const email = fila.cells[3].textContent.toLowerCase();
                const dni = fila.cells[4].textContent.toLowerCase();
                const direccion = fila.cells[5].textContent.toLowerCase();
                
                // Buscar en todos los campos
                const coincide = nombre.includes(termino) || 
                                 apellido.includes(termino) || 
                                 email.includes(termino) || 
                                 dni.includes(termino) ||
                                 direccion.includes(termino);
                
                // Mostrar u ocultar
                fila.style.display = coincide ? '' : 'none';
            });
        });
    }
});

console.log("✅ Búsqueda de usuarios activada");