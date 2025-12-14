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
  CreditCard,
  CheckCircle,
  AlertCircle,
  Target,
  Loader2,
} from "lucide-react";

export default function Dashboard() {
  const [mesSelecionado, setMesSelecionado] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [loading, setLoading] = useState(true);

  const [totalDespesas, setTotalDespesas] = useState(0);
  const [categoriasChart, setCategoriasChart] = useState<any[]>([]);
  const [proximosVencimentos, setProximosVencimentos] = useState<any[]>([]);
  const [metaFixada, setMetaFixada] = useState<any>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 1. Buscar Lançamentos
      let query = supabase.from("lancamentos").select("*");

      if (mesSelecionado !== "todos") {
        const [ano, mes] = mesSelecionado.split("-");
        const dataInicio = `${mesSelecionado}-01`;
        const dataFim = `${mesSelecionado}-${new Date(
          parseInt(ano),
          parseInt(mes),
          0
        ).getDate()}`;

        query = query
          .gte("data_vencimento", dataInicio)
          .lte("data_vencimento", dataFim);
      }

      const { data: lancamentos, error: erroLancamentos } = await query;

      if (erroLancamentos) throw erroLancamentos;

      let totalDespesas = 0;
      const categoriasMap = new Map();

      lancamentos?.forEach((l) => {
        const valor = Number(l.valor) || 0;
        if (l.tipo === "Despesa") {
          totalDespesas += valor;
          const atual = categoriasMap.get(l.categoria) || 0;
          categoriasMap.set(l.categoria, atual + valor);
        }
      });

      setTotalDespesas(totalDespesas);

      const cores = [
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))",
      ];

      const dadosGrafico = Array.from(categoriasMap.entries())
        .map(([name, value], index) => ({
          name,
          value,
          fill: cores[index % cores.length],
        }))
        .sort((a, b) => b.value - a.value);

      setCategoriasChart(dadosGrafico);

      // 2. Buscar Vencimentos
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

      // 3. Buscar Meta
      const { data: meta, error: erroMeta } = await supabase
        .from("metas")
        .select("*")
        .eq("fixada", true)
        .limit(1)
        .maybeSingle();

      if (!erroMeta) {
        setMetaFixada(meta);
      }
    } catch (error) {
      console.error("Erro no dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [mesSelecionado]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const calcularProgresso = () => {
    if (!metaFixada || !metaFixada.valor_total || metaFixada.valor_total === 0)
      return 0;
    return Math.min(
      ((metaFixada.valor_depositado || 0) / metaFixada.valor_total) * 100,
      100
    );
  };

  // Gera lista de meses e adiciona a opção "Todos" no início
  const mesesOpcoes = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = d.toISOString().slice(0, 7);
    const label = d.toLocaleString("pt-BR", { month: "long", year: "numeric" });
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });

  // Adiciona opção "Geral (Todos)"
  mesesOpcoes.unshift({ value: "todos", label: "Geral (Todos)" });

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-balance">
            Controle de Despesas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe suas metas e despesas
          </p>
        </div>
        <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {mesesOpcoes.map((mes) => (
              <SelectItem key={mes.value} value={mes.value}>
                {mes.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards Principais - Otimizados para Mobile */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {/* Card de Despesas */}
        <Card className="border-l-4 border-l-destructive hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Despesas
            </CardTitle>
            <div className="rounded-full bg-destructive/10 p-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {totalDespesas.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mesSelecionado === "todos"
                ? "Todas as despesas"
                : "Total de saídas do mês"}
            </p>
          </CardContent>
        </Card>

        {/* Card de Meta Fixada */}
        {metaFixada && (
          <Card className="border-l-4 border-l-primary hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Meta Fixada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-bold text-lg">{metaFixada.nome}</h3>
                <p className="text-sm text-muted-foreground">
                  {Number(metaFixada.valor_depositado || 0).toLocaleString(
                    "pt-BR",
                    { style: "currency", currency: "BRL" }
                  )}{" "}
                  de{" "}
                  {Number(metaFixada.valor_total || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold">
                    {calcularProgresso().toFixed(1)}%
                  </span>
                </div>
                <Progress value={calcularProgresso()} className="h-3" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cards Secundários - Otimizados para Mobile */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Despesas por Categoria */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoriasChart.length > 0 ? (
              <div className="space-y-3">
                {categoriasChart.map((cat, idx) => {
                  const percentual =
                    totalDespesas > 0 ? (cat.value / totalDespesas) * 100 : 0;
                  return (
                    <div
                      key={idx}
                      className="group relative overflow-hidden rounded-lg border bg-card p-3 transition-all hover:shadow-md hover:border-primary/50"
                    >
                      <div
                        className="absolute inset-0 opacity-5 transition-all group-hover:opacity-10"
                        style={{
                          background: `linear-gradient(to right, ${cat.fill} ${percentual}%, transparent ${percentual}%)`,
                        }}
                      />
                      <div className="relative flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: `${cat.fill}20` }}
                          >
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: cat.fill }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">
                              {cat.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {percentual.toFixed(1)}% do total
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-base font-bold">
                            {cat.value.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <p>Nenhuma despesa neste período.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximos Vencimentos */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proximosVencimentos.length > 0 ? (
                proximosVencimentos.map((item) => {
                  const hoje = new Date();
                  const vencimento = new Date(item.data_vencimento);
                  vencimento.setHours(23, 59, 59, 999);
                  const isAtrasado = vencimento < hoje && !item.pago;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-start justify-between gap-4 rounded-lg border p-3 ${
                        isAtrasado ? "border-destructive bg-destructive/5" : ""
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {item.descricao}
                          </span>
                          {item.pago ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : isAtrasado ? (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          ) : null}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.data_vencimento).toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {item.forma_pagamento}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`text-right ${
                          isAtrasado ? "text-destructive" : ""
                        }`}
                      >
                        <div className="font-bold text-sm">
                          {Number(item.valor).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </div>
                        {isAtrasado && (
                          <span className="text-xs text-destructive">
                            Atrasado
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <p>Nenhuma conta pendente próxima.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
