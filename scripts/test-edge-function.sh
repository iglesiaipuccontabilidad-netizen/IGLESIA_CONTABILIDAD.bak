#!/bin/bash
# ============================================================================
# Script de Prueba: Edge Function Actualizar Votos Vencidos
# Propósito: Probar la Edge Function desplegada
# Uso: ./scripts/test-edge-function.sh [PROJECT_REF] [CRON_SECRET]
# ============================================================================

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Test: actualizar-votos-vencidos${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ============================================================================
# Parámetros
# ============================================================================
PROJECT_REF="${1:-}"
CRON_SECRET="${2:-}"

if [ -z "$PROJECT_REF" ]; then
    echo -e "${YELLOW}Ingresa tu PROJECT_REF (ej: abcdefgh12345678):${NC}"
    read -r PROJECT_REF
fi

if [ -z "$CRON_SECRET" ]; then
    echo -e "${YELLOW}Ingresa tu CRON_SECRET:${NC}"
    read -r -s CRON_SECRET
    echo ""
fi

# ============================================================================
# Construcción de URL
# ============================================================================
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/actualizar-votos-vencidos"

echo -e "${BLUE}📡 URL de la función:${NC}"
echo "   $FUNCTION_URL"
echo ""

# ============================================================================
# Ejecutar Test
# ============================================================================
echo -e "${YELLOW}🔄 Ejecutando Edge Function...${NC}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  "$FUNCTION_URL")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo -e "${BLUE}📊 Código de respuesta: ${NC}$HTTP_CODE"
echo ""

# ============================================================================
# Análisis de Respuesta
# ============================================================================
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Función ejecutada exitosamente${NC}"
    echo ""
    echo -e "${BLUE}📋 Respuesta:${NC}"
    
    # Intentar formatear JSON con jq si está disponible
    if command -v jq &> /dev/null; then
        echo "$BODY" | jq '.'
        
        # Extraer información clave
        VOTOS_ACTUALIZADOS=$(echo "$BODY" | jq -r '.votos_actualizados // 0')
        MESSAGE=$(echo "$BODY" | jq -r '.message // "N/A"')
        DURATION=$(echo "$BODY" | jq -r '.duration_ms // "N/A"')
        
        echo ""
        echo -e "${BLUE}📈 Resumen:${NC}"
        echo "   • Votos actualizados: $VOTOS_ACTUALIZADOS"
        echo "   • Duración: ${DURATION}ms"
        echo "   • Mensaje: $MESSAGE"
    else
        echo "$BODY"
        echo ""
        echo -e "${YELLOW}💡 Tip: Instala 'jq' para mejor formato: sudo apt install jq${NC}"
    fi
    
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${RED}❌ Error de autenticación (401 Unauthorized)${NC}"
    echo ""
    echo -e "${YELLOW}Posibles causas:${NC}"
    echo "  • CRON_SECRET incorrecto"
    echo "  • CRON_SECRET no configurado en Supabase"
    echo ""
    echo -e "${BLUE}Solución:${NC}"
    echo "  npx supabase secrets set CRON_SECRET=\"<tu_secret>\""
    
elif [ "$HTTP_CODE" = "500" ]; then
    echo -e "${RED}❌ Error interno del servidor (500)${NC}"
    echo ""
    echo -e "${BLUE}📋 Respuesta de error:${NC}"
    if command -v jq &> /dev/null; then
        echo "$BODY" | jq '.'
    else
        echo "$BODY"
    fi
    echo ""
    echo -e "${YELLOW}Revisa los logs en:${NC}"
    echo "  Dashboard > Edge Functions > actualizar-votos-vencidos > Logs"
    
else
    echo -e "${RED}❌ Error inesperado (HTTP $HTTP_CODE)${NC}"
    echo ""
    echo -e "${BLUE}📋 Respuesta:${NC}"
    echo "$BODY"
fi

echo ""
echo -e "${BLUE}============================================${NC}"

# Exit con código apropiado
if [ "$HTTP_CODE" = "200" ]; then
    exit 0
else
    exit 1
fi
