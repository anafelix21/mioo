/* ============================================
   SCRIPT DE MENÚ MÓVIL
   Toggle del menú hamburguesa responsivo
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!toggle || !mobileMenu) return;

    toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        mobileMenu.classList.toggle('hidden');
    });

    // Close menu on outside click
    document.addEventListener('click', function(e) {
        if (!mobileMenu.classList.contains('hidden') && !mobileMenu.contains(e.target) && e.target !== toggle) {
            mobileMenu.classList.add('hidden');
        }
    });

    // Toggle submenus inside mobile menu
    const submenuButtons = mobileMenu ? mobileMenu.querySelectorAll('[data-toggle="submenu"]') : [];
    submenuButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const targetId = btn.getAttribute('data-target');
            const target = document.getElementById(targetId);
            if (!target) return;
            const icon = btn.querySelector('svg');
            target.classList.toggle('hidden');
            if (icon) icon.classList.toggle('rotate-180');
        });
    });
});