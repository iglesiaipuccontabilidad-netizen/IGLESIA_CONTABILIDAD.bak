-- Verificar usuario admin
SELECT 
  id,
  email,
  rol,
  estado,
  created_at
FROM usuarios
WHERE email = 'admin@ipuc.com';
