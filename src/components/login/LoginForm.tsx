'use client'

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

export default function LoginForm() {
  const supabase = createClientComponentClient<Database>();
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
      // 1. Intentar login con Supabase Auth
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Error de login:', signInError);
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Credenciales inválidas. Por favor verifica tu email y contraseña.');
        }
        if (signInError.message.includes('Email not confirmed')) {
          throw new Error('Email no confirmado. Por favor revisa tu bandeja de entrada.');
        }
        throw new Error('Error al iniciar sesión. Por favor intenta de nuevo.');
      }

      if (!user) {
        throw new Error('No se pudo autenticar el usuario.');
      }

      // 2. Verificar el estado y rol del usuario
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('rol, estado')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error al obtener datos del usuario:', userError);
        throw new Error('Error al verificar el estado del usuario.');
      }

      // 3. Validar el estado del usuario
      if (!userData) {
        throw new Error('No se encontró el registro del usuario.');
      }

      if (userData.estado !== 'activo') {
        await supabase.auth.signOut(); // Cerrar sesión si el usuario no está activo
        throw new Error('Tu cuenta no está activa. Por favor contacta al administrador.');
      }

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error detallado:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    };
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-50'>
      <div className='max-w-md w-full space-y-8 bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100'>
        <div className='text-center'>
          <div className='flex justify-center mb-8'>
            <div className='relative group'>
              <div className='absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-1000'></div>
              <Image
                src='/LogoIpuc.png'
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
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
