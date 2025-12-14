// app/components/metas.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
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
} from "lucide-react";
import { MetaFormSheet } from "@/components/target/MetaFormSheet"; // Ajuste o caminho se necessário

export default function Metas() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Estados para controlar o formulário
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [metaToEdit, setMetaToEdit] = useState<Meta | null>(null);

  const fetchMetas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("metas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMetas(data as unknown as Meta[]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar metas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMetas();
  }, [fetchMetas]);

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza?")) return;
    try {
      const { error } = await supabase.from("metas").delete().eq("id", id);
      if (error) throw error;
      setMetas(metas.filter((m) => m.id !== id));
      toast({ title: "Meta removida" });
    } catch (error: any) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const toggleFixarMeta = async (id: number) => {
    try {
      await supabase.from("metas").update({ fixada: false }).neq("id", 0);
      const metaAtual = metas.find((m) => m.id === id);
      if (!metaAtual?.fixada) {
        await supabase.from("metas").update({ fixada: true }).eq("id", id);
      }
      fetchMetas();
    } catch (error) {
      console.error(error);
    }
  };

  // Funções para abrir o formulário
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

      {/* O formulário agora é um componente separado */}
      {isFormOpen && (
        <MetaFormSheet
          metaToEdit={metaToEdit}
          onClose={() => setIsFormOpen(false)}
          onSuccess={fetchMetas}
        />
      )}

      {/* Lista */}
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
                      onClick={(e) => e.stopPropagation()}
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
                {meta.data_conclusao && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <CalendarIcon className="h-3 w-3" />
                    <span>
                      Meta para{" "}
                      {new Date(meta.data_conclusao).toLocaleDateString(
                        "pt-BR"
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
