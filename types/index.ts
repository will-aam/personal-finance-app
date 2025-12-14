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
  // Os campos de automação foram removidos daqui, pois pertencem à interface Meta
}

export interface Meta {
  id: number;
  user_id?: string;
  nome: string;
  descricao?: string;
  link?: string;
  valor_total: number;
  valor_depositado: number;
  data_inicio: string;
  data_conclusao?: string;
  tipo: "vista" | "parcelado";
  fixada: boolean;
  parcelamentos?: any[]; // Podemos refinar isso depois se usar JSONB no Supabase
  created_at?: string;

  // CAMPOS DE AUTOMAÇÃO
  auto_deposito_ativo?: boolean;
  auto_valor?: number;
  auto_dia_cobranca?: number;
  auto_horario?: string; // <-- NOVO CAMPO ADICIONADO
  auto_data_inicio?: string;
  auto_meses_duracao?: number;
  auto_ultimo_processamento?: string;
}

export interface Categoria {
  id: number;
  nome: string;
  user_id?: string;
}
