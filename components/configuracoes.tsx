// components/configuracoes.tsx
"use client";

import { Tag, CreditCard, Calendar, Target, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { QuickActionCard } from "@/components/config/QuickActionCard";
import { ListManagerCard } from "@/components/config/ListManagerCard";

interface ConfiguracoesProps {
  onNavigate?: (tab: string) => void;
}

export default function Configuracoes({ onNavigate }: ConfiguracoesProps) {
  const { setTheme, theme } = useTheme();

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
        <QuickActionCard
          icon={Palette}
          label="Aparência"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        />
        <QuickActionCard
          icon={Target}
          label="Metas"
          onClick={() => onNavigate && onNavigate("metas")}
        />
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
