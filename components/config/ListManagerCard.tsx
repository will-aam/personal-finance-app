"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronDown, ChevronUp, LucideIcon } from "lucide-react";

interface ListManagerCardProps {
  title: string;
  icon: LucideIcon; // Tipo para ícones do Lucide
  initialItems: string[];
  placeholderInput: string;
}

export function ListManagerCard({
  title,
  icon: Icon,
  initialItems,
  placeholderInput,
}: ListManagerCardProps) {
  const [items, setItems] = useState<string[]>(initialItems);
  const [newItem, setNewItem] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const addItem = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      setItems([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (itemToRemove: string) => {
    setItems(items.filter((item) => item !== itemToRemove));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Adicionar Nova {title}</Label>
          <div className="flex gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder={placeholderInput}
              onKeyPress={(e) => e.key === "Enter" && addItem()}
            />
            <Button onClick={addItem}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              {title} Existentes ({items.length})
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" /> Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" /> Exibir
                </>
              )}
            </Button>
          </div>

          {isExpanded && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <span className="text-sm">{item}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(item)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
