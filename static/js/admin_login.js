/* ============================================
   ADMIN LOGIN JAVASCRIPT
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Admin Login page loaded');
    
    const form = document.querySelector('.login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    // Validación en tiempo real
    emailInput.addEventListener('blur', function() {
        if (this.value && !isValidEmail(this.value)) {
            this.classList.add('error');
            this.parentElement.classList.add('error');
        } else {
            this.classList.remove('error');
            this.parentElement.classList.remove('error');
        }
    });
    
    // Remover clase de error al escribir
    emailInput.addEventListener('input', function() {
        if (this.classList.contains('error')) {
            this.classList.remove('error');
            this.parentElement.classList.remove('error');
        }
    });
    
    // Validar formulario antes de enviar
    form.addEventListener('submit', function(e) {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
            e.preventDefault();
            console.warn('⚠️ Faltan datos en el formulario');
            showAlert('Por favor, completa todos los campos', 'error');
            return false;
        }
        
        if (!isValidEmail(email)) {
            e.preventDefault();
            console.warn('⚠️ Email inválido');
            showAlert('Por favor, ingresa un email válido', 'error');
            return false;
        }
        
        console.log('✓ Formulario validado correctamente');
    });
});

/**
 * Validar formato de email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Mostrar alerta personalizada
 */
function showAlert(message, type = 'info') {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type}`;
    alertContainer.innerHTML = `
        <svg class="alert-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <span>${message}</span>
    `;
    
    const loginBox = document.querySelector('.login-box');
    const existingAlert = loginBox.querySelector('.alert');
    
    if (existingAlert) {
        existingAlert.replaceWith(alertContainer);
    } else {
        loginBox.insertBefore(alertContainer, document.querySelector('.login-form'));
    }
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        alertContainer.style.opacity = '0';
        alertContainer.style.transition = 'opacity 0.3s ease';
        setTimeout(() => alertContainer.remove(), 300);
    }, 5000);
}
