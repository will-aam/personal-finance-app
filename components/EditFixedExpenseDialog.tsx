// app/components/EditFixedExpenseDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client"; // <--- NOVO IMPORT
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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Definimos a interface aqui para o componente saber o que esperar
interface DespesaFixa {
  id: number;
  nome: string;
  valor: number;
  dia_vencimento: number;
}

interface EditFixedExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: DespesaFixa | null;
  onSuccess: () => void; // Função para recarregar a lista após salvar
}

export function EditFixedExpenseDialog({
  open,
  onOpenChange,
  expense,
  onSuccess,
}: EditFixedExpenseDialogProps) {
  const { toast } = useToast();

  // --- USER SESSION ---
  const session = authClient.useSession();
  const userId = session.data?.user.id;

  const [loading, setLoading] = useState(false);

  // Estados locais para edição
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [dia, setDia] = useState("");

  // Sempre que a despesa selecionada mudar (abrir o modal), preenchemos os campos
  useEffect(() => {
    if (expense) {
      setNome(expense.nome);
      setValor(String(expense.valor));
      setDia(String(expense.dia_vencimento));
    }
  }, [expense]);

  const handleSave = async () => {
    if (!userId) return; // Segurança básica
    if (!expense) return;
    if (!nome || !valor || !dia) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos.",
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
        })
        .eq("id", expense.id)
        .eq("user_id", userId); // <--- SEGURANÇA: Só edita se for meu

      if (error) throw error;

      toast({ title: "Despesa atualizada com sucesso!" });
      onSuccess(); // Avisa o componente pai para atualizar a lista
      onOpenChange(false); // Fecha o modal
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Despesa Fixa</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nome">Nome</Label>
            <Input
              id="edit-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Aluguel"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-valor">Valor (R$)</Label>
              <Input
                id="edit-valor"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dia">Dia Vencimento</Label>
              <Input
                id="edit-dia"
                type="number"
                min="1"
                max="31"
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                placeholder="Dia"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
