/* ============================================
   SCRIPTS DE PÁGINA NOSOTROS
   Animaciones y efectos de scroll
   ============================================ */

// Animación de elementos al hacer scroll
document.addEventListener('DOMContentLoaded', function() {
    
    // Intersection Observer para animaciones
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observar todos los elementos con clase fade-in
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => observer.observe(el));

    // Verificar horario de apertura
    checkOpenStatus();

    // Actualizar estado cada minuto
    setInterval(checkOpenStatus, 60000);

    // Animación suave en botones
    addButtonAnimations();
});

// Función para verificar si está abierto
function checkOpenStatus() {
    const statusIndicator = document.getElementById('statusIndicator');
    if (!statusIndicator) return;

    const now = new Date();
    const day = now.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hour + minutes / 60;

    let isOpen = false;
    let message = '';

    // Lunes a Viernes (1-5): 7:00 AM – 6:00 PM
    if (day >= 1 && day <= 5) {
        isOpen = currentTime >= 7 && currentTime < 18;
        message = isOpen ? 'Abierto ahora' : 'Cerrado';
    }
    // Sábado (6): 7:00 AM – 2:00 PM
    else if (day === 6) {
        isOpen = currentTime >= 7 && currentTime < 14;
        message = isOpen ? 'Abierto ahora' : 'Cerrado';
    }
    // Domingo (0): 8:00 AM – 1:00 PM
    else if (day === 0) {
        isOpen = currentTime >= 8 && currentTime < 13;
        message = isOpen ? 'Abierto ahora' : 'Cerrado';
    }

    // Actualizar el indicador
    statusIndicator.classList.remove('open', 'closed');
    statusIndicator.classList.add(isOpen ? 'open' : 'closed');
    
    const statusText = statusIndicator.querySelector('.status-text');
    if (statusText) {
        statusText.textContent = message;
    }
}

// Animaciones en botones y tarjetas
function addButtonAnimations() {
    const buttons = document.querySelectorAll('.directions-btn');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Efecto parallax suave en el hero
window.addEventListener('scroll', () => {
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;
    
    const scrolled = window.pageYOffset;
    const parallaxSpeed = 0.5;
    
    if (scrolled < window.innerHeight) {
        heroSection.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
    }
});

// Smooth scroll para enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animación de entrada para las tarjetas de valores
const valueCards = document.querySelectorAll('.value-card');
valueCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
});
