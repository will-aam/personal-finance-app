"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Target } from "lucide-react";

interface GoalsCardProps {
  onNavigate?: (tab: string) => void;
}

export function GoalsCard({ onNavigate }: GoalsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas Financeiras
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Gerenciar Metas</Label>
            <p className="text-sm text-muted-foreground">
              Acesse a página de metas para criar e acompanhar seus objetivos
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigate && onNavigate("metas")}
            className="gap-2"
          >
            <Target className="h-4 w-4" />
            Acessar Metas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
