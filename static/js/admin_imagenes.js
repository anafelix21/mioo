/* ============================================
   ADMIN - GESTIÓN DE IMÁGENES
   Carga y gestión de imágenes de productos
   ============================================ */

// Formulario de subida
document.getElementById('uploadForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(this);

    fetch('/admin/imagenes/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('✅ ' + data.message);
            location.reload(); // Recargar página para mostrar nueva imagen
        } else {
            alert('❌ Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('❌ Error al subir la imagen');
    });
});

// Función para copiar URL al portapapeles
function copiarUrl(url) {
    navigator.clipboard.writeText(window.location.origin + url).then(function() {
        alert('URL copiada al portapapeles: ' + window.location.origin + url);
    }, function(err) {
        console.error('Error al copiar: ', err);
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = window.location.origin + url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('URL copiada al portapapeles');
    });
}