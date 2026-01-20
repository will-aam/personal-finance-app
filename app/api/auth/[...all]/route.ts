// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth"; // Importa a configuração que fizemos no passo anterior
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
