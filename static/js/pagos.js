/* ============================================
   SCRIPTS DE PAGOS Y CONFIRMACIÓN
   Procesamiento de pedidos y pagos
   ============================================ */

// Sistema de pagos - Carnicería Pochito
document.addEventListener('DOMContentLoaded', function() {
    
    // Elementos del DOM
    const deliveryOptions = document.querySelectorAll('.delivery-option');
    const addressField = document.getElementById('address-field');
    const paymentMethods = document.querySelectorAll('.payment-method');
    const cardForm = document.getElementById('card-form');
    const yapePanel = document.getElementById('yape-panel');
    const codPanel = document.getElementById('cod-panel');
    const confirmButton = document.getElementById('confirm-button');
    
    // Inputs de tarjeta
    const cardNumber = document.getElementById('card-number');
    const cardExpiry = document.getElementById('card-expiry');
    const cardCvv = document.getElementById('card-cvv');
    const cardName = document.getElementById('card-name');

    // Estado actual
    let currentDeliveryType = 'delivery';
    let currentPaymentMethod = 'card';

    // ==========================================
    // TIPO DE ENTREGA
    // ==========================================
    deliveryOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remover active de todos
            deliveryOptions.forEach(opt => opt.classList.remove('active'));
            
            // Activar el seleccionado
            this.classList.add('active');
            currentDeliveryType = this.dataset.value;
            
            // Mostrar/ocultar campo de dirección
            if (currentDeliveryType === 'pickup') {
                addressField.style.display = 'none';
                addressField.querySelector('input').removeAttribute('required');
            } else {
                addressField.style.display = 'block';
                addressField.querySelector('input').setAttribute('required', 'required');
            }
        });
    });

    // ==========================================
    // MÉTODO DE PAGO
    // ==========================================
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            // Remover active de todos
            paymentMethods.forEach(m => m.classList.remove('active'));
            
            // Activar el seleccionado
            this.classList.add('active');
            currentPaymentMethod = this.dataset.method;
            
            // Mostrar/ocultar formularios correspondientes
            updatePaymentUI();
        });
    });

    function updatePaymentUI() {
        // Ocultar todos los paneles
        cardForm.classList.add('hidden');
        yapePanel.classList.add('hidden');
        codPanel.classList.add('hidden');
        
        // Mostrar el panel correspondiente
        switch(currentPaymentMethod) {
            case 'card':
                cardForm.classList.remove('hidden');
                setCardFieldsRequired(true);
                break;
            case 'yape':
                yapePanel.classList.remove('hidden');
                setCardFieldsRequired(false);
                break;
            case 'cod':
                codPanel.classList.remove('hidden');
                setCardFieldsRequired(false);
                break;
        }
    }

    function setCardFieldsRequired(required) {
        const inputs = cardForm.querySelectorAll('input');
        inputs.forEach(input => {
            if (required) {
                input.setAttribute('required', 'required');
            } else {
                input.removeAttribute('required');
            }
        });
    }

    // ==========================================
    // FORMATO DE TARJETA
    // ==========================================
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });

        cardNumber.addEventListener('keypress', function(e) {
            if (!/[0-9]/.test(e.key) && e.key !== 'Backspace') {
                e.preventDefault();
            }
        });
    }

    // ==========================================
    // FORMATO DE EXPIRACIÓN (MM/AA)
    // ==========================================
    if (cardExpiry) {
        cardExpiry.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            
            e.target.value = value;
        });

        cardExpiry.addEventListener('blur', function(e) {
            const value = e.target.value;
            if (value.length === 5) {
                const month = parseInt(value.slice(0, 2));
                const year = parseInt('20' + value.slice(3, 5));
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth() + 1;
                
                if (month < 1 || month > 12) {
                    mostrarNotificacion('Mes inválido', 'error');
                    e.target.value = '';
                } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
                    mostrarNotificacion('La tarjeta ha expirado', 'error');
                    e.target.value = '';
                }
            }
        });
    }

    // ==========================================
    // FORMATO DE CVV
    // ==========================================
    if (cardCvv) {
        cardCvv.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    // ==========================================
    // NOMBRE EN MAYÚSCULAS
    // ==========================================
    if (cardName) {
        cardName.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // ==========================================
    // CONFIRMAR PEDIDO
    // ==========================================
    if (confirmButton) {
        confirmButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Validar dirección si es delivery
            if (currentDeliveryType === 'delivery') {
                const address = document.getElementById('address').value.trim();
                if (!address) {
                    mostrarNotificacion('Por favor ingresa tu dirección de entrega', 'error');
                    document.getElementById('address').focus();
                    return;
                }
            }

            // Validar según método de pago
            if (currentPaymentMethod === 'card') {
                if (!validarTarjeta()) {
                    return;
                }
            }

            // Procesar pedido
            procesarPedido();
        });
    }

    // ==========================================
    // VALIDACIÓN DE TARJETA
    // ==========================================
    function validarTarjeta() {
        const nombre = cardName.value.trim();
        const numero = cardNumber.value.replace(/\s/g, '');
        const expiracion = cardExpiry.value;
        const cvv = cardCvv.value;

        if (!nombre) {
            mostrarNotificacion('Ingresa el nombre del titular', 'error');
            cardName.focus();
            return false;
        }

        if (numero.length < 13) {
            mostrarNotificacion('Número de tarjeta inválido', 'error');
            cardNumber.focus();
            return false;
        }

        if (expiracion.length !== 5) {
            mostrarNotificacion('Fecha de expiración inválida', 'error');
            cardExpiry.focus();
            return false;
        }

        if (cvv.length < 3) {
            mostrarNotificacion('CVV inválido', 'error');
            cardCvv.focus();
            return false;
        }

        return true;
    }

    // ==========================================
    // PROCESAR PEDIDO
    // ==========================================
    function procesarPedido() {
        // Deshabilitar botón y mostrar loading
        confirmButton.classList.add('loading');
        confirmButton.disabled = true;

        // Simular procesamiento
        // Primero, obtener items y totales calculados
        const items = obtenerItemsCarrito();
        let subtotal = 0;
        items.forEach(it => {
            const p = parseFloat(it.precio) || 0;
            const q = parseInt(it.cantidad) || 0;
            subtotal += p * q;
        });
        const igv = 0; // IGV eliminado
        const envio = 0; // por ahora envío gratis; puedes cambiar
        const total = subtotal + envio;

        // Construir payload para backend
        const payload = {
            items: items,
            subtotal: subtotal.toFixed(2),
            igv: igv.toFixed(2),
            envio: envio.toFixed(2),
            total: total.toFixed(2),
            tipo_entrega: currentDeliveryType,
            direccion: document.getElementById('address') ? document.getElementById('address').value.trim() : '',
            metodo_pago: currentPaymentMethod
        };

        // Enviar al servidor
        fetch('/confirmar_pedido', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin', // enviar cookies de sesión
            body: JSON.stringify(payload)
        })
        .then(async (r) => {
            // Manejar respuesta según content-type (JSON o HTML)
            const ct = r.headers.get('content-type') || '';
            let data;
            if (ct.includes('application/json')) {
                data = await r.json();
            } else {
                data = { __raw: await r.text(), status: r.status };
            }
            return { ok: r.ok, status: r.status, data };
        })
        .then(({ ok, status, data }) => {
            confirmButton.classList.remove('loading');
            confirmButton.disabled = false;
            if (ok && data && data.success) {
                let mensaje = '';
                switch(currentPaymentMethod) {
                    case 'card':
                        mensaje = '¡Pago procesado exitosamente! Tu pedido está en camino.';
                        break;
                    case 'yape':
                        mensaje = '¡Pago recibido! Gracias por usar Yape. Tu pedido será procesado.';
                        break;
                    case 'cod':
                        mensaje = '¡Pedido confirmado! Pagarás al recibir tu producto.';
                        break;
                }
                
                // Obtener datos para el modal
                const items = obtenerItemsCarrito();
                let total = 0;
                items.forEach(it => {
                    const p = parseFloat(it.precio) || 0;
                    const q = parseInt(it.cantidad) || 0;
                    total += p * q;
                });
                
                // Mostrar modal de confirmación
                mostrarModalConfirmacion(mensaje, total, currentDeliveryType, data.pedido_id);

                // Limpiar carrito local y objeto global
                try {
                    localStorage.removeItem('carrito');
                    if (window.carrito) {
                        window.carrito.items = [];
                        window.carrito.guardarCarrito();
                        window.carrito.actualizarCarritoLateral();
                    }
                } catch (e) { console.warn('No se pudo limpiar carrito:', e); }
            } else {
                // Mostrar mensaje de error útil: preferir data.error, si viene HTML mostrarlo truncado
                let errMsg = 'Error al registrar el pedido';
                if (data) {
                    if (data.error) errMsg = data.error;
                    else if (data.__raw) {
                        // Si se recibió HTML (por ejemplo un redirect a login), mostrar motivo corto
                        errMsg = data.__raw.substring(0, 250);
                    }
                }
                mostrarNotificacion(errMsg, 'error');
            }
        }).catch(err => {
            confirmButton.classList.remove('loading');
            confirmButton.disabled = false;
            mostrarNotificacion('Error en la conexión: ' + err.message, 'error');
        });
    }

    // ==========================================
    // SISTEMA DE NOTIFICACIONES
    // ==========================================
    function mostrarNotificacion(mensaje, tipo = 'info') {
        // Remover notificaciones previas
        const prevNotif = document.querySelector('.notification');
        if (prevNotif) {
            prevNotif.remove();
        }

        // Crear notificación
        const notificacion = document.createElement('div');
        notificacion.className = `notification fixed top-0 left-0 right-0 md:top-4 md:left-auto md:right-4 px-4 md:px-6 py-4 md:py-4 md:rounded-xl shadow-2xl z-50 w-full md:max-w-md ${
            tipo === 'error' ? 'bg-red-600' : 'bg-green-600'
        } text-white font-medium flex items-center gap-3`;
        
        const icon = tipo === 'error' 
            ? '<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>'
            : '<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>';
        
        notificacion.innerHTML = icon + '<span class="flex-1">' + mensaje + '</span>';
        
        document.body.appendChild(notificacion);
        
        // Animar entrada
        setTimeout(() => {
            notificacion.style.animation = 'slideInDown 0.3s ease-out';
        }, 10);
        
        // Remover después de 4 segundos
        setTimeout(() => {
            notificacion.style.animation = 'slideOutUp 0.3s ease-out';
            setTimeout(() => notificacion.remove(), 300);
        }, 4000);
    }

    // Estilos de animación de notificación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInDown {
            from {
                transform: translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        @keyframes slideOutUp {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(-100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================
    updatePaymentUI();
    // Actualizar resumen con valores del carrito
    updateResumenDesdeCarrito();
    
    console.log('Sistema de pagos inicializado correctamente');
    
    // ==========================================
    // FUNCIONES DE RESUMEN Y CARRO
    // ==========================================
    function obtenerItemsCarrito() {
        // Preferir el objeto global window.carrito si existe
        try {
            if (window.carrito && Array.isArray(window.carrito.items)) {
                return window.carrito.items;
            }
        } catch (e) {
            console.warn('No se pudo leer window.carrito:', e);
        }

        // Fallback: leer desde localStorage
        try {
            const raw = localStorage.getItem('carrito');
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            return [];
        } catch (e) {
            console.warn('Error parseando carrito desde localStorage:', e);
            return [];
        }
    }

    function updateResumenDesdeCarrito() {
        const items = obtenerItemsCarrito();
        let subtotal = 0;
        items.forEach(it => {
            const precio = parseFloat(it.precio) || 0;
            const cantidad = parseInt(it.cantidad) || 0;
            subtotal += precio * cantidad;
        });

        const igv = 0; // IGV eliminado
        const envio = 0; // envío gratis por ahora
        const total = subtotal + envio;

        // Actualizar DOM (si existen los elementos)
        const elSubtotal = document.getElementById('payment-subtotal');
        const elIgv = document.getElementById('payment-igv');
        const elTotal = document.getElementById('payment-total');
        if (elSubtotal) elSubtotal.textContent = `S/. ${subtotal.toFixed(2)}`;
        if (elIgv) elIgv.textContent = `S/. ${igv.toFixed(2)}`;
        if (elTotal) elTotal.textContent = `S/. ${total.toFixed(2)}`;

        // Si se desea enviar el total al servidor, se podría agregar un campo hidden
        // document.getElementById('hidden-total').value = total.toFixed(2);
    }
});

// ==========================================
// FUNCIONES GLOBALES PARA MODAL
// ==========================================
function mostrarModalConfirmacion(mensaje, total, tipoEntrega, numeroPedido = null) {
    const modal = document.getElementById('confirmation-modal');
    const title = document.getElementById('confirmation-title');
    const msgElement = document.getElementById('confirmation-message');
    const orderTotal = document.getElementById('order-total');
    const orderDelivery = document.getElementById('order-delivery');
    const orderNumber = document.getElementById('order-number');
    
    title.textContent = '¡Pedido Confirmado!';
    msgElement.textContent = mensaje;
    orderTotal.textContent = `S/. ${parseFloat(total).toFixed(2)}`;
    orderDelivery.textContent = tipoEntrega === 'delivery' ? 'Entrega a domicilio' : 'Recoger en tienda';
    orderNumber.textContent = numeroPedido ? `#${numeroPedido}` : 'Procesando...';
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function ocultarModalConfirmacion() {
    const modal = document.getElementById('confirmation-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function irAInicio() {
    window.location.href = '/';
}

function irAMisPedidos() {
    window.location.href = '/perfil';
}