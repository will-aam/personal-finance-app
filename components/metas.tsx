// app/components/metas.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client"; // <--- NOVO IMPORT
import type { Meta } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  Pin,
  PinOff,
  Loader2,
  Calendar as CalendarIcon,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { MetaFormSheet } from "@/components/target/MetaFormSheet";

export default function Metas() {
  // --- USER SESSION ---
  const session = authClient.useSession();
  const userId = session.data?.user.id;

  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [metaToEdit, setMetaToEdit] = useState<Meta | null>(null);

  // VERSÃO ROBUSTA DA FUNÇÃO DE PROCESSAMENTO
  const processarSimulacoes = async (metasCarregadas: Meta[]) => {
    if (!userId) return metasCarregadas; // Segurança extra

    let houveAtualizacao = false;
    const agora = new Date(); // Data/Hora atual do seu PC

    console.log("--- INICIANDO PROCESSAMENTO DE SIMULAÇÕES ---");
    console.log("Hora atual:", agora.toLocaleString());

    const metasAtualizadas = await Promise.all(
      metasCarregadas.map(async (meta) => {
        // 1. Verificações de segurança
        if (!meta.auto_deposito_ativo) return meta;
        if (
          !meta.auto_valor ||
          !meta.auto_dia_cobranca ||
          !meta.auto_data_inicio
        ) {
          console.log(`Meta ${meta.nome}: Dados incompletos para automação.`);
          return meta;
        }

        console.log(
          `Checando Meta: ${meta.nome} | Dia Cobrança: ${meta.auto_dia_cobranca}`,
        );

        // 2. CORREÇÃO DE FUSO HORÁRIO
        // Criamos a data baseada nos números da string (Ano, Mês, Dia) para garantir que é local
        const criarDataLocal = (dataString: string) => {
          const [ano, mes, dia] = dataString.split("-").map(Number);
          return new Date(ano, mes - 1, dia); // Meses no JS começam em 0
        };

        // Define a referência (início ou último processamento)
        let dataReferencia: Date;

        if (meta.auto_ultimo_processamento) {
          dataReferencia = criarDataLocal(meta.auto_ultimo_processamento);
        } else {
          dataReferencia = criarDataLocal(meta.auto_data_inicio);
          // Se for a primeira vez, voltamos 1 dia para garantir que o loop inclua o dia de início
          dataReferencia.setDate(dataReferencia.getDate() - 1);
        }

        let valorAdicional = 0;
        let novoUltimoProcessamento = meta.auto_ultimo_processamento;

        // Loop dia a dia
        const tempDate = new Date(dataReferencia);
        tempDate.setDate(tempDate.getDate() + 1); // Começa do dia seguinte à referência

        // Zera as horas para comparar apenas datas no loop
        const hojeMeiaNoite = new Date(
          agora.getFullYear(),
          agora.getMonth(),
          agora.getDate(),
        );

        while (tempDate <= hojeMeiaNoite) {
          // Verificação de validade (meses de duração)
          if (meta.auto_meses_duracao && meta.auto_meses_duracao > 0) {
            const dataInicio = criarDataLocal(meta.auto_data_inicio);
            const dataFim = new Date(dataInicio);
            dataFim.setMonth(dataFim.getMonth() + meta.auto_meses_duracao);
            if (tempDate > dataFim) break;
          }

          // É O DIA DE COBRANÇA?
          if (tempDate.getDate() === meta.auto_dia_cobranca) {
            let deveProcessar = true;

            // VERIFICAÇÃO DE HORÁRIO (Se for hoje)
            if (
              tempDate.getTime() === hojeMeiaNoite.getTime() &&
              meta.auto_horario
            ) {
              const [horaAg, minAg] = meta.auto_horario.split(":").map(Number);
              const horaAtual = agora.getHours();
              const minAtual = agora.getMinutes();

              console.log(
                `Verificando horário HOJE: Agendado ${meta.auto_horario} vs Atual ${horaAtual}:${minAtual}`,
              );

              if (
                horaAtual < horaAg ||
                (horaAtual === horaAg && minAtual < minAg)
              ) {
                deveProcessar = false;
                console.log("-> Ainda não deu o horário.");
                break; // Para o loop, espera o horário
              }
            }

            if (deveProcessar) {
              console.log(
                `>>> DEPÓSITO DETECTADO: R$ ${
                  meta.auto_valor
                } em ${tempDate.toLocaleDateString()}`,
              );
              valorAdicional += meta.auto_valor;
              // Formata YYYY-MM-DD localmente
              const ano = tempDate.getFullYear();
              const mes = String(tempDate.getMonth() + 1).padStart(2, "0");
              const dia = String(tempDate.getDate()).padStart(2, "0");
              novoUltimoProcessamento = `${ano}-${mes}-${dia}`;
            }
          }

          tempDate.setDate(tempDate.getDate() + 1);
        }

        if (valorAdicional > 0) {
          houveAtualizacao = true;
          const novoValorDepositado =
            (meta.valor_depositado || 0) + valorAdicional;

          // Atualiza Supabase
          const { error } = await supabase
            .from("metas")
            .update({
              valor_depositado: novoValorDepositado,
              auto_ultimo_processamento: novoUltimoProcessamento,
            })
            .eq("id", meta.id)
            .eq("user_id", userId); // <--- SEGURANÇA EXTRA NA ATUALIZAÇÃO

          if (error) console.error("Erro ao atualizar Supabase:", error);

          return {
            ...meta,
            valor_depositado: novoValorDepositado,
            auto_ultimo_processamento: novoUltimoProcessamento,
          };
        }

        return meta;
      }),
    );

    if (houveAtualizacao) {
      toast({
        title: "Simulação Processada",
        description: "Valores automáticos foram adicionados às suas metas.",
        variant: "default",
      });
    }

    return metasAtualizadas;
  };

  const fetchMetas = useCallback(async () => {
    if (!userId) return; // Só busca se tiver usuário

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("metas")
        .select("*")
        .eq("user_id", userId) // <--- SEGURANÇA: Só minhas metas
        .order("created_at", { ascending: false });
      if (error) throw error;

      const dadosProcessados = await processarSimulacoes(
        data as unknown as Meta[],
      );
      setMetas(dadosProcessados);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar metas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, userId]);

  useEffect(() => {
    if (userId) {
      fetchMetas();
    }
  }, [fetchMetas, userId]);

  const handleDelete = async (id: number) => {
    if (!userId) return;
    if (!confirm("Tem certeza?")) return;
    try {
      const { error } = await supabase
        .from("metas")
        .delete()
        .eq("id", id)
        .eq("user_id", userId); // <--- SEGURANÇA
      if (error) throw error;
      setMetas(metas.filter((m) => m.id !== id));
      toast({ title: "Meta removida" });
    } catch (error: any) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const toggleFixarMeta = async (id: number) => {
    if (!userId) return;
    try {
      // Primeiro desfixa todas DO USUÁRIO
      await supabase
        .from("metas")
        .update({ fixada: false })
        .neq("id", 0)
        .eq("user_id", userId); // <--- SEGURANÇA

      const metaAtual = metas.find((m) => m.id === id);
      if (!metaAtual?.fixada) {
        // Fixa a nova meta, garantindo que é do usuário
        await supabase
          .from("metas")
          .update({ fixada: true })
          .eq("id", id)
          .eq("user_id", userId); // <--- SEGURANÇA
      }
      fetchMetas();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenNewForm = () => {
    setMetaToEdit(null);
    setIsFormOpen(true);
  };
  const handleOpenEditForm = (meta: Meta) => {
    setMetaToEdit(meta);
    setIsFormOpen(true);
  };

  const calcularProgresso = (meta: Meta) => {
    if (!meta.valor_total) return 0;
    return Math.min((meta.valor_depositado / meta.valor_total) * 100, 100);
  };
  const calcularFalta = (meta: Meta) => {
    return Math.max(meta.valor_total - meta.valor_depositado, 0);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Metas Financeiras</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Planeje e acompanhe suas conquistas
          </p>
        </div>
        <Button onClick={handleOpenNewForm} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Meta
        </Button>
      </div>
      {isFormOpen && (
        <MetaFormSheet
          metaToEdit={metaToEdit}
          onClose={() => setIsFormOpen(false)}
          onSuccess={fetchMetas}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin mx-auto col-span-full" />
        ) : (
          metas.map((meta) => (
            <Card
              key={meta.id}
              className="hover:bg-accent/50 transition-all duration-200 relative"
            >
              {meta.fixada && (
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1.5">
                  <Pin className="h-3 w-3" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between pr-8">
                  {meta.link ? (
                    <a
                      href={meta.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg text-balance hover:underline flex items-center gap-2 text-primary"
                    >
                      {meta.nome}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-lg text-balance">{meta.nome}</span>
                  )}
                  <TrendingUp className="h-5 w-5 text-primary shrink-0" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-semibold">
                      {calcularProgresso(meta).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={calcularProgresso(meta)} className="h-3" />
                </div>
                <div className="flex justify-between items-baseline pt-2">
                  <p className="text-xs text-muted-foreground">
                    Falta:{" "}
                    <span className="font-bold text-primary">
                      R${" "}
                      {calcularFalta(meta).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </p>
                </div>

                {/* BLOCO VISUAL DA SIMULAÇÃO ATIVA */}
                {meta.auto_deposito_ativo && (
                  <div className="mt-3 flex items-center gap-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground border border-border/50">
                    <RefreshCw className="h-3 w-3 animate-spin-slow text-green-600" />
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        Depósito Automático Ativo
                      </span>
                      <span>
                        + R$ {meta.auto_valor?.toFixed(2)} todo dia{" "}
                        {meta.auto_dia_cobranca} às {meta.auto_horario}
                      </span>
                    </div>
                  </div>
                )}

                {meta.data_conclusao && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <CalendarIcon className="h-3 w-3" />
                    <span>
                      Meta para{" "}
                      {new Date(meta.data_conclusao).toLocaleDateString(
                        "pt-BR",
                      )}
                    </span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant={meta.fixada ? "default" : "outline"}
                    onClick={() => toggleFixarMeta(meta.id)}
                    className="flex-1"
                  >
                    {meta.fixada ? (
                      <PinOff className="h-4 w-4" />
                    ) : (
                      <Pin className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEditForm(meta)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(meta.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {!loading && metas.length === 0 && (
        <div className="text-center text-muted-foreground py-10">
          Nenhuma meta criada.
        </div>
      )}
    </div>
  );
}
