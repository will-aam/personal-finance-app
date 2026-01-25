import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Verifica se é rota pública (Login ou Cadastro)
  const isPublicRoute = path === "/login" || path === "/sign-up";

  // 2. PEGAR O COOKIE (O Segredo do Loop Infinito)
  // Na Vercel (HTTPS), o cookie pode ganhar o prefixo "__Secure-"
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  // 3. Se NÃO tem sessão e tenta acessar página protegida -> Manda pro Login
  if (!sessionToken && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Se TEM sessão e tenta acessar Login -> Manda pra Home
  if (sessionToken && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// middleware.ts (apenas a parte do config no final)

export const config = {
  // ADICIONEI: sw.js, manifest.json, workbox-.* e extensões de imagem
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|workbox-.*|.*\\.png|.*\\.jpg).*)",
  ],
};
