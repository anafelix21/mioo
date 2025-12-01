/* ============================================
   SCRIPTS DE LOGIN Y REGISTRO
   Gestión de autenticación de usuarios
   ============================================ */

// Sistema de pestañas para Login y Registro
document.addEventListener('DOMContentLoaded', function() {
    
    // Elementos del DOM
    const tabLogin = document.getElementById('tabLogin');
    const tabRegistro = document.getElementById('tabRegistro');
    const contentLogin = document.getElementById('contentLogin');
    const contentRegistro = document.getElementById('contentRegistro');

    // Función para cambiar a Login
    function mostrarLogin() {
        // Actualizar pestañas
        tabLogin.classList.add('active');
        tabRegistro.classList.remove('active');
        
        // Mostrar/ocultar contenido
        contentLogin.classList.remove('hidden');
        contentRegistro.classList.add('hidden');
        
        // Guardar preferencia en sessionStorage
        sessionStorage.setItem('activeTab', 'login');
    }

    // Función para cambiar a Registro
    function mostrarRegistro() {
        // Actualizar pestañas
        tabRegistro.classList.add('active');
        tabLogin.classList.remove('active');
        
        // Mostrar/ocultar contenido
        contentRegistro.classList.remove('hidden');
        contentLogin.classList.add('hidden');
        
        // Guardar preferencia en sessionStorage
        sessionStorage.setItem('activeTab', 'registro');
    }

    // Event listeners para las pestañas
    if (tabLogin) {
        tabLogin.addEventListener('click', mostrarLogin);
    }

    if (tabRegistro) {
        tabRegistro.addEventListener('click', mostrarRegistro);
    }

    // Restaurar pestaña activa desde sessionStorage
    const activeTab = sessionStorage.getItem('activeTab');
    if (activeTab === 'registro') {
        mostrarRegistro();
    }

    // ===== VALIDACIONES EN TIEMPO REAL =====

    // Validación del DNI
    const dniInput = document.getElementById('dni');
    if (dniInput) {
        dniInput.addEventListener('input', function(e) {
            // Solo permitir números
            this.value = this.value.replace(/\D/g, '');
            
            // Limitar a 8 dígitos
            if (this.value.length > 8) {
                this.value = this.value.slice(0, 8);
            }

            // Validación visual
            if (this.value.length === 8) {
                this.classList.remove('border-yellow-500');
                this.classList.add('border-green-500');
            } else if (this.value.length > 0) {
                this.classList.remove('border-green-500');
                this.classList.add('border-yellow-500');
            }
        });
    }

    // Validación de contraseña fuerte
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.addEventListener('input', function() {
            const password = this.value;
            const hasMinLength = password.length >= 8;
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumbers = /\d/.test(password);
            
            // Validar longitud mínima
            if (password.length > 0 && password.length < 8) {
                this.setCustomValidity('La contraseña debe tener al menos 8 caracteres');
                this.classList.add('border-red-500');
                this.classList.remove('border-green-500');
            } else if (password.length > 0) {
                this.setCustomValidity('');
                this.classList.remove('border-red-500');
                this.classList.add('border-green-500');
            }
        });
    });

    // Validación de email
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('change', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value && !emailRegex.test(this.value)) {
                this.setCustomValidity('Por favor, ingresa un email válido');
            } else {
                this.setCustomValidity('');
            }
        });
    });

    // Mostrar/ocultar contraseña
    function agregarTogglePassword() {
        const passwordFields = document.querySelectorAll('input[type="password"]');
        
        passwordFields.forEach(field => {
            // Evitar agregar múltiples botones
            if (field.nextElementSibling && field.nextElementSibling.classList.contains('toggle-password-btn')) {
                return;
            }

            const wrapper = field.parentElement;
            
            // Crear botón de toggle
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'toggle-password-btn absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300';
            toggleBtn.innerHTML = `
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
            `;
            
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const type = field.getAttribute('type') === 'password' ? 'text' : 'password';
                field.setAttribute('type', type);
                
                // Cambiar icono
                if (type === 'text') {
                    toggleBtn.innerHTML = `
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                        </svg>
                    `;
                } else {
                    toggleBtn.innerHTML = `
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                    `;
                }
            });
            
            wrapper.appendChild(toggleBtn);
        });
    }

    // Agregar toggle de contraseña después de un pequeño delay
    setTimeout(agregarTogglePassword, 100);

    // Manejo de formularios con loading state
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitButton = this.querySelector('button[type="submit"]');
            
            if (submitButton) {
                submitButton.classList.add('loading');
                submitButton.disabled = true;
                // Restaurar después de 3 segundos si hay error
                setTimeout(() => {
                    submitButton.classList.remove('loading');
                    submitButton.disabled = false;
                }, 3000);
            }
        });
    });

    // Auto-focus en el primer input visible
    const primerInputVisible = document.querySelector('.tab-content:not(.hidden) input:not([type="hidden"])');
    if (primerInputVisible) {
        setTimeout(() => primerInputVisible.focus(), 300);
    }

    // Validación de fecha de nacimiento (mayor de 18 años)
    const fechaNacimiento = document.getElementById('fecha_nacimiento');
    if (fechaNacimiento) {
        fechaNacimiento.addEventListener('change', function() {
            const fecha = new Date(this.value);
            const hoy = new Date();
            let edad = hoy.getFullYear() - fecha.getFullYear();
            const mes = hoy.getMonth() - fecha.getMonth();
            
            if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
                edad--;
            }
            
            if (edad < 18) {
                this.setCustomValidity('Debes ser mayor de 18 años para registrarte');
                this.classList.add('border-red-500');
            } else {
                this.setCustomValidity('');
                this.classList.remove('border-red-500');
                this.classList.add('border-green-500');
            }
        });
    }

    // Animación de entrada
    const card = document.querySelector('.bg-white.rounded-2xl');
    if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    }
});

// ===== ANIMACIONES AVANZADAS =====

// Animación 1: Efecto pulse al enfocar inputs
document.addEventListener('DOMContentLoaded', function() {
    const allInputs = document.querySelectorAll('input');
    allInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.transform = 'scale(1.01)';
        });
        input.addEventListener('blur', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // Animación 2: Zoom sutil en botón al pasar el mouse
    const allButtons = document.querySelectorAll('.btn-primary');
    allButtons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Animación 3: Efecto ripple en botones sociales
    const socialButtons = document.querySelectorAll('.social-button');
    socialButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.backgroundColor = 'rgba(220, 38, 38, 0.6)';
            ripple.style.pointerEvents = 'none';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s ease-out';
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
});

// Agregar animación ripple al CSS dinámicamente
if (!document.getElementById('ripple-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

