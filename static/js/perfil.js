/* ============================================
   SCRIPTS DEL PERFIL DE USUARIO
   Edición de información y pedidos
   ============================================ */

// Gestión del modal de edición de perfil
document.addEventListener('DOMContentLoaded', function() {
    
    // Elementos del DOM
    const modal = document.getElementById('modalEditar');
    const editarBtn = document.getElementById('editarBtn');
    const editarBtnCard = document.getElementById('editarBtnCard');
    const cancelarBtn = document.getElementById('cancelarBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const formEditar = document.getElementById('formEditar');

    // Función para abrir el modal
    function abrirModal() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }

    // Función para cerrar el modal
    function cerrarModal() {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restaurar scroll
    }

    // Event listeners para abrir el modal
    if (editarBtn) {
        editarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            abrirModal();
        });
    }

    if (editarBtnCard) {
        editarBtnCard.addEventListener('click', function(e) {
            e.preventDefault();
            abrirModal();
        });
    }

    // Event listeners para cerrar el modal
    if (cancelarBtn) {
        cancelarBtn.addEventListener('click', cerrarModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', cerrarModal);
    }

    // Cerrar modal al hacer clic fuera de él
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            cerrarModal();
        }
    });

    // Cerrar modal con la tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            cerrarModal();
        }
    });

    // Manejar el envío del formulario
    if (formEditar) {
        formEditar.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Obtener datos del formulario
            const formData = new FormData(formEditar);
            const nombre = formData.get('nombre');
            const correo = formData.get('correo');

            // Validación básica
            if (!nombre || !correo) {
                mostrarNotificacion('Por favor completa todos los campos', 'error');
                return;
            }

            if (!validarEmail(correo)) {
                mostrarNotificacion('Por favor ingresa un correo válido', 'error');
                return;
            }

            // Aquí iría la petición AJAX al servidor
            // Por ahora solo enviamos el formulario normalmente
            formEditar.submit();
        });
    }

    // Función auxiliar para validar email
    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Función para mostrar notificaciones (opcional, requiere implementación adicional)
    function mostrarNotificacion(mensaje, tipo = 'info') {
        // Crear elemento de notificación
        const notificacion = document.createElement('div');
        notificacion.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${
            tipo === 'error' ? 'bg-red-600' : 'bg-green-600'
        } text-white font-medium`;
        notificacion.textContent = mensaje;
        
        document.body.appendChild(notificacion);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notificacion.style.opacity = '0';
            notificacion.style.transition = 'opacity 0.3s';
            setTimeout(() => notificacion.remove(), 300);
        }, 3000);
    }

    // Animación suave al cargar la página
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.style.opacity = '0';
        mainContent.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            mainContent.style.transition = 'all 0.5s ease-out';
            mainContent.style.opacity = '1';
            mainContent.style.transform = 'translateY(0)';
        }, 100);
    }
});