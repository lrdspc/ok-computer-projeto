import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = request.nextUrl.pathname;

  // Redirect to login if not authenticated
  if (!session && (path.startsWith('/personal') || path.startsWith('/aluno'))) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (session && path.startsWith('/auth')) {
    // Check user type and redirect accordingly
    const { data: userData } = await supabase
      .from('usuarios')
      .select('tipo')
      .eq('auth_id', session.user.id)
      .single();

    if (userData?.tipo === 'personal') {
      return NextResponse.redirect(new URL('/personal/dashboard', request.url));
    } else if (userData?.tipo === 'aluno') {
      return NextResponse.redirect(new URL('/aluno/dashboard', request.url));
    }
  }

  // Protect personal routes
  if (session && path.startsWith('/personal')) {
    const { data: userData } = await supabase
      .from('usuarios')
      .select('tipo')
      .eq('auth_id', session.user.id)
      .single();

    if (userData?.tipo !== 'personal') {
      return NextResponse.redirect(new URL('/aluno/dashboard', request.url));
    }
  }

  // Protect aluno routes
  if (session && path.startsWith('/aluno')) {
    const { data: userData } = await supabase
      .from('usuarios')
      .select('tipo')
      .eq('auth_id', session.user.id)
      .single();

    if (userData?.tipo !== 'aluno') {
      return NextResponse.redirect(new URL('/personal/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
};