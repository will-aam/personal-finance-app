"use client";

import { Tag, CreditCard } from "lucide-react";
import { ThemeCard } from "@/components/config/ThemeCard";
import { GoalsCard } from "@/components/config/GoalsCard";
import { ListManagerCard } from "@/components/config/ListManagerCard";

interface ConfiguracoesProps {
  onNavigate?: (tab: string) => void;
}

export default function Configuracoes({ onNavigate }: ConfiguracoesProps) {
  // Dados iniciais (podem vir de um banco de dados no futuro)
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
    <div className="space-y-4 p-4 md:p-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Personalize seu app financeiro</p>
      </div>

      {/* Componentes Refatorados */}
      <ThemeCard />

      <GoalsCard onNavigate={onNavigate} />

      {/* Reutilizando o mesmo componente para duas coisas diferentes */}
      <ListManagerCard
        title="Categorias"
        icon={Tag}
        initialItems={defaultCategorias}
        placeholderInput="Nova Categoria (ex: Alimentação)"
      />

      <ListManagerCard
        title="Formas de Pagamento"
        icon={CreditCard}
        initialItems={defaultFormasPagamento}
        placeholderInput="Nova Forma (ex: Vale Refeição)"
      />
    </div>
  );
}
