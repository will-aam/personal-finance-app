// app/components/target/MetaFormSheet.tsx
"use client";

import type React from "react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Meta } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus, Trash2 } from "lucide-react";

// Definindo as props que o componente vai receber
interface MetaFormSheetProps {
  // A meta a ser editada (se houver)
  metaToEdit: Meta | null;
  // Função para fechar o sheet
  onClose: () => void;
  // Função para avisar o componente pai que a lista de metas precisa ser atualizada
  onSuccess: () => void;
}

export function MetaFormSheet({
  metaToEdit,
  onClose,
  onSuccess,
}: MetaFormSheetProps) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(
    metaToEdit?.id || null
  );

  const [formData, setFormData] = useState<Partial<Meta>>({
    nome: metaToEdit?.nome || "",
    descricao: metaToEdit?.descricao || "",
    valor_total: metaToEdit?.valor_total || 0,
    valor_depositado: metaToEdit?.valor_depositado || 0,
    data_inicio:
      metaToEdit?.data_inicio || new Date().toISOString().split("T")[0],
    data_conclusao: metaToEdit?.data_conclusao || "",
    tipo: metaToEdit?.tipo || "vista",
    parcelamentos: metaToEdit?.parcelamentos || [],
    fixada: metaToEdit?.fixada || false,
  });

  const [novoParcelamento, setNovoParcelamento] = useState({
    parcelas: 1,
    valorParcela: 0,
    parcelasPagas: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nome: formData.nome,
        descricao: formData.descricao,
        valor_total: formData.valor_total,
        valor_depositado: formData.valor_depositado || 0,
        data_inicio: formData.data_inicio,
        data_conclusao: formData.data_conclusao || null,
        tipo: formData.tipo,
        parcelamentos: formData.parcelamentos,
        fixada: formData.fixada,
      };

      if (editingId) {
        const { error } = await supabase
          .from("metas")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast({ title: "Meta atualizada!" });
      } else {
        const { error } = await supabase.from("metas").insert([payload]);
        if (error) throw error;
        toast({ title: "Meta criada!" });
      }

      onSuccess(); // Avisa o componente pai para recarregar
      onClose(); // Fecha o sheet
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const adicionarParcelamento = () => {
    const novosParcelamentos = [
      ...(formData.parcelamentos || []),
      novoParcelamento,
    ];
    setFormData({ ...formData, parcelamentos: novosParcelamentos });
  };

  const removerParcelamento = (index: number) => {
    const novos = formData.parcelamentos?.filter((_, i) => i !== index);
    setFormData({ ...formData, parcelamentos: novos });
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editingId ? "Editar Meta" : "Nova Meta"}</SheetTitle>
          <SheetDescription>
            Defina os detalhes do seu objetivo financeiro.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 py-6 px-4 sm:px-6 max-w-lg mx-auto"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Meta</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: Notebook novo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link do Produto (opcional)</Label>
              <Input
                id="link"
                type="url" // O tipo 'url' ajuda o navegador a validar
                value={formData.link || ""}
                onChange={(e) =>
                  setFormData({ ...formData, link: e.target.value })
                }
                placeholder="https://exemplo.com/produto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={formData.descricao || ""}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valorTotal">Valor Total (R$)</Label>
                <Input
                  id="valorTotal"
                  type="number"
                  step="0.01"
                  value={formData.valor_total || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valor_total: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorDepositado">Já Depositado (R$)</Label>
                <Input
                  id="valorDepositado"
                  type="number"
                  step="0.01"
                  value={formData.valor_depositado || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valor_depositado: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) =>
                    setFormData({ ...formData, data_inicio: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataConclusao">Data Desejada (opcional)</Label>
                <Input
                  id="dataConclusao"
                  type="date"
                  value={formData.data_conclusao || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, data_conclusao: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Meta</Label>
              <Tabs
                value={formData.tipo}
                onValueChange={(value: string) =>
                  setFormData({
                    ...formData,
                    tipo: value as "vista" | "parcelado",
                  })
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="vista">À Vista</TabsTrigger>
                  <TabsTrigger value="parcelado">Parcelado</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {formData.tipo === "parcelado" && (
              <div className="rounded-lg border p-4 bg-accent/50">
                <p className="text-sm text-muted-foreground mb-2">
                  Simulação de parcelas
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Qtd Parcelas"
                    type="number"
                    value={novoParcelamento.parcelas}
                    onChange={(e) =>
                      setNovoParcelamento({
                        ...novoParcelamento,
                        parcelas: Number(e.target.value),
                      })
                    }
                  />
                  <Input
                    placeholder="Valor"
                    type="number"
                    value={novoParcelamento.valorParcela}
                    onChange={(e) =>
                      setNovoParcelamento({
                        ...novoParcelamento,
                        valorParcela: Number(e.target.value),
                      })
                    }
                  />
                  <Button
                    type="button"
                    onClick={adicionarParcelamento}
                    variant="secondary"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 space-y-1">
                  {formData.parcelamentos?.map((p: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs bg-background p-2 rounded border"
                    >
                      <span>
                        {p.parcelas}x de R$ {p.valorParcela}
                      </span>
                      <Trash2
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removerParcelamento(i)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <SheetFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingId ? "Salvar Alterações" : "Criar Meta"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
