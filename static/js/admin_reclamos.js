/* ============================================
   ADMIN - GESTIÓN DE RECLAMOS
   Búsqueda en tiempo real de reclamos y sugerencias
   ============================================ */

// 🔍 Búsqueda en tiempo real de reclamos
document.addEventListener('DOMContentLoaded', function() {
    const inputBuscar = document.getElementById('buscar-reclamo');
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
                const usuario = fila.cells[1].textContent.toLowerCase();
                const tipo = fila.cells[2].textContent.toLowerCase();
                const mensaje = fila.cells[3].textContent.toLowerCase();
                const fecha = fila.cells[4].textContent.toLowerCase();
                
                // Buscar en todos los campos
                const coincide = id.includes(termino) || 
                                 usuario.includes(termino) || 
                                 tipo.includes(termino) || 
                                 mensaje.includes(termino) ||
                                 fecha.includes(termino);
                
                // Mostrar u ocultar
                fila.style.display = coincide ? '' : 'none';
            });
        });
    }
});

// 🗑️ Eliminar reclamo con confirmación
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("button[onclick*='eliminarReclamo']").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const reclamoId = btn.getAttribute('onclick').match(/\d+/)[0];

            if (confirm("¿Deseas eliminar este reclamo?")) {
                try {
                    const response = await fetch(`/api/reclamos/${reclamoId}`, {
                        method: "DELETE"
                    });

                    if (response.ok) {
                        alert("Reclamo eliminado correctamente");
                        location.reload();
                    } else {
                        alert("Error al eliminar reclamo");
                    }
                } catch (error) {
                    alert("No se pudo conectar con el servidor");
                }
            }
        });
    });
});

console.log("✅ Búsqueda de reclamos activada");