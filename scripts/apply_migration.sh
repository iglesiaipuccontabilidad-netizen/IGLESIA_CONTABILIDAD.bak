#!/bin/bash

# Script para aplicar migración manualmente a Supabase
# Migración: fix_balance_comite_incluir_ventas.sql

SUPABASE_URL="https://czwbsvzfxpukvoearylt.supabase.co"
SUPABASE_SERVICE_KEY="sb_secret_-OWqlLw2GUMh7iHOPEOvvA_hLkWwh5P"

echo "📦 Aplicando migración: fix_balance_comite_incluir_ventas.sql"
echo "=================================="

SQL_FILE="./supabase/migrations/20260110_fix_balance_comite_incluir_ventas.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Error: No se encuentra el archivo $SQL_FILE"
    exit 1
fi

echo "✅ Archivo encontrado"
echo "📤 Ejecutando SQL en Supabase..."

# Ejecutar usando curl con la API de Supabase
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$(cat $SQL_FILE | sed 's/"/\\"/g' | tr '\n' ' ')\"}"

echo ""
echo "=================================="
echo "✅ Migración aplicada"
echo ""
echo "Ahora la función obtener_balance_comite incluirá:"
echo "  - ✅ Ofrendas del comité"
echo "  - ✅ Pagos de ventas de proyectos"
echo "  - ✅ Gastos del comité"
