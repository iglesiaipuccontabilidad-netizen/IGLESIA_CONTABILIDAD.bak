#!/bin/bash

# Script para ejecutar pruebas TestSprite
# Uso: ./run-tests.sh

set -e

echo "🚀 Iniciando ejecución de pruebas TestSprite..."
echo "=================================================="

# Verificar que el servidor está corriendo
if ! nc -z localhost 3000 2>/dev/null; then
    echo "⚠️  El servidor en puerto 3000 no está corriendo"
    echo "Por favor ejecuta: npm run dev"
    exit 1
fi

echo "✅ Servidor detectado en puerto 3000"

# Navegar al directorio del proyecto
cd "$(dirname "$0")"

# Verificar que existen los archivos de prueba
if [ ! -f "testsprite_tests/testsprite_frontend_test_plan.json" ]; then
    echo "❌ No se encontró el plan de pruebas"
    echo "Asegúrate de que exista: testsprite_tests/testsprite_frontend_test_plan.json"
    exit 1
fi

echo "✅ Plan de pruebas encontrado"

# Crear directorio para resultados si no existe
mkdir -p testsprite_tests/tmp

echo ""
echo "📊 Resumen de Pruebas:"
echo "- Total de casos: 17"
echo "- Autenticación: 2"
echo "- Seguridad: 2"
echo "- Dashboard: 2"
echo "- Comités: 2"
echo "- Votos: 2"
echo "- Ofrendas: 1"
echo "- Gastos: 1"
echo "- Admin: 1"
echo "- Reportes: 1"
echo "- APIs: 1"
echo "- Validación: 2"
echo ""

# Opciones de ejecución
echo "Selecciona cómo ejecutar las pruebas:"
echo "1. Dashboard Web Interactivo (RECOMENDADO)"
echo "2. Modo CLI (terminal)"
echo "3. Modo Manual (instructions only)"
echo ""
read -p "Elige una opción (1-3): " option

case $option in
    1)
        echo ""
        echo "🌐 Abriendo Dashboard Web..."
        echo "TestSprite abrirá automáticamente en tu navegador"
        npx @testsprite/testsprite-mcp@latest
        ;;
    2)
        echo ""
        echo "⚙️  Ejecutando en modo CLI..."
        npx @testsprite/testsprite-mcp@latest generateCodeAndExecute
        ;;
    3)
        echo ""
        echo "📖 Modo Manual - Ejecuta las pruebas según GUIA_EJECUCION_PRUEBAS_TESTSPRITE.md"
        cat GUIA_EJECUCION_PRUEBAS_TESTSPRITE.md
        ;;
    *)
        echo "Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "=================================================="
echo "✅ Proceso completado"
echo ""
echo "📁 Resultados guardados en:"
echo "   - testsprite_tests/testsprite-mcp-test-report.md"
echo "   - testsprite_tests/tmp/raw_report.md"
echo ""
