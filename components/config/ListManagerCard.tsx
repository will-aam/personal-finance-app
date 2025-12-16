// components/config/ListManagerCard.tsx
"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ListManagerCardProps {
  title: string;
  icon: LucideIcon;
  initialItems: string[];
  placeholderInput: string;
}

export function ListManagerCard({
  title,
  icon: Icon,
  initialItems,
  placeholderInput,
}: ListManagerCardProps) {
  const [items, setItems] = useState(initialItems);
  const [newItem, setNewItem] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);

  const handleAddItem = () => {
    if (newItem.trim()) {
      setItems([...items, newItem.trim()]);
      setNewItem("");
      setIsAddingItem(false);
    }
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setItems(items.filter((_, index) => index !== indexToRemove));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <div className="px-6 pb-4">
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="group bg-secondary text-secondary-foreground rounded-md px-3 py-1 text-sm flex items-center gap-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <span>{item}</span>
              <button
                onClick={() => handleRemoveItem(index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {!isAddingItem ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingItem(true)}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
          ) : (
            <div className="flex gap-1 items-center">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder={placeholderInput}
                className="h-7 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddItem();
                  } else if (e.key === "Escape") {
                    setIsAddingItem(false);
                    setNewItem("");
                  }
                }}
              />
              <Button size="sm" className="h-7 text-xs" onClick={handleAddItem}>
                Ok
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
