'use client'

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 [Login] Iniciando proceso de autenticación...');
      const supabase = getSupabaseBrowserClient();
      
      // PASO 1: Limpiar cualquier sesión anterior
      console.log('🧹 [Login] Limpiando sesión anterior...');
      await supabase.auth.signOut({ scope: 'local' });
      
      // Limpiar localStorage y sessionStorage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Pequeña pausa para asegurar que la limpieza se complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // PASO 2: Iniciar sesión con las nuevas credenciales
      console.log('🔐 [Login] Iniciando nueva sesión para:', email);
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('❌ [Login] Error:', signInError);
        throw signInError;
      }

      if (!user) {
        throw new Error('No se pudo obtener el usuario');
      }

      console.log('✅ [Login] Sesión iniciada correctamente');
      console.log('👤 [Login] Usuario ID:', user.id);
      console.log('📧 [Login] Email:', user.email);
      
      // PASO 3: Validar que la sesión es correcta
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No se pudo validar la sesión');
      }
      
      console.log('✅ [Login] Sesión validada correctamente');
      console.log('🔑 [Login] Session user:', session.user.email);
      
      // PASO 4: Verificar que el usuario existe en la tabla usuarios
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, email, rol, estado')
        .eq('id', user.id)
        .maybeSingle();
      
      if (userError) {
        console.error('❌ [Login] Error al verificar usuario:', userError);
        throw new Error('Error al verificar usuario en la base de datos');
      }
      
      if (!userData) {
        throw new Error('Usuario no encontrado en la base de datos');
      }
      
      console.log('✅ [Login] Usuario verificado en BD');
      console.log('👤 [Login] Datos usuario:', { email: userData.email, rol: userData.rol, estado: userData.estado });
      
      // Esperar un poco más para que la sesión se propague completamente
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // PASO 5: Redirigir al dashboard usando window.location para forzar recarga completa
      console.log('🚀 [Login] Redirigiendo a dashboard...');
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('❌ [Login] Error al iniciar sesión:', err);
      setError(err.message || 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-50'>
      <div className='max-w-md w-full space-y-8 bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100'>
        <div className='text-center'>
          <div className='flex justify-center mb-8'>
            <div className='relative group'>
              <div className='absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-1000'></div>
              <Image
                src='/logo-ipuc.png'
                alt='IPUC Logo'
                width={130}
                height={130}
                className='relative rounded-full shadow-lg transform hover:scale-105 transition duration-300'
              />
            </div>
          </div>
          <h2 className='mt-6 text-3xl font-bold text-gray-900 tracking-tight'>
            �Bienvenido!
          </h2>
          <p className='mt-3 text-gray-600'>
            Ingresa a tu cuenta para continuar
          </p>
        </div>
        
        <form className='mt-10 space-y-6' onSubmit={handleSubmit}>
          <div className='space-y-5'>
            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-1'>
              Correo electrónico
              </label>
              <input
              id='email'
              name='email'
              type='email'
              required
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className='appearance-none block w-full px-4 py-3.5 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 hover:border-gray-400'
              placeholder='ejemplo@correo.com'
              />
            </div>
            <div>
              <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-1'>
              Contraseña
              </label>
              <input
              id='password'
              name='password'
              type='password'
              required
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className='appearance-none block w-full px-4 py-3.5 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 hover:border-gray-400'
              placeholder=''
              />
            </div>
          </div>

          {error && (
            <div className='bg-red-50 border-l-4 border-red-400 p-4 rounded-lg'>
              <div className='flex'>
                <div className='flex-shrink-0'>
                  <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor'>
                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
                  </svg>
                </div>
                <div className='ml-3'>
                  <p className='text-sm text-red-700'>{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type='submit'
              disabled={loading}
              className='group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-medium rounded-xl text-white shadow-sm bg-blue-600 hover:bg-blue-700 transition duration-200'
            >
              {loading ? (
                <svg className='animate-spin -ml-1 mr-3 h-5 w-5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                </svg>
              ) : null}
              {loading ? 'Iniciando sesi�n...' : 'Iniciar sesi�n'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
