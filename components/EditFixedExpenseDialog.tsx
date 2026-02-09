// components/EditFixedExpenseDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ItemOpcao {
  id: number;
  nome: string;
}

interface DespesaFixa {
  id: number;
  nome: string;
  valor: number;
  dia_vencimento: number;
  categoria?: string;
  forma_pagamento?: string;
}

interface EditFixedExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: DespesaFixa | null;
  onSuccess: () => void;
  // Adicionamos as props que estavam faltando
  categorias: ItemOpcao[];
  formasPagamento: ItemOpcao[];
}

export function EditFixedExpenseDialog({
  open,
  onOpenChange,
  expense,
  onSuccess,
  categorias,
  formasPagamento,
}: EditFixedExpenseDialogProps) {
  const { toast } = useToast();
  const session = authClient.useSession();
  const userId = session.data?.user.id;

  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [dia, setDia] = useState("");
  const [categoria, setCategoria] = useState("");
  const [pagamento, setPagamento] = useState("");

  useEffect(() => {
    if (expense) {
      setNome(expense.nome);
      setValor(String(expense.valor));
      setDia(String(expense.dia_vencimento));
      setCategoria(expense.categoria || "");
      setPagamento(expense.forma_pagamento || "");
    }
  }, [expense]);

  const handleSave = async () => {
    if (!userId || !expense) return;
    if (!nome || !valor || !dia) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome, Valor e Dia são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("despesas_fixas")
        .update({
          nome,
          valor: Number(valor),
          dia_vencimento: Number(dia),
          categoria: categoria || null,
          forma_pagamento: pagamento || null,
        })
        .eq("id", expense.id)
        .eq("user_id", userId);

      if (error) throw error;

      toast({ title: "Despesa atualizada com sucesso!" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Despesa Fixa</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Dia Vencimento</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dia}
                onChange={(e) => setDia(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria (Padrão)</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pagamento (Padrão)</Label>
              <Select value={pagamento} onValueChange={setPagamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {formasPagamento.map((f) => (
                    <SelectItem key={f.id} value={f.nome}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
