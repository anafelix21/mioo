/* ============================================
   CATEGORÍA: LIBROS
   Gestión de recetas y recomendaciones
   ============================================ */

// libros.js
document.addEventListener("DOMContentLoaded", () => {
    const btnRec = document.getElementById("btnRecomendaciones");
    const btnRecL = document.getElementById("btnReclamos");
    const secRec = document.getElementById("seccionRecomendaciones");
    const secRecL = document.getElementById("seccionReclamos");

    btnRec.addEventListener("click", () => {
        secRec.classList.remove("hidden");
        secRecL.classList.add("hidden");

        btnRec.classList.add("bg-amber-500", "text-white");
        btnRec.classList.remove("bg-gray-300", "text-gray-700");

        btnRecL.classList.add("bg-gray-300", "text-gray-700");
        btnRecL.classList.remove("bg-amber-500", "text-white");
    });

    btnRecL.addEventListener("click", () => {
        secRecL.classList.remove("hidden");
        secRec.classList.add("hidden");

        btnRecL.classList.add("bg-amber-500", "text-white");
        btnRecL.classList.remove("bg-gray-300", "text-gray-700");

        btnRec.classList.add("bg-gray-300", "text-gray-700");
        btnRec.classList.remove("bg-amber-500", "text-white");
    });
});
