export type TipoLancamento = "Receita" | "Despesa";

export interface Lancamento {
  id: number;
  user_id?: string;
  descricao: string;
  link?: string;
  categoria: string;
  tipo: TipoLancamento;
  valor: number;
  forma_pagamento: string;
  data_vencimento: string;
  pago: boolean;
  observacoes?: string;
  created_at?: string;
  // Os campos de automação foram removidos daqui
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
  parcelamentos?: any[];
  created_at?: string;

  // CAMPOS DE AUTOMAÇÃO MOVIDOS PARA AQUI
  auto_deposito_ativo?: boolean;
  auto_valor?: number;
  auto_dia_cobranca?: number;
  auto_data_inicio?: string;
  auto_meses_duracao?: number;
  auto_ultimo_processamento?: string;
}

export interface Categoria {
  id: number;
  nome: string;
  user_id?: string;
}
