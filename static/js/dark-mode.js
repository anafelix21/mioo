// ============================================
// SISTEMA DE MODO OSCURO/CLARO GLOBAL
// ============================================

class ThemeManager {
    constructor() {
        this.THEME_KEY = 'pochito-theme';
        this.DARK_THEME = 'dark';
        this.LIGHT_THEME = 'light';
        this.init();
    }

    init() {
        // ⚡ APLICAR TEMA ANTES DE RENDERIZAR (evita flash)
        this.applyThemeImmediately();
        
        // Configurar listeners cuando DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAfterDOM());
        } else {
            this.setupAfterDOM();
        }
    }

    applyThemeImmediately() {
        // Cargar tema guardado o usar preferencia del sistema
        const savedTheme = localStorage.getItem(this.THEME_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? this.DARK_THEME : this.LIGHT_THEME);
        
        // Aplicar INMEDIATAMENTE al elemento raíz
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === this.DARK_THEME) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    setupAfterDOM() {
        this.setupToggleButtons();
        this.watchSystemPreference();
    }

    setTheme(theme) {
        // Establecer atributo data-theme en el elemento raíz
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.colorScheme = theme;
        
        // Actualizar clase dark para Tailwind CSS
        if (theme === this.DARK_THEME) {
            document.documentElement.classList.add('dark');
            document.body.style.colorScheme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            document.body.style.colorScheme = 'light';
        }
        
        // Guardar preferencia
        localStorage.setItem(this.THEME_KEY, theme);
        
        // Actualizar todos los botones de tema
        this.updateAllToggleButtons(theme);
        
        // Emitir evento personalizado para otros scripts
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
        
        console.log(`🎨 Tema cambiado a: ${theme}`);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || this.LIGHT_THEME;
        const newTheme = currentTheme === this.DARK_THEME ? this.LIGHT_THEME : this.DARK_THEME;
        this.setTheme(newTheme);
    }

    setupToggleButtons() {
        // Botones específicos
        const toggleButtons = [
            'theme-toggle-nav',
            'theme-toggle-nav-mobile',
            'theme-toggle-login',
            'theme-toggle-libros',
            'theme-toggle-perfil',
            'theme-toggle-admin'
        ];

        toggleButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleTheme();
                });
            }
        });

        // Botones genéricos con atributo data-theme-toggle
        const genericToggles = document.querySelectorAll('[data-theme-toggle="true"]');
        genericToggles.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        });
    }

    updateAllToggleButtons(theme) {
        const toggleButtons = document.querySelectorAll(
            '#theme-toggle-nav, #theme-toggle-nav-mobile, #theme-toggle-login, #theme-toggle-libros, #theme-toggle-perfil, #theme-toggle-admin, [data-theme-toggle="true"]'
        );
        
        toggleButtons.forEach(btn => {
            const icon = btn.querySelector('svg');
            if (icon) {
                if (theme === this.DARK_THEME) {
                    // Mostrar icono de sol (para cambiar a claro)
                    icon.setAttribute('fill', 'none');
                    icon.setAttribute('viewBox', '0 0 24 24');
                    icon.setAttribute('stroke', 'currentColor');
                    icon.setAttribute('stroke-width', '2');
                    icon.innerHTML = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
                    icon.classList.add('text-yellow-400');
                    icon.classList.remove('text-blue-500');
                    btn.title = 'Cambiar a modo claro';
                } else {
                    // Mostrar icono de luna (para cambiar a oscuro)
                    icon.setAttribute('fill', 'currentColor');
                    icon.setAttribute('viewBox', '0 0 24 24');
                    icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
                    icon.classList.add('text-blue-500');
                    icon.classList.remove('text-yellow-400');
                    btn.title = 'Cambiar a modo oscuro';
                }
            }
        });
    }

    watchSystemPreference() {
        // Escuchar cambios en las preferencias del sistema
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeQuery.addEventListener('change', (e) => {
            // Solo cambiar si el usuario no ha establecido una preferencia manual
            if (!localStorage.getItem(this.THEME_KEY)) {
                this.setTheme(e.matches ? this.DARK_THEME : this.LIGHT_THEME);
            }
        });
    }

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || this.LIGHT_THEME;
    }

    setThemeDark() {
        this.setTheme(this.DARK_THEME);
    }

    setThemeLight() {
        this.setTheme(this.LIGHT_THEME);
    }
}

// Inicializar gestor de temas globalmente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}

// Funciones globales para cambiar tema
function toggleTheme() {
    if (window.themeManager) {
        window.themeManager.toggleTheme();
    }
}

function setDarkMode() {
    if (window.themeManager) {
        window.themeManager.setThemeDark();
    }
}

function setLightMode() {
    if (window.themeManager) {
        window.themeManager.setThemeLight();
    }
}

