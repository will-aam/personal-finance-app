// components/configuracoes.tsx
"use client";

import { Tag, CreditCard, Calendar, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

      {/* 1. Card de Tema */}
      <ThemeCard />

      {/* 2. NOVO LINK PARA DESPESAS FIXAS (Substitui o formulário antigo) */}
      <Card
        className="hover:border-primary/50 transition-all cursor-pointer hover:shadow-md group"
        onClick={() => onNavigate && onNavigate("despesas_fixas")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2 group-hover:text-primary transition-colors">
            <Calendar className="h-5 w-5 text-primary" />
            Despesas Fixas Mensais
          </CardTitle>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Gerencie aluguel, assinaturas e contas recorrentes em uma tela
            dedicada.
          </div>
          <Button
            variant="link"
            className="p-0 h-auto mt-2 text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate && onNavigate("despesas_fixas");
            }}
          >
            Acessar Gerenciador &rarr;
          </Button>
        </CardContent>
      </Card>

      {/* 3. Card de Metas */}
      <GoalsCard onNavigate={onNavigate} />

      {/* 4. Gerenciador de Categorias */}
      <ListManagerCard
        title="Categorias"
        icon={Tag}
        initialItems={defaultCategorias}
        placeholderInput="Nova Categoria (ex: Alimentação)"
      />

      {/* 5. Gerenciador de Formas de Pagamento */}
      <ListManagerCard
        title="Formas de Pagamento"
        icon={CreditCard}
        initialItems={defaultFormasPagamento}
        placeholderInput="Nova Forma (ex: Vale Refeição)"
      />
    </div>
  );
}
