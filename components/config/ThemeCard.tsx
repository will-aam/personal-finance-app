"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Moon, Sun } from "lucide-react";

export function ThemeCard() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {theme === "dark" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
          Aparência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Tema do Aplicativo</Label>
            <p className="text-sm text-muted-foreground">
              Escolha entre tema claro ou escuro
            </p>
          </div>
          <Button variant="outline" onClick={toggleTheme} className="gap-2">
            {theme === "dark" ? (
              <>
                <Sun className="h-4 w-4" /> Claro
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" /> Escuro
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
