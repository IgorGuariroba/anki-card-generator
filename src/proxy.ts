import { NextResponse, type NextRequest } from 'next/server';

const protectedPaths = ['/dashboard'];

export function proxy(request: NextRequest) {
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  const hasSession = Boolean(request.cookies.get('anki_session')?.value);

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
