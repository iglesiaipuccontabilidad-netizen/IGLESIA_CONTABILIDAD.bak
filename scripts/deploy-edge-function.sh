#!/bin/bash
# ============================================================================
# Script de Deployment: Edge Function Actualizar Votos Vencidos
# Propósito: Automatizar el deployment de la Edge Function a Supabase
# Uso: ./scripts/deploy-edge-function.sh
# ============================================================================

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Deployment: actualizar-votos-vencidos${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ============================================================================
# 1. Verificar que estamos en el directorio correcto
# ============================================================================
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde la raíz del proyecto${NC}"
    exit 1
fi

if [ ! -d "supabase/functions/actualizar-votos-vencidos" ]; then
    echo -e "${RED}❌ Error: No se encuentra la Edge Function${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Estructura de proyecto verificada${NC}"

# ============================================================================
# 2. Verificar que supabase CLI está disponible
# ============================================================================
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npx no está instalado. Instala Node.js primero${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI disponible (npx)${NC}"

# ============================================================================
# 3. Verificar conexión con Supabase
# ============================================================================
echo ""
echo -e "${YELLOW}📡 Verificando autenticación con Supabase...${NC}"

if ! npx supabase projects list > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  No estás autenticado con Supabase${NC}"
    echo -e "${BLUE}Ejecutando: npx supabase login${NC}"
    npx supabase login
fi

echo -e "${GREEN}✅ Autenticado con Supabase${NC}"

# ============================================================================
# 4. Desplegar Edge Function
# ============================================================================
echo ""
echo -e "${YELLOW}🚀 Desplegando Edge Function...${NC}"
echo -e "${BLUE}Comando: npx supabase functions deploy actualizar-votos-vencidos --no-verify-jwt${NC}"
echo ""

if npx supabase functions deploy actualizar-votos-vencidos --no-verify-jwt; then
    echo ""
    echo -e "${GREEN}✅ Edge Function desplegada exitosamente${NC}"
else
    echo ""
    echo -e "${RED}❌ Error al desplegar Edge Function${NC}"
    echo -e "${YELLOW}Posibles soluciones:${NC}"
    echo "  1. Verifica que estás linkeado al proyecto: npx supabase link"
    echo "  2. Verifica tu autenticación: npx supabase login"
    echo "  3. Revisa los logs arriba para más detalles"
    exit 1
fi

# ============================================================================
# 5. Configurar Secrets (si existe .env)
# ============================================================================
echo ""
if [ -f ".env.production" ]; then
    echo -e "${YELLOW}📝 Archivo .env.production encontrado${NC}"
    echo -e "${BLUE}¿Deseas configurar los secrets ahora? (y/n)${NC}"
    read -r response
    
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${BLUE}Configurando secrets...${NC}"
        npx supabase secrets set --env-file .env.production
        echo -e "${GREEN}✅ Secrets configurados${NC}"
    else
        echo -e "${YELLOW}⏭️  Saltando configuración de secrets${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No se encontró .env.production${NC}"
    echo -e "${YELLOW}📝 Configura el CRON_SECRET manualmente:${NC}"
    echo ""
    echo -e "${BLUE}# Genera el secret:${NC}"
    echo "openssl rand -base64 32"
    echo ""
    echo -e "${BLUE}# Configura en Supabase:${NC}"
    echo "npx supabase secrets set CRON_SECRET=\"<tu_secret_generado>\""
fi

# ============================================================================
# 6. Resumen y Próximos Pasos
# ============================================================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✅ Deployment Completado${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}📋 Próximos pasos:${NC}"
echo ""
echo "1. ${YELLOW}Configurar CRON_SECRET:${NC}"
echo "   openssl rand -base64 32"
echo "   npx supabase secrets set CRON_SECRET=\"<secret_generado>\""
echo ""
echo "2. ${YELLOW}Configurar GitHub Secrets:${NC}"
echo "   - Ve a: Settings > Secrets and variables > Actions"
echo "   - Agrega: CRON_SECRET (el mismo de arriba)"
echo "   - Agrega: SUPABASE_PROJECT_REF (tu project ID)"
echo ""
echo "3. ${YELLOW}Probar la función:${NC}"
echo "   Revisa el archivo: test-edge-function.sh"
echo ""
echo "4. ${YELLOW}Monitorear:${NC}"
echo "   Dashboard > Edge Functions > actualizar-votos-vencidos > Logs"
echo ""
echo -e "${GREEN}🎉 ¡Sistema listo para uso!${NC}"
