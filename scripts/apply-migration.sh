#!/bin/bash

# Script para aplicar migración de optimización de usuarios
# Este script aplica la migración 20251231_optimize_usuarios_query.sql

echo "🚀 Aplicando migración de optimización de usuarios..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que existe el archivo de migración
MIGRATION_FILE="supabase/migrations/20251231_optimize_usuarios_query.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Error: No se encuentra el archivo de migración${NC}"
    echo "   Buscando: $MIGRATION_FILE"
    exit 1
fi

echo -e "${GREEN}✅ Archivo de migración encontrado${NC}"
echo ""

# Opción 1: Usar Supabase CLI
echo "📋 OPCIÓN 1: Aplicar con Supabase CLI"
echo "----------------------------------------"
echo "Comando:"
echo -e "${YELLOW}npx supabase db push${NC}"
echo ""
echo "O específicamente:"
echo -e "${YELLOW}npx supabase migration up${NC}"
echo ""

# Opción 2: Manual desde dashboard
echo "📋 OPCIÓN 2: Aplicar desde Supabase Dashboard"
echo "----------------------------------------"
echo "1. Abre https://supabase.com/dashboard"
echo "2. Selecciona tu proyecto"
echo "3. Ve a 'SQL Editor'"
echo "4. Copia y pega el contenido de:"
echo "   $MIGRATION_FILE"
echo "5. Click en 'Run' o presiona Ctrl+Enter"
echo ""

# Mostrar contenido de la migración
echo "📄 Contenido de la migración:"
echo "----------------------------------------"
cat "$MIGRATION_FILE"
echo ""
echo "----------------------------------------"
echo ""

# Opción 3: Usando psql directamente
echo "📋 OPCIÓN 3: Aplicar con psql (Avanzado)"
echo "----------------------------------------"
echo "Si tienes acceso directo a la base de datos:"
echo -e "${YELLOW}psql \$DATABASE_URL -f $MIGRATION_FILE${NC}"
echo ""

echo "✅ Después de aplicar la migración:"
echo "  1. Reinicia tu aplicación Next.js"
echo "  2. Verifica que no hay errores de timeout"
echo "  3. Revisa el rendimiento en el dashboard"
echo ""
echo "🔍 Para verificar que los índices se crearon:"
echo -e "${YELLOW}SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'usuarios';${NC}"
echo ""

echo -e "${GREEN}✨ Listo! Elige el método que prefieras para aplicar la migración.${NC}"
