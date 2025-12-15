"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  User,
  Tag,
  CreditCard,
  Moon,
  Sun,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ConfiguracoesProps {
  onNavigate?: (tab: string) => void;
}

export default function Configuracoes({ onNavigate }: ConfiguracoesProps) {
  const [nomeUsuario, setNomeUsuario] = useState("Will");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [categorias, setCategorias] = useState([
    "Contas Fixas",
    "Despesas Variáveis",
    "Lazer",
    "Educação",
    "Investimentos",
    "Receita",
    "Outros",
  ]);
  const [formasPagamento, setFormasPagamento] = useState([
    "Pix",
    "Cartão de Crédito",
    "Cartão de Débito",
    "Dinheiro",
    "Boleto",
    "Transferência",
    "Outros",
  ]);

  const [novaCategoria, setNovaCategoria] = useState("");
  const [novaFormaPagamento, setNovaFormaPagamento] = useState("");
  const [categoriasExpanded, setCategoriasExpanded] = useState(false);
  const [formasExpanded, setFormasExpanded] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const adicionarCategoria = () => {
    if (novaCategoria.trim() && !categorias.includes(novaCategoria.trim())) {
      setCategorias([...categorias, novaCategoria.trim()]);
      setNovaCategoria("");
    }
  };

  const removerCategoria = (categoria: string) => {
    setCategorias(categorias.filter((c) => c !== categoria));
  };

  const adicionarFormaPagamento = () => {
    if (
      novaFormaPagamento.trim() &&
      !formasPagamento.includes(novaFormaPagamento.trim())
    ) {
      setFormasPagamento([...formasPagamento, novaFormaPagamento.trim()]);
      setNovaFormaPagamento("");
    }
  };

  const removerFormaPagamento = (forma: string) => {
    setFormasPagamento(formasPagamento.filter((f) => f !== forma));
  };

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Personalize seu app financeiro</p>
      </div>

      {/* Card de Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            Aparência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Tema do Aplicativo</Label>
              <p className="text-sm text-muted-foreground">
                Escolha entre tema claro ou escuro
              </p>
            </div>
            <Button variant="outline" onClick={toggleTheme} className="gap-2">
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" />
                  Claro
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  Escuro
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card de Metas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Gerenciar Metas</Label>
              <p className="text-sm text-muted-foreground">
                Acesse a página de metas para criar e acompanhar seus objetivos
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => onNavigate && onNavigate("metas")}
              className="gap-2"
            >
              <Target className="h-4 w-4" />
              Acessar Metas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card de Categorias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categorias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Adicionar Nova Categoria</Label>
            <div className="flex gap-2">
              <Input
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                placeholder="Nome da categoria"
                onKeyPress={(e) => e.key === "Enter" && adicionarCategoria()}
              />
              <Button onClick={adicionarCategoria}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Categorias Existentes ({categorias.length})</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCategoriasExpanded(!categoriasExpanded)}
                className="gap-1"
              >
                {categoriasExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Exibir
                  </>
                )}
              </Button>
            </div>

            {categoriasExpanded && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categorias.map((categoria, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <span className="text-sm">{categoria}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removerCategoria(categoria)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card de Formas de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Formas de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Adicionar Nova Forma</Label>
            <div className="flex gap-2">
              <Input
                value={novaFormaPagamento}
                onChange={(e) => setNovaFormaPagamento(e.target.value)}
                placeholder="Nome da forma de pagamento"
                onKeyPress={(e) =>
                  e.key === "Enter" && adicionarFormaPagamento()
                }
              />
              <Button onClick={adicionarFormaPagamento}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Formas Existentes ({formasPagamento.length})</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFormasExpanded(!formasExpanded)}
                className="gap-1"
              >
                {formasExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Exibir
                  </>
                )}
              </Button>
            </div>

            {formasExpanded && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {formasPagamento.map((forma, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <span className="text-sm">{forma}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removerFormaPagamento(forma)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
