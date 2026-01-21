// lib/auth.ts
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  // 👇 AQUI ESTÁ A CORREÇÃO DO LOOP INFINITO 👇
  trustedOrigins: [
    "https://fincappw.vercel.app", // Seu site em produção
    "http://localhost:3000", // Seu localhost
  ],
  baseURL: "https://fincappw.vercel.app", // Forçando a URL correta
});
