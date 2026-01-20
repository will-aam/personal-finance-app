import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Tenta pegar o cookie de sessão do Better Auth
  const sessionCookie = request.cookies.get("better-auth.session_token");

  // Verifica em qual página o usuário está tentando entrar
  const currentPath = request.nextUrl.pathname;
  const isLoginPage = currentPath.startsWith("/login");

  // Ignora verificação para arquivos estáticos (imagens, css, icones) e API
  // Isso evita bloquear o logo, o favicon ou as rotas de autenticação
  const isStaticAsset =
    currentPath.startsWith("/api") ||
    currentPath.startsWith("/_next") ||
    currentPath.includes(".");

  if (isStaticAsset) {
    return NextResponse.next();
  }

  // REGRA 1: Se NÃO tem sessão e tenta acessar qualquer página (menos login) -> Manda pro Login
  if (!sessionCookie && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // REGRA 2: Se TEM sessão e tenta acessar a página de Login -> Manda pra Home
  if (sessionCookie && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Configuração para dizer ao Next.js onde esse middleware deve rodar
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
