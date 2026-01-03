import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    // Get user type and redirect accordingly
    const { data: userData } = await supabase
      .from('usuarios')
      .select('tipo')
      .eq('auth_id', session.user.id)
      .single();

    if (userData?.tipo === 'personal') {
      redirect('/personal/dashboard');
    } else if (userData?.tipo === 'aluno') {
      redirect('/aluno/dashboard');
    }
  }

  // If no session, redirect to login
  redirect('/auth/login');
}