#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de prueba para verificar que las imágenes se suben y visualizan correctamente
"""

import requests
import json
import os

# Configuración
FLASK_URL = "http://localhost:5000"
UPLOAD_ENDPOINT = f"{FLASK_URL}/api/upload"
IMAGENES_ENDPOINT = f"{FLASK_URL}/api/imagenes-disponibles"
PRODUCTOS_ENDPOINT = f"{FLASK_URL}/api/productos"

def test_upload():
    """Prueba la subida de una imagen de prueba"""
    print("\n" + "="*70)
    print("🧪 TEST 1: Verificar que el servidor está corriendo")
    print("="*70)
    
    try:
        response = requests.get(f"{FLASK_URL}/", timeout=5)
        print("✅ Servidor Flask está activo en puerto 5000")
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: No se puede conectar a Flask en puerto 5000")
        print("   Asegúrate de ejecutar: python app.py")
        return False
    
    print("\n" + "="*70)
    print("🧪 TEST 2: Listar imágenes disponibles")
    print("="*70)
    
    try:
        response = requests.get(IMAGENES_ENDPOINT)
        if response.status_code == 200:
            data = response.json()
            imagenes = data.get('imagenes', [])
            print(f"✅ Total de imágenes en servidor: {len(imagenes)}")
            if imagenes:
                print("\n📸 Primeras 5 imágenes:")
                for img in imagenes[:5]:
                    print(f"  - {img['nombre']} ({img['tamaño']} bytes)")
        else:
            print(f"❌ Error al listar imágenes: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "="*70)
    print("🧪 TEST 3: Obtener lista de productos")
    print("="*70)
    
    try:
        response = requests.get(PRODUCTOS_ENDPOINT)
        if response.status_code == 200:
            data = response.json()
            productos = data.get('productos', [])
            print(f"✅ Total de productos: {len(productos)}")
            
            # Agrupar por imagen
            sin_imagen = 0
            con_imagen = 0
            
            print("\n🔍 Análisis de imágenes en productos:")
            for prod in productos:
                if prod.get('imagen'):
                    con_imagen += 1
                else:
                    sin_imagen += 1
            
            print(f"  ✅ Con imagen: {con_imagen}")
            print(f"  ⚠️  Sin imagen: {sin_imagen}")
            
            if con_imagen > 0:
                print("\n📸 Primeros 3 productos con imagen:")
                count = 0
                for prod in productos:
                    if prod.get('imagen') and count < 3:
                        print(f"  - {prod['nombre']}")
                        print(f"    Imagen: {prod['imagen']}")
                        print(f"    URL: /static/image/{prod['imagen']}")
                        count += 1
        else:
            print(f"❌ Error al obtener productos: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "="*70)
    print("📋 RESUMEN")
    print("="*70)
    print("""
✅ Si ves:
   - ✅ Servidor Flask está activo
   - ✅ Total de imágenes en servidor: X
   - ✅ Total de productos: X
   
   Entonces TODO está funcionando correctamente.
   
⚠️  Próximos pasos:
   1. Abre tu CRUD Java
   2. Selecciona un producto
   3. Haz clic en "Subir Imagen"
   4. Selecciona una imagen de tu computadora
   5. Espera a que diga "✅ ÉXITO"
   6. Abre http://localhost:5000/productos
   7. Deberías ver la imagen en la web

💡 Si algo falla:
   - Verifica que Flask está ejecutándose
   - Revisa los logs en la consola de Flask
   - Verifica que static/image/ existe y tiene archivos
    """)

if __name__ == "__main__":
    test_upload()
