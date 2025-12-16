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
  TrendingUp,
} from "lucide-react";
import { Button } from "./ui/button";

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  // Estado do Filtro
  const [mesSelecionado, setMesSelecionado] = useState("todos");
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);

  // Estados de Dados
  const [loading, setLoading] = useState(true);
  const [totalDespesas, setTotalDespesas] = useState(0);
  const [totalDespesasFixas, setTotalDespesasFixas] = useState(0);
  const [proximosVencimentos, setProximosVencimentos] = useState<any[]>([]);
  const [metaFixada, setMetaFixada] = useState<any>(null);
  const [progressoMeta, setProgressoMeta] = useState(0);

  // 1. Função para formatar "YYYY-MM" em "Nome do Mês Ano"
  const formatarMesLegivel = (anoMes: string) => {
    if (anoMes === "todos") return "Todos os períodos";
    const [ano, mes] = anoMes.split("-");
    const data = new Date(Number(ano), Number(mes) - 1, 1);
    // Formata: "dezembro de 2024"
    const nomeMes = data.toLocaleString("pt-BR", { month: "long" });
    const nomeMesCapitalizado =
      nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
    return `${nomeMesCapitalizado} de ${ano}`;
  };

  // 2. Carregar meses disponíveis baseados nos lançamentos reais
  const fetchMeses = async () => {
    try {
      const { data, error } = await supabase
        .from("lancamentos")
        .select("data_vencimento")
        .order("data_vencimento", { ascending: false });

      if (error) throw error;

      if (data) {
        // Extrai apenas o YYYY-MM único
        const mesesSet = new Set<string>();
        data.forEach((item) => {
          if (item.data_vencimento) {
            mesesSet.add(item.data_vencimento.slice(0, 7));
          }
        });
        setMesesDisponiveis(Array.from(mesesSet));
      }
    } catch (error) {
      console.error("Erro ao carregar meses:", error);
    }
  };

  // 3. Inicialização: Carrega preferência salva e meses
  useEffect(() => {
    fetchMeses();
    const filtroSalvo = localStorage.getItem("dashboardFiltroMes");
    if (filtroSalvo) {
      setMesSelecionado(filtroSalvo);
    }
  }, []);

  // 4. Salvar preferência ao mudar
  const handleFiltroChange = (valor: string) => {
    setMesSelecionado(valor);
    localStorage.setItem("dashboardFiltroMes", valor);
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // --- Consultas Base ---
      let queryDespesas = supabase
        .from("lancamentos")
        .select("valor, tipo")
        .eq("tipo", "Despesa");

      let queryVencimentos = supabase
        .from("lancamentos")
        .select("*")
        .eq("pago", false)
        .eq("tipo", "Despesa")
        .order("data_vencimento", { ascending: true })
        .limit(4);

      // --- Aplica Filtro de Mês se não for "todos" ---
      if (mesSelecionado !== "todos") {
        const [ano, mes] = mesSelecionado.split("-");
        // Calcular último dia do mês para o filtro
        const dataInicio = `${mesSelecionado}-01`;
        const ultimoDia = new Date(Number(ano), Number(mes), 0).getDate();
        const dataFim = `${mesSelecionado}-${ultimoDia}`;

        queryDespesas = queryDespesas
          .gte("data_vencimento", dataInicio)
          .lte("data_vencimento", dataFim);

        // Para vencimentos, se filtrar o mês, mostra só vencimentos daquele mês
        queryVencimentos = queryVencimentos
          .gte("data_vencimento", dataInicio)
          .lte("data_vencimento", dataFim);
      }

      // Executa Queries
      const { data: despesasData } = await queryDespesas;
      const { data: vencimentosData } = await queryVencimentos;

      // Soma Despesas Variáveis
      const total =
        despesasData?.reduce((acc, curr) => acc + Number(curr.valor), 0) || 0;
      setTotalDespesas(total);
      setProximosVencimentos(vencimentosData || []);

      // --- Despesas Fixas (Sempre soma todas do mês atual/futuro ou fixas gerais) ---
      // A lógica de despesas fixas geralmente é mensal recorrente.
      // Aqui vamos somar o total da tabela 'despesas_fixas' para ter uma estimativa.
      const { data: fixasData } = await supabase
        .from("despesas_fixas")
        .select("valor");
      const totalFixas =
        fixasData?.reduce((acc, curr) => acc + Number(curr.valor), 0) || 0;
      setTotalDespesasFixas(totalFixas);

      // --- Metas ---
      const { data: metaData } = await supabase
        .from("metas")
        .select("*")
        .eq("fixada_dashboard", true)
        .single();

      if (metaData) {
        setMetaFixada(metaData);
        const porcentagem = Math.min(
          (Number(metaData.valor_atual) / Number(metaData.valor_objetivo)) *
            100,
          100
        );
        setProgressoMeta(porcentagem);
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

  const formatMoney = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Cabeçalho com Filtro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Visão Geral</h1>
          <p className="text-muted-foreground">Resumo financeiro</p>
        </div>

        <div className="w-full sm:w-[200px]">
          <Select value={mesSelecionado} onValueChange={handleFiltroChange}>
            <SelectTrigger className="w-full">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os períodos</SelectItem>
              {mesesDisponiveis.map((mes) => (
                <SelectItem key={mes} value={mes}>
                  {formatarMesLegivel(mes)}
                </SelectItem>
              ))}
              {/* Fallback caso a lista esteja vazia mas o usuário queira ver que funciona */}
              {mesesDisponiveis.length === 0 && mesSelecionado !== "todos" && (
                <SelectItem value={mesSelecionado}>
                  {formatarMesLegivel(mesSelecionado)}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Totais */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Card Despesas Variáveis (Afetado pelo filtro) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos Variáveis
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatMoney(totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mesSelecionado === "todos"
                ? "Total acumulado de lançamentos"
                : `Total em ${formatarMesLegivel(mesSelecionado)}`}
            </p>
          </CardContent>
        </Card>

        {/* Card Despesas Fixas (Geralmente fixo mensal) */}
        <Card
          onClick={() => onNavigate && onNavigate("despesas_fixas")}
          className="cursor-pointer hover:bg-accent/50 transition-colors"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contas Fixas Mensais
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {formatMoney(totalDespesasFixas)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              Estimativa mensal recorrente
              <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meta Fixada e Próximos Vencimentos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Próximos Vencimentos */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Contas a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proximosVencimentos.length > 0 ? (
                proximosVencimentos.map((item) => {
                  const dataVenc = new Date(item.data_vencimento);
                  // Ajuste de fuso horário simples para exibição correta do dia
                  dataVenc.setMinutes(
                    dataVenc.getMinutes() + dataVenc.getTimezoneOffset()
                  );

                  const hoje = new Date();
                  hoje.setHours(0, 0, 0, 0);
                  const isAtrasado = dataVenc < hoje;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0"
                    >
                      <div className="space-y-1">
                        <p className="font-medium leading-none text-sm">
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
                        <span className="font-bold block text-sm">
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
                <div className="py-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                  Nenhuma conta pendente para este filtro.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Meta Fixada */}
        {metaFixada ? (
          <Card className="md:col-span-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Target className="h-24 w-24" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Meta Principal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg">{metaFixada.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatMoney(metaFixada.valor_atual)} de{" "}
                    {formatMoney(metaFixada.valor_objetivo)}
                  </p>
                </div>
                <div className="space-y-1">
                  <Progress value={progressoMeta} className="h-2" />
                  <p className="text-xs text-right text-muted-foreground">
                    {progressoMeta.toFixed(1)}% concluído
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onNavigate && onNavigate("metas")}
                >
                  Ver Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="md:col-span-1 flex flex-col items-center justify-center p-6 border-dashed text-center">
            <Target className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              Nenhuma meta fixada
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate && onNavigate("metas")}
            >
              Criar Meta
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
