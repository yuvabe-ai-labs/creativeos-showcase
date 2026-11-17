"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHOWCASE_CATEGORY_DESCRIPTION_MAX, SHOWCASE_CATEGORY_NAME_MAX } from "@/lib/showcase/constants";

/** Name + one-line description, for a new category or an existing one. */
export function ShowcaseCategoryEditor({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: { name: string; description: string };
  submitLabel: string;
  onSubmit: (values: { name: string; description: string }) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        const done = await onSubmit({ name: name.trim(), description: description.trim() });
        setSaving(false);
        if (done) onCancel();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          value={name}
          maxLength={SHOWCASE_CATEGORY_NAME_MAX}
          placeholder="e.g. Jewellery"
          autoFocus
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="category-description">One line under the heading (optional)</Label>
        <Input
          id="category-description"
          value={description}
          maxLength={SHOWCASE_CATEGORY_DESCRIPTION_MAX}
          placeholder="e.g. Gold, silver and everyday pieces"
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={saving || name.trim() === ""}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
