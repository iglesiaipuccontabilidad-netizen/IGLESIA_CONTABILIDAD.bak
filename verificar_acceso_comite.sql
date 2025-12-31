-- Script para verificar acceso del usuario al comité
-- Ejecutar en Supabase SQL Editor o mediante psql

-- 1. Ver información del usuario aquilarjuan123@gmail.com
SELECT id, email, rol, estado 
FROM usuarios 
WHERE email = 'aquilarjuan123@gmail.com';

-- 2. Ver los comités que existen
SELECT id, nombre, estado 
FROM comites 
WHERE estado = 'activo';

-- 3. Ver las asignaciones de este usuario a comités
SELECT 
  cu.id,
  cu.usuario_id,
  cu.comite_id,
  cu.rol,
  cu.estado,
  c.nombre as comite_nombre,
  u.email as usuario_email
FROM comite_usuarios cu
JOIN comites c ON c.id = cu.comite_id
JOIN usuarios u ON u.id = cu.usuario_id
WHERE u.email = 'aquilarjuan123@gmail.com';

-- 4. Si no hay asignaciones, crearla (ajustar los IDs según los resultados anteriores)
-- Descomentar y ejecutar si es necesario:
/*
INSERT INTO comite_usuarios (
  usuario_id,
  comite_id,
  rol,
  estado,
  fecha_ingreso
) VALUES (
  (SELECT id FROM usuarios WHERE email = 'aquilarjuan123@gmail.com'),
  (SELECT id FROM comites WHERE nombre = 'DECOM' LIMIT 1),
  'lider',
  'activo',
  NOW()
);
*/
