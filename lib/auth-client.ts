// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Estamos forçando o endereço para não ter erro de leitura de variável
  baseURL: "https://fincappw.vercel.app",
});
