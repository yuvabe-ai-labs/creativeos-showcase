"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ShowcaseCategory } from "@/lib/showcase/types";

// A reel can sit in several categories (D504): a founder talking about a food product is in
// both Founder-led and Food & beverage. At least one is required (the form checks).
export function ShowcaseCategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: ShowcaseCategory[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string, on: boolean) =>
    onChange(on ? [...value, id] : value.filter((v) => v !== id));

  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium">Categories</legend>
      <p className="text-xs text-muted-foreground">Pick every one it fits. It shows in each of them.</p>
      <div className="grid grid-cols-1 gap-x-4 gap-y-2 pt-1 sm:grid-cols-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <Checkbox
              id={`cat-${c.id}`}
              checked={value.includes(c.id)}
              onCheckedChange={(on) => toggle(c.id, Boolean(on))}
            />
            <Label htmlFor={`cat-${c.id}`} className="font-normal">
              {c.name}
            </Label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
