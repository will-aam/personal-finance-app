// components/despesas-fixas.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  TrendingDown,
  Wallet,
  X,
  Pencil,
  Rocket,
  Loader2,
  Check,
  CheckCircle2, // <--- Novo ícone para indicar que já foi feito no mês
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EditFixedExpenseDialog } from "./EditFixedExpenseDialog";

// Interfaces
interface DespesaFixa {
  id: number;
  nome: string;
  valor: number;
  dia_vencimento: number;
  categoria?: string;
  forma_pagamento?: string;
}

interface ItemOpcao {
  id: number;
  nome: string;
}

export default function DespesasFixas() {
  // Estados Básicos
  const [despesas, setDespesas] = useState<DespesaFixa[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const session = authClient.useSession();
  const userId = session.data?.user.id;

  // Estados do Layout
  const [modoQuinzenal, setModoQuinzenal] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Estados de Controle (Já lançado no mês?)
  const [nomesLancadosEsteMes, setNomesLancadosEsteMes] = useState<string[]>(
    [],
  );

  // Estados de Feedback Visual (Loading temporário do botão)
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Estados do Formulário de Adição
  const [novoNome, setNovoNome] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novoDia, setNovoDia] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novoPagamento, setNovoPagamento] = useState("");

  // Opções do Banco
  const [categoriasDB, setCategoriasDB] = useState<ItemOpcao[]>([]);
  const [formasPagamentoDB, setFormasPagamentoDB] = useState<ItemOpcao[]>([]);

  // Edição
  const [editingExpense, setEditingExpense] = useState<DespesaFixa | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const formatMoney = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // --- BUSCA DADOS ---
  const fetchData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);

      // 1. Busca as Despesas Fixas
      const { data: despesasData } = await supabase
        .from("despesas_fixas")
        .select("*")
        .eq("user_id", userId)
        .order("dia_vencimento", { ascending: true });

      if (despesasData) setDespesas(despesasData);

      // 2. Busca lançamentos DO MÊS ATUAL para verificar duplicidade
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, "0"); // "02"
      const dataInicio = `${ano}-${mes}-01`;
      const ultimoDia = new Date(ano, hoje.getMonth() + 1, 0).getDate();
      const dataFim = `${ano}-${mes}-${ultimoDia}`;

      const { data: lancamentosMes } = await supabase
        .from("lancamentos")
        .select("descricao") // Só precisamos do nome para comparar
        .eq("user_id", userId)
        .gte("data_vencimento", dataInicio)
        .lte("data_vencimento", dataFim);

      if (lancamentosMes) {
        // Cria uma lista simples com os nomes: ["Internet", "Aluguel", ...]
        const nomes = lancamentosMes.map((l) => l.descricao);
        setNomesLancadosEsteMes(nomes);
      }

      // 3. Busca opções (Categorias/Pagamentos)
      const { data: cat } = await supabase
        .from("categorias")
        .select("*")
        .order("nome");
      if (cat) setCategoriasDB(cat);

      const { data: pay } = await supabase
        .from("formas_pagamento")
        .select("*")
        .order("nome");
      if (pay) setFormasPagamentoDB(pay);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId, fetchData]);

  // Cálculos do Resumo
  const totalComprometido = despesas.reduce(
    (acc, curr) => acc + Number(curr.valor),
    0,
  );

  const totalPagamentoDia05 = despesas
    .filter((d) => d.dia_vencimento <= 10)
    .reduce((acc, curr) => acc + Number(curr.valor), 0);

  const totalPagamentoDia15 = despesas
    .filter((d) => d.dia_vencimento > 10)
    .reduce((acc, curr) => acc + Number(curr.valor), 0);

  const handleAdicionar = async () => {
    if (!userId) return;
    if (!novoNome || !novoValor || !novoDia) {
      toast({
        title: "Preencha os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("despesas_fixas").insert([
        {
          user_id: userId,
          nome: novoNome,
          valor: Number(novoValor),
          dia_vencimento: Number(novoDia),
          categoria: novaCategoria || "Contas Fixas",
          forma_pagamento: novoPagamento || "Pix",
        },
      ]);

      if (error) throw error;

      toast({ title: "Despesa fixa adicionada!" });
      setNovoNome("");
      setNovoValor("");
      setNovoDia("");
      setNovaCategoria("");
      setNovoPagamento("");
      setIsFormOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover esta despesa fixa?")) return;
    const { error } = await supabase
      .from("despesas_fixas")
      .delete()
      .eq("id", id);
    if (!error) {
      toast({ title: "Removido com sucesso" });
      fetchData();
    }
  };

  // --- LÓGICA DE LANÇAMENTO ---
  const handleLancarAgora = async (despesa: DespesaFixa) => {
    if (!userId) return;

    setLoadingId(despesa.id);

    try {
      const hoje = new Date();
      const anoAtual = hoje.getFullYear();
      const mesAtual = hoje.getMonth();
      const dataVencimento = new Date(
        anoAtual,
        mesAtual,
        despesa.dia_vencimento,
      );
      const dataFormatada = dataVencimento.toISOString().split("T")[0];

      await new Promise((resolve) => setTimeout(resolve, 600));

      const { error } = await supabase.from("lancamentos").insert([
        {
          user_id: userId,
          descricao: despesa.nome,
          valor: despesa.valor,
          tipo: "Despesa",
          categoria: despesa.categoria || "Contas Fixas",
          forma_pagamento: despesa.forma_pagamento || "Pix",
          data_vencimento: dataFormatada,
          pago: true,
        },
      ]);

      if (error) throw error;

      // ATUALIZA A LISTA LOCALMENTE (Sem precisar refetch)
      // Adiciona o nome dessa despesa na lista de "já lançados"
      setNomesLancadosEsteMes((prev) => [...prev, despesa.nome]);

      toast({
        title: "Lançamento Realizado! 🚀",
        description: `${despesa.nome} foi lançado para este mês.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao lançar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 pb-24 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Despesas Fixas</h1>
          <p className="text-muted-foreground">
            Gerencie seus gastos recorrentes
          </p>
        </div>
      </div>

      {/* CARD RESUMO */}
      <Card className="from-red-950/20 to-red-900/10 border-red-900/30 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-xl"></div>
        <CardContent className="p-6 relative">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                  <TrendingDown className="h-7 w-7 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Mensal
                  </p>
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    {formatMoney(totalComprometido)}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity scale-90 origin-top-right">
                <Label
                  htmlFor="quinzena-mode"
                  className="text-[10px] text-muted-foreground uppercase cursor-pointer tracking-wider font-semibold"
                >
                  Quinzenal
                </Label>
                <Switch
                  id="quinzena-mode"
                  checked={modoQuinzenal}
                  onCheckedChange={setModoQuinzenal}
                  className="scale-75 data-[state=checked]:bg-red-500"
                />
              </div>
            </div>

            {modoQuinzenal && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 pt-2">
                <div className="from-blue-500/5 to-blue-600/5 rounded-xl p-4 border border-blue-500/10 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                      Dia 05
                    </span>
                  </div>
                  <p className="text-xl font-bold text-blue-500">
                    {formatMoney(totalPagamentoDia05)}
                  </p>
                </div>
                <div className="from-green-500/5 to-green-600/5 rounded-xl p-4 border border-green-500/10 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-green-400" />
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">
                      Dia 15
                    </span>
                  </div>
                  <p className="text-xl font-bold text-green-500">
                    {formatMoney(totalPagamentoDia15)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* BOTÃO ADICIONAR */}
      <div className="space-y-4">
        {!isFormOpen ? (
          <Button
            onClick={() => setIsFormOpen(true)}
            variant="outline"
            className="w-full h-12 border-dashed border-muted-foreground/20 hover:bg-accent hover:border-solid transition-all rounded-xl gap-2 text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
            Adicionar Nova Despesa
          </Button>
        ) : (
          <Card className="animate-in zoom-in-95 duration-200 border-primary/20 bg-card/60">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Nova Conta</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-12 items-end">
                <div className="md:col-span-3 space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex: Internet"
                    autoFocus
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Vencimento (Dia)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={novoDia}
                    onChange={(e) => setNovoDia(e.target.value)}
                    placeholder="Dia"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={novaCategoria}
                    onValueChange={setNovaCategoria}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasDB.map((c) => (
                        <SelectItem key={c.id} value={c.nome}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Pagamento</Label>
                  <Select
                    value={novoPagamento}
                    onValueChange={setNovoPagamento}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {formasPagamentoDB.map((f) => (
                        <SelectItem key={f.id} value={f.nome}>
                          {f.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1">
                  <Button
                    onClick={handleAdicionar}
                    className="w-full bg-primary text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* LISTA */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {despesas.map((despesa) => {
          // VERIFICAÇÃO: O nome dessa despesa está na lista de lançados do mês?
          const jaLancadoNoMes = nomesLancadosEsteMes.includes(despesa.nome);

          return (
            <Card
              key={despesa.id}
              className={`relative group transition-colors ${jaLancadoNoMes ? "bg-muted/30 border-dashed" : "hover:border-primary/50"}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle
                    className={`text-lg ${jaLancadoNoMes ? "text-muted-foreground" : ""}`}
                  >
                    {despesa.nome}
                  </CardTitle>
                  <div className="flex gap-1">
                    {/* LÓGICA DO BOTÃO MUDOU AQUI */}
                    {jaLancadoNoMes ? (
                      // Se já lançou, mostra botão de check desabilitado
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled
                        className="h-8 w-8 text-muted-foreground cursor-not-allowed"
                        title="Já lançado neste mês"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      // Se NÃO lançou, mostra o foguete
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={loadingId === despesa.id}
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                        title="Lançar este mês como Pago"
                        onClick={() => handleLancarAgora(despesa)}
                      >
                        {loadingId === despesa.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Rocket className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setEditingExpense(despesa);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(despesa.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Vence todo dia {despesa.dia_vencimento}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold mb-2 ${jaLancadoNoMes ? "text-muted-foreground" : ""}`}
                >
                  {formatMoney(despesa.valor)}
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                  {despesa.categoria && (
                    <span className="bg-secondary px-2 py-1 rounded border">
                      {despesa.categoria}
                    </span>
                  )}
                  {despesa.forma_pagamento && (
                    <span className="bg-secondary px-2 py-1 rounded border">
                      {despesa.forma_pagamento}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {despesas.length === 0 && !loading && (
          <div className="col-span-full text-center py-10 text-muted-foreground border border-dashed rounded-lg">
            Nenhuma despesa fixa cadastrada.
          </div>
        )}
      </div>

      <EditFixedExpenseDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        expense={editingExpense}
        onSuccess={fetchData}
        categorias={categoriasDB}
        formasPagamento={formasPagamentoDB}
      />
    </div>
  );
}
