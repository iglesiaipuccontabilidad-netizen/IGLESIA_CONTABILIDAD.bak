#!/bin/bash

# Script de verificación post-optimización
# Este script ayuda a verificar que todas las optimizaciones están funcionando

echo "🔍 Verificación de Optimizaciones"
echo "=================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Función para verificar archivos
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        return 0
    else
        echo -e "${RED}❌${NC} $2"
        return 1
    fi
}

# Función para verificar que no hay console.logs
check_no_console_logs() {
    local file="$1"
    local description="$2"
    
    # Excluir comentarios y líneas que manejan errores críticos
    local count=$(grep -n "console\." "$file" 2>/dev/null | \
        grep -v "console.error" | \
        grep -v "//" | \
        grep -v "\/\*" | \
        wc -l)
    
    if [ "$count" -eq 0 ]; then
        echo -e "${GREEN}✅${NC} $description - Sin console.logs de debug"
        return 0
    else
        echo -e "${YELLOW}⚠️${NC}  $description - Encontrados $count console.logs"
        grep -n "console\." "$file" | grep -v "console.error" | head -5
        return 1
    fi
}

# Función para verificar contenido
check_content() {
    local file="$1"
    local pattern="$2"
    local description="$3"
    
    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $description"
        return 0
    else
        echo -e "${RED}❌${NC} $description"
        return 1
    fi
}

echo "📂 Verificando archivos modificados..."
echo ""

# Verificar archivos principales
check_file "src/lib/context/AuthContext.tsx" "AuthContext existe"
check_file "src/app/dashboard/perfil/page.tsx" "Página de perfil existe"
check_file "src/components/Sidebar.tsx" "Sidebar existe"
check_file "supabase/migrations/20251231_optimize_usuarios_query.sql" "Migración SQL existe"
check_file "PRODUCTION_OPTIMIZATION_SUMMARY.md" "Documentación existe"

echo ""
echo "🔍 Verificando optimizaciones en AuthContext..."
echo ""

check_content "src/lib/context/AuthContext.tsx" "useCallback" "useCallback implementado"
check_content "src/lib/context/AuthContext.tsx" "useRef" "useRef para control de estado"
check_content "src/lib/context/AuthContext.tsx" "useMemo.*value" "useMemo para value del contexto"
check_content "src/lib/context/AuthContext.tsx" "AbortSignal" "AbortSignal para timeouts"

echo ""
echo "🔍 Verificando optimizaciones en Página de Perfil..."
echo ""

check_content "src/app/dashboard/perfil/page.tsx" "import { cache }" "React cache importado"
check_content "src/app/dashboard/perfil/page.tsx" "getUserData = cache" "Función getUserData cacheada"
check_content "src/app/dashboard/perfil/page.tsx" "getUserComites = cache" "Función getUserComites cacheada"
check_content "src/app/dashboard/perfil/page.tsx" "Promise.all" "Promise.all para paralelización"
check_content "src/app/dashboard/perfil/page.tsx" "notFound" "notFound() para manejo de errores"

echo ""
echo "🚫 Verificando eliminación de console.logs..."
echo ""

check_no_console_logs "src/components/Sidebar.tsx" "Sidebar"
check_no_console_logs "src/app/dashboard/perfil/page.tsx" "Página de Perfil"

echo ""
echo "🗄️ Verificando migración SQL..."
echo ""

check_content "supabase/migrations/20251231_optimize_usuarios_query.sql" "idx_usuarios_id" "Índice de ID"
check_content "supabase/migrations/20251231_optimize_usuarios_query.sql" "idx_usuarios_email" "Índice de Email"
check_content "supabase/migrations/20251231_optimize_usuarios_query.sql" "idx_usuarios_rol" "Índice de Rol"
check_content "supabase/migrations/20251231_optimize_usuarios_query.sql" "ANALYZE usuarios" "ANALYZE para estadísticas"

echo ""
echo "📦 Verificando build de producción..."
echo ""

if [ -d ".next" ]; then
    echo -e "${GREEN}✅${NC} Build de Next.js existe"
    
    # Verificar tamaño del build
    BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
    echo -e "${BLUE}ℹ️${NC}  Tamaño del build: $BUILD_SIZE"
else
    echo -e "${YELLOW}⚠️${NC}  Build no encontrado - ejecuta 'npm run build'"
fi

echo ""
echo "🎯 Checklist de Producción"
echo "=================================="
echo ""
echo "Antes de hacer deploy:"
echo ""
echo "[ ] 1. Aplicar migración SQL en Supabase"
echo "        ./scripts/apply-migration.sh"
echo ""
echo "[ ] 2. Verificar que no hay errores de TypeScript"
echo "        npm run build"
echo ""
echo "[ ] 3. Probar localmente en modo producción"
echo "        npm run build && npm run start"
echo ""
echo "[ ] 4. Verificar en DevTools:"
echo "        - No hay múltiples re-renders"
echo "        - No hay console.logs de debug"
echo "        - Consultas se completan en <1s"
echo ""
echo "[ ] 5. Monitorear después del deploy:"
echo "        - Supabase Dashboard > Database > Query Performance"
echo "        - Next.js Analytics (si está habilitado)"
echo "        - Sentry/Error tracking"
echo ""

echo "=================================="
echo -e "${GREEN}✨ Verificación completada!${NC}"
echo ""
echo "Para más información, revisa:"
echo "  📄 PRODUCTION_OPTIMIZATION_SUMMARY.md"
echo ""
