// components/dashboard.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  TrendingDown,
  Calendar,
  Target,
  Loader2,
  AlertCircle,
  Wallet,
  ArrowRight,
} from "lucide-react";

// Adicionamos a prop para navegação
interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [mesSelecionado, setMesSelecionado] = useState("todos");

  const [loading, setLoading] = useState(true);

  const [totalDespesas, setTotalDespesas] = useState(0);
  const [totalDespesasFixas, setTotalDespesasFixas] = useState(0); // Novo Estado
  const [categoriasChart, setCategoriasChart] = useState<any[]>([]);
  const [proximosVencimentos, setProximosVencimentos] = useState<any[]>([]);
  const [metaFixada, setMetaFixada] = useState<any>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // --- 1. Lançamentos (Variáveis) ---
      let query = supabase
        .from("lancamentos")
        .select("*")
        .eq("tipo", "Despesa");

      if (mesSelecionado !== "todos") {
        const [ano, mes] = mesSelecionado.split("-");
        const inicioMes = `${ano}-${mes}-01`;
        const fimMes = new Date(Number(ano), Number(mes), 0)
          .toISOString()
          .split("T")[0];
        query = query
          .gte("data_vencimento", inicioMes)
          .lte("data_vencimento", fimMes);
      }

      const { data: lancamentos, error } = await query;
      if (error) throw error;

      const total =
        lancamentos?.reduce((acc, curr) => acc + Number(curr.valor), 0) || 0;
      setTotalDespesas(total);

      // --- 2. Despesas Fixas (Total) ---
      // Buscamos todas as despesas fixas para somar o valor total comprometido
      const { data: fixas, error: errorFixas } = await supabase
        .from("despesas_fixas")
        .select("valor");

      if (!errorFixas && fixas) {
        const somaFixas = fixas.reduce(
          (acc, curr) => acc + Number(curr.valor),
          0
        );
        setTotalDespesasFixas(somaFixas);
      }

      // --- 3. Categorias ---
      const categoriasMap = lancamentos?.reduce((acc: any, curr) => {
        acc[curr.categoria] = (acc[curr.categoria] || 0) + Number(curr.valor);
        return acc;
      }, {});

      const chartData = Object.entries(categoriasMap || {})
        .map(([name, value]) => ({ name, value: Number(value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setCategoriasChart(chartData);

      // --- 4. Próximos Vencimentos ---
      const hoje = new Date().toISOString().split("T")[0];
      const { data: vencimentos } = await supabase
        .from("lancamentos")
        .select("*")
        .eq("pago", false)
        .eq("tipo", "Despesa")
        .gte("data_vencimento", hoje)
        .order("data_vencimento", { ascending: true })
        .limit(5);

      setProximosVencimentos(vencimentos || []);

      // --- 5. Meta Fixada ---
      const { data: metas } = await supabase
        .from("metas")
        .select("*")
        .eq("fixada", true)
        .limit(1);

      if (metas && metas.length > 0) {
        setMetaFixada(metas[0]);
      } else {
        setMetaFixada(null);
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [mesSelecionado]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const formatMoney = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-4 pb-20 animate-in fade-in slide-in-from-bottom-4 p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Visão Geral</h2>
        <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
          <SelectTrigger className="w-[140px] rounded-full border-primary/20 bg-background/50 backdrop-blur-sm">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="2025-01">Janeiro 2025</SelectItem>
            <SelectItem value="2025-02">Fevereiro 2025</SelectItem>
            <SelectItem value="2025-03">Março 2025</SelectItem>
            {/* Adicione mais meses conforme necessário */}
          </SelectContent>
        </Select>
      </div>

      {/* GRADE DE TOTAIS */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* CARD PRINCIPAL: Lançamentos Variáveis */}
        <Card className="border-none bg-linear-to-br from-red-950/30 to-background shadow-lg overflow-hidden relative">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-2 rounded-full bg-red-500/10 blur-3xl" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Gastos Variáveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tighter text-red-500">
              {formatMoney(totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lançados em{" "}
              {mesSelecionado === "todos" ? "todos os períodos" : "este mês"}
            </p>
          </CardContent>
        </Card>

        {/* NOVO CARD: Despesas Fixas (Clicável) */}
        <Card
          className="border-none bg-accent/20 hover:bg-accent/40 transition-all cursor-pointer shadow-sm group"
          onClick={() => onNavigate && onNavigate("despesas_fixas")}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Despesas Fixas
            </CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tighter">
              {formatMoney(totalDespesasFixas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Comprometido mensalmente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* META FIXADA */}
      {metaFixada && (
        <Card className="border-l-4 border-l-primary shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Meta: {metaFixada.nome}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Progresso</span>
                <span>
                  {Math.min(
                    (metaFixada.valor_depositado / metaFixada.valor_total) *
                      100,
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <Progress
                value={
                  (metaFixada.valor_depositado / metaFixada.valor_total) * 100
                }
                className="h-3 rounded-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>{formatMoney(metaFixada.valor_depositado)}</span>
                <span>de {formatMoney(metaFixada.valor_total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GRÁFICO E VENCIMENTOS */}
      <div className="grid gap-6 md:grid-cols-1">
        {/* GRÁFICO DE CATEGORIAS */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              Onde estou gastando?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoriasChart.length > 0 ? (
                categoriasChart.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">
                        {formatMoney(item.value)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-orange-500/80"
                        style={{
                          width: `${(item.value / totalDespesas) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Sem dados para este período.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PRÓXIMOS VENCIMENTOS */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Contas a Pagar (Próximas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proximosVencimentos.length > 0 ? (
                proximosVencimentos.map((item) => {
                  const dataVenc = new Date(item.data_vencimento);
                  const isAtrasado = dataVenc < new Date() && !item.pago;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium leading-none">
                          {item.descricao}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span
                            className={`flex items-center gap-1 ${
                              isAtrasado ? "text-red-500 font-bold" : ""
                            }`}
                          >
                            <Calendar className="h-3 w-3" />
                            {dataVenc.toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold block">
                          {formatMoney(item.valor)}
                        </span>
                        {isAtrasado && (
                          <span className="text-[10px] text-red-500 uppercase font-bold">
                            Vencido
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Tudo pago! Nenhuma conta pendente próxima.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
