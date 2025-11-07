# Autenticación y Control de Acceso

## Roles y Permisos

### Roles Disponibles
- **admin**: Acceso total al sistema
- **tesorero**: Gestión de pagos y votos
- **usuario**: Acceso básico al dashboard
- **pendiente**: Usuario registrado sin permisos asignados

### Estados de Usuario
- **activo**: Usuario con acceso completo a sus permisos
- **inactivo**: Usuario sin acceso al sistema
- **pendiente**: Usuario en espera de activación

## Flujos de Autenticación

### Verificación de Sesión
1. **Nivel Servidor (Server-Side)**
   ```typescript
   const { data: { session }, error: sessionError } = await supabase.auth.getSession()
   if (!session || !session.user) {
     redirect('/login?redirect=' + encodeURIComponent(currentPath))
   }
   ```

2. **Nivel Cliente (Client-Side)**
   ```typescript
   const { data: { session }, error } = await supabase.auth.getSession()
   if (!session) {
     router.replace('/login?redirect=' + encodeURIComponent(window.location.pathname))
   }
   ```

### Verificación de Permisos

1. **Consulta de Permisos**
   ```typescript
   const { data: usuario, error: userError } = await supabase
     .from('usuarios')
     .select('rol')
     .eq('id', session.user.id)
     .single()
   ```

2. **Validación de Roles**
   ```typescript
   if (!['admin', 'tesorero'].includes(usuario.rol)) {
     redirect('/dashboard?error=acceso-denegado')
   }
   ```

## Páginas Protegidas

### Pagos
- **Ruta**: `/dashboard/pagos/*`
- **Roles permitidos**: `admin`, `tesorero`
- **Verificaciones**:
  1. Sesión activa
  2. Usuario existe en la base de datos
  3. Rol apropiado

### Votos
- **Ruta**: `/dashboard/votos/*`
- **Roles permitidos**: `admin`, `tesorero`
- **Verificaciones**:
  1. Sesión activa
  2. Usuario existe en la base de datos
  3. Rol apropiado

## Mejores Prácticas

### Seguridad
1. Siempre verificar la sesión tanto en el servidor como en el cliente
2. Usar `getSession()` para verificaciones iniciales
3. Implementar `onAuthStateChange` para detectar cambios en la sesión
4. Redirigir con URL de retorno para mejor UX

### Manejo de Errores
1. Proporcionar mensajes de error claros
2. Redirigir a páginas apropiadas según el tipo de error:
   - `/login`: Para sesiones expiradas
   - `/dashboard?error=acceso-denegado`: Para problemas de permisos
   - `/dashboard?error=usuario-inactivo`: Para usuarios desactivados

### Actualizaciones de Estado
1. Mantener la caché actualizada con `router.refresh()`
2. Esperar a que las actualizaciones se completen antes de redireccionar

## Ejemplos de Código

### Protección de Rutas (Server Component)
```typescript
export default async function ProtectedPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        }
      }
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', session.user.id)
    .single()

  if (!usuario || !['admin', 'tesorero'].includes(usuario.rol)) {
    redirect('/dashboard?error=acceso-denegado')
  }

  // Resto del código de la página...
}
```

### Componente Cliente con Auth
```typescript
'use client'

export default function ProtectedComponent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      setIsAuthenticated(true)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase])

  if (!isAuthenticated) {
    return <div>Verificando autenticación...</div>
  }

  // Resto del componente...
}
```