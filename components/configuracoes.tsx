// components/configuracoes.tsx
"use client";

import { Tag, CreditCard, Calendar, Target } from "lucide-react";
import { QuickActionCard } from "@/components/config/QuickActionCard";
import { ThemeToggleCard } from "@/components/config/ThemeToggleCard"; // Importe o novo componente
import { ListManagerCard } from "@/components/config/ListManagerCard";

interface ConfiguracoesProps {
  onNavigate?: (tab: string) => void;
}

export default function Configuracoes({ onNavigate }: ConfiguracoesProps) {
  // Removemos o useTheme daqui, pois agora ele está dentro do ThemeToggleCard

  const defaultCategorias = [
    "Contas Fixas",
    "Despesas Variáveis",
    "Lazer",
    "Educação",
    "Investimentos",
    "Receita",
    "Outros",
  ];

  const defaultFormasPagamento = [
    "Pix",
    "Cartão de Crédito",
    "Cartão de Débito",
    "Dinheiro",
    "Boleto",
    "Transferência",
    "Outros",
  ];

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      {/* Header Compacto */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      {/* GRID DE AÇÕES RÁPIDAS */}
      <div className="grid grid-cols-3 gap-3">
        {/* 1. Card de Aparência - Agora com o componente dedicado e funcional */}
        <ThemeToggleCard />

        {/* 2. Card de Metas */}
        <QuickActionCard
          icon={Target}
          label="Metas"
          onClick={() => onNavigate && onNavigate("metas")}
        />

        {/* 3. Card de Despesas Fixas */}
        <QuickActionCard
          icon={Calendar}
          label="Despesas Fixas"
          onClick={() => onNavigate && onNavigate("despesas_fixas")}
        />
      </div>

      {/* GERENCIADORES COMPACTOS */}
      <ListManagerCard
        title="Categorias"
        icon={Tag}
        initialItems={defaultCategorias}
        placeholderInput="Nova categoria"
      />

      <ListManagerCard
        title="Formas de Pagamento"
        icon={CreditCard}
        initialItems={defaultFormasPagamento}
        placeholderInput="Nova forma"
      />
    </div>
  );
}
