// app/components/receitas.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client"; // <--- NOVO IMPORT
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Loader2,
  TrendingUp,
  Wallet,
  Calculator,
  Pencil,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Importamos o mesmo seletor de mês bonito da outra página
import { MonthSelector } from "./lancamentos/MonthSelector";

interface ReceitaFixa {
  id: number;
  nome: string;
  valor: number;
  dia_recebimento: number;
}

export default function Receitas() {
  const { toast } = useToast();

  // --- USER SESSION ---
  const session = authClient.useSession();
  const userId = session.data?.user.id;

  const [receitas, setReceitas] = useState<ReceitaFixa[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para a "Calculadora"
  const [totalDespesasFixas, setTotalDespesasFixas] = useState(0);
  const [totalVariaveis, setTotalVariaveis] = useState(0);

  // Controle de Data
  const [date, setDate] = useState<Date>(new Date());
  const [mesReferencia, setMesReferencia] = useState(
    new Date().toISOString().slice(0, 7),
  );

  // Formulário de Nova/Edição Receita
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [novoNome, setNovoNome] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novoDia, setNovoDia] = useState("");

  // Sincroniza a data do seletor
  useEffect(() => {
    if (date) {
      const ano = date.getFullYear();
      const mes = String(date.getMonth() + 1).padStart(2, "0");
      setMesReferencia(`${ano}-${mes}`);
    }
  }, [date]);

  // 1. Carregar Receitas Fixas
  const fetchReceitas = useCallback(async () => {
    if (!userId) return; // Só busca se tiver usuário

    try {
      const { data, error } = await supabase
        .from("receitas_fixas")
        .select("*")
        .eq("user_id", userId) // <--- SEGURANÇA
        .order("valor", { ascending: false });
      if (error) throw error;
      setReceitas(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar receitas", error);
    }
  }, [userId]);

  // 2. Carregar Totais para a Calculadora
  const fetchTotaisCalculadora = useCallback(async () => {
    if (!userId) return; // Só busca se tiver usuário

    try {
      setLoading(true);

      // A. Buscar Total de Despesas Fixas DO USUÁRIO
      const { data: fixasData } = await supabase
        .from("despesas_fixas")
        .select("valor")
        .eq("user_id", userId); // <--- SEGURANÇA

      const somaFixas =
        fixasData?.reduce((acc, item) => acc + Number(item.valor), 0) || 0;
      setTotalDespesasFixas(somaFixas);

      // B. Buscar Despesas Variáveis DO USUÁRIO
      const [ano, mes] = mesReferencia.split("-");
      const inicio = `${mesReferencia}-01`;
      const fim = `${mesReferencia}-${new Date(Number(ano), Number(mes), 0).getDate()}`;

      const { data: variaveisData } = await supabase
        .from("lancamentos")
        .select("valor")
        .eq("user_id", userId) // <--- SEGURANÇA
        .eq("tipo", "Despesa")
        .gte("data_vencimento", inicio)
        .lte("data_vencimento", fim);

      const somaVariaveis =
        variaveisData?.reduce((acc, item) => acc + Number(item.valor), 0) || 0;
      setTotalVariaveis(somaVariaveis);
    } catch (error) {
      console.error("Erro na calculadora", error);
    } finally {
      setLoading(false);
    }
  }, [mesReferencia, userId]);

  useEffect(() => {
    if (userId) {
      fetchReceitas();
      fetchTotaisCalculadora();
    }
  }, [fetchReceitas, fetchTotaisCalculadora, userId]);

  // Limpar formulário
  const resetForm = () => {
    setNovoNome("");
    setNovoValor("");
    setNovoDia("");
    setEditingId(null);
    setIsFormOpen(false);
  };

  // Preparar Edição
  const handleEdit = (item: ReceitaFixa) => {
    setNovoNome(item.nome);
    setNovoValor(String(item.valor));
    setNovoDia(item.dia_recebimento ? String(item.dia_recebimento) : "");
    setEditingId(item.id);
    setIsFormOpen(true);
  };

  // Salvar (Criar ou Atualizar)
  const handleSave = async () => {
    if (!userId) return;
    if (!novoNome || !novoValor) {
      toast({ title: "Preencha nome e valor", variant: "destructive" });
      return;
    }

    try {
      const payload = {
        user_id: userId, // <--- SEGURANÇA: Vincula ao usuário
        nome: novoNome,
        valor: Number(novoValor),
        dia_recebimento: novoDia ? Number(novoDia) : null,
      };

      if (editingId) {
        // ATUALIZAR
        const { error } = await supabase
          .from("receitas_fixas")
          .update(payload)
          .eq("id", editingId)
          .eq("user_id", userId); // <--- SEGURANÇA
        if (error) throw error;
        toast({ title: "Renda atualizada!" });
      } else {
        // CRIAR NOVO
        const { error } = await supabase
          .from("receitas_fixas")
          .insert([payload]);
        if (error) throw error;
        toast({ title: "Renda adicionada!" });
      }

      resetForm();
      fetchReceitas();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExcluir = async (id: number) => {
    if (!userId) return;
    if (!confirm("Remover esta renda?")) return;
    try {
      await supabase
        .from("receitas_fixas")
        .delete()
        .eq("id", id)
        .eq("user_id", userId); // <--- SEGURANÇA

      setReceitas(receitas.filter((r) => r.id !== id));
      toast({ title: "Removido" });
    } catch (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  // CÁLCULOS FINAIS
  const totalReceitas = receitas.reduce((acc, item) => acc + item.valor, 0);
  const sobraAposFixas = totalReceitas - totalDespesasFixas;
  const saldoFinal = sobraAposFixas - totalVariaveis;

  const formatMoney = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6 p-4 md:p-6 pb-24 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planos</h1>
          <p className="text-muted-foreground text-sm">Planeje suas finanças</p>
        </div>
      </div>

      {/* --- BLOCO 1: CALCULADORA AUTOMÁTICA --- */}
      <Card className="border-l-4 border-l-primary bg-card/50 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-primary" />
              Resumo
            </CardTitle>

            {/* SELETOR DE MÊS */}
            <div className="w-auto">
              <MonthSelector date={date} setDate={setDate} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="space-y-3 text-sm">
            {/* 1. Entradas */}
            <div className="flex justify-between items-center text-green-500">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Total Receitas
              </span>
              <span className="font-bold text-base">
                {formatMoney(totalReceitas)}
              </span>
            </div>

            {/* 2. Menos Fixas */}
            <div className="flex justify-between items-center text-red-400/80">
              <span className="flex items-center gap-2 pl-2 border-l-2 border-red-400/20">
                (-) Contas Fixas
              </span>
              <span>{formatMoney(totalDespesasFixas)}</span>
            </div>

            {/* Linha Divisória */}
            <div className="flex justify-between items-center py-2 border-t border-dashed border-border/50 opacity-80">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Sobra após fixas
              </span>
              <span className="font-medium">{formatMoney(sobraAposFixas)}</span>
            </div>

            {/* 3. Menos Variáveis */}
            <div className="flex justify-between items-center text-orange-400/80">
              <span className="flex items-center gap-2 pl-2 border-l-2 border-orange-400/20">
                (-) Variáveis ({format(date, "MMM/yy", { locale: ptBR })})
              </span>
              <span>{formatMoney(totalVariaveis)}</span>
            </div>
          </div>

          {/* Resultado Final */}
          <div
            className={`mt-4 p-4 rounded-xl flex items-center justify-between border ${saldoFinal >= 0 ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Saldo Livre
              </p>
              <p className="text-xs text-muted-foreground">Previsão final</p>
            </div>
            <div
              className={`text-2xl font-bold ${saldoFinal >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {formatMoney(saldoFinal)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- BLOCO 2: CADASTRO DE RENDAS FIXAS --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Minhas Rendas Fixas</h3>

          {!isFormOpen ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Renda
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
          )}
        </div>

        {/* Formulário Expansível */}
        {isFormOpen && (
          <Card className="animate-in slide-in-from-top-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-muted-foreground">
                  {editingId ? "Editar Renda" : "Adicionar Nova Renda"}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-3 items-end">
                <div className="space-y-2">
                  <Label>Nome (ex: Salário, Estágio)</Label>
                  <Input
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Descrição"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <Button onClick={handleSave}>
                  {editingId ? "Salvar Alterações" : "Adicionar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Rendas */}
        <div className="grid gap-3 md:grid-cols-2">
          {receitas.map((item) => (
            <Card
              key={item.id}
              className="hover:bg-accent/50 transition-colors group"
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{item.nome}</p>
                    {item.dia_recebimento && (
                      <p className="text-xs text-muted-foreground">
                        Dia {item.dia_recebimento}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-600 mr-2">
                    {formatMoney(item.valor)}
                  </span>

                  {/* Botão Editar */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  {/* Botão Excluir */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    onClick={() => handleExcluir(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {receitas.length === 0 && !loading && (
            <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed rounded-lg">
              Nenhuma renda fixa cadastrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
