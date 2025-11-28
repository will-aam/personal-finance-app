"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, User, Tag, CreditCard } from "lucide-react"

export default function Configuracoes() {
  const [nomeUsuario, setNomeUsuario] = useState("Will")
  const [categorias, setCategorias] = useState([
    "Contas Fixas",
    "Despesas Variáveis",
    "Lazer",
    "Educação",
    "Investimentos",
    "Receita",
    "Outros",
  ])
  const [formasPagamento, setFormasPagamento] = useState([
    "Pix",
    "Cartão de Crédito",
    "Cartão de Débito",
    "Dinheiro",
    "Boleto",
    "Transferência",
    "Outros",
  ])

  const [novaCategoria, setNovaCategoria] = useState("")
  const [novaFormaPagamento, setNovaFormaPagamento] = useState("")

  const adicionarCategoria = () => {
    if (novaCategoria.trim() && !categorias.includes(novaCategoria.trim())) {
      setCategorias([...categorias, novaCategoria.trim()])
      setNovaCategoria("")
    }
  }

  const removerCategoria = (categoria: string) => {
    setCategorias(categorias.filter((c) => c !== categoria))
  }

  const adicionarFormaPagamento = () => {
    if (novaFormaPagamento.trim() && !formasPagamento.includes(novaFormaPagamento.trim())) {
      setFormasPagamento([...formasPagamento, novaFormaPagamento.trim()])
      setNovaFormaPagamento("")
    }
  }

  const removerFormaPagamento = (forma: string) => {
    setFormasPagamento(formasPagamento.filter((f) => f !== forma))
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Personalize seu app financeiro</p>
      </div>

      {/* Nome do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome de Usuário</Label>
            <div className="flex gap-2">
              <Input
                id="nome"
                value={nomeUsuario}
                onChange={(e) => setNomeUsuario(e.target.value)}
                placeholder="Seu nome"
              />
              <Button variant="outline">Salvar</Button>
            </div>
            <p className="text-xs text-muted-foreground">Este nome aparecerá nas saudações do app</p>
          </div>
        </CardContent>
      </Card>

      {/* Categorias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categorias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Adicionar Nova Categoria</Label>
            <div className="flex gap-2">
              <Input
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                placeholder="Nome da categoria"
                onKeyPress={(e) => e.key === "Enter" && adicionarCategoria()}
              />
              <Button onClick={adicionarCategoria}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categorias Existentes</Label>
            <div className="space-y-2">
              {categorias.map((categoria, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                  <span>{categoria}</span>
                  <Button size="icon" variant="ghost" onClick={() => removerCategoria(categoria)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formas de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Formas de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Adicionar Nova Forma</Label>
            <div className="flex gap-2">
              <Input
                value={novaFormaPagamento}
                onChange={(e) => setNovaFormaPagamento(e.target.value)}
                placeholder="Nome da forma de pagamento"
                onKeyPress={(e) => e.key === "Enter" && adicionarFormaPagamento()}
              />
              <Button onClick={adicionarFormaPagamento}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Formas Existentes</Label>
            <div className="space-y-2">
              {formasPagamento.map((forma, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                  <span>{forma}</span>
                  <Button size="icon" variant="ghost" onClick={() => removerFormaPagamento(forma)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informação sobre Integração Futura */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-semibold">💡 Próximos Passos</h3>
            <p className="text-sm text-muted-foreground">
              Este app está estruturado para fácil integração com banco de dados (Supabase). Todos os dados estão
              organizados e prontos para serem conectados quando você quiser!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
