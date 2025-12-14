// types/index.ts
export type TipoLancamento = "Receita" | "Despesa";

export interface Lancamento {
  id: number; // Vamos manter number por enquanto para compatibilidade, mas no futuro mudaremos para string (UUID)
  user_id?: string;
  descricao: string;
  link?: string;
  categoria: string;
  tipo: TipoLancamento;
  valor: number;
  forma_pagamento: string; // Mudamos de formaPagamento para snake_case (padrão banco de dados)
  data_vencimento: string; // Mudamos de diaVencimento (number) para data completa (string ISO)
  pago: boolean;
  observacoes?: string;
  created_at?: string;
}

export interface Meta {
  link: string | undefined;
  id: number;
  user_id?: string;
  nome: string;
  descricao?: string;
  valor_total: number;
  valor_depositado: number;
  data_inicio: string;
  data_conclusao?: string;
  tipo: "vista" | "parcelado";
  fixada: boolean;
  parcelamentos?: any[]; // Podemos refinar isso depois se usar JSONB no Supabase
  created_at?: string;
}

export interface Categoria {
  id: number;
  nome: string;
  user_id?: string;
}
