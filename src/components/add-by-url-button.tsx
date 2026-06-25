"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Link2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { addClippedProduct } from "@/lib/actions/products";
import { CATEGORIES, CATEGORY_LABELS, COMMON_COLORS } from "@/lib/constants";
import type { Category } from "@/lib/constants";
import type { ParsedProduct } from "@/lib/clipper/parse";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Draft = {
  title: string;
  brandName: string;
  description: string;
  price: string;
  currency: string;
  imageUrl: string;
  sourceUrl: string;
  category: Category;
  colorTags: string[];
};

const emptyDraft = (sourceUrl = ""): Draft => ({
  title: "",
  brandName: "",
  description: "",
  price: "",
  currency: "USD",
  imageUrl: "",
  sourceUrl,
  category: "other",
  colorTags: [],
});

function fromParsed(p: ParsedProduct): Draft {
  return {
    title: p.title,
    brandName: p.brandName,
    description: p.description ?? "",
    price: p.price != null ? String(p.price) : "",
    currency: p.currency,
    imageUrl: p.imageUrl ?? "",
    sourceUrl: p.sourceUrl,
    category: p.category,
    colorTags: p.colorTags,
  };
}

export function AddByUrlButton({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function reset() {
    setUrl("");
    setDraft(null);
    setNotice(null);
    setFetching(false);
    setSaving(false);
  }

  async function handleFetch() {
    if (!url.trim()) return;
    setFetching(true);
    setNotice(null);
    try {
      const res = await fetch("/api/clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.ok) {
        setDraft(fromParsed(data.product));
        if (!data.product.imageUrl || !data.product.price) {
          setNotice("We couldn't find everything — fill in any blanks below.");
        }
      } else {
        setNotice(
          `${data.error ?? "Couldn't read that page."} You can enter the details manually.`,
        );
        setDraft(emptyDraft(url));
      }
    } catch {
      setNotice("Something went wrong. Enter the details manually.");
      setDraft(emptyDraft(url));
    } finally {
      setFetching(false);
    }
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    const res = await addClippedProduct({
      title: draft.title,
      brandName: draft.brandName,
      description: draft.description,
      price: draft.price.trim() === "" ? null : Number(draft.price),
      currency: draft.currency,
      imageUrl: draft.imageUrl,
      sourceUrl: draft.sourceUrl,
      category: draft.category,
      colorTags: draft.colorTags,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Added to your catalog");
      setOpen(false);
      reset();
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  function toggleColor(c: string) {
    setDraft((d) => {
      if (!d) return d;
      const has = d.colorTags.includes(c);
      return {
        ...d,
        colorTags: has
          ? d.colorTags.filter((x) => x !== c)
          : [...d.colorTags, c].slice(0, 8),
      };
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary h-5 w-5" /> Add an item
          </DialogTitle>
          <DialogDescription>
            Paste a product link from any brand and we’ll pull in the details.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleFetch();
                }
              }}
              placeholder="https://brand.com/product/…"
              className="pl-8"
              aria-label="Product URL"
            />
          </div>
          <Button onClick={handleFetch} disabled={fetching || !url.trim()}>
            {fetching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Fetching
              </>
            ) : (
              "Fetch details"
            )}
          </Button>
        </div>

        {notice && (
          <p className="text-muted-foreground bg-muted rounded-md px-3 py-2 text-sm">
            {notice}
          </p>
        )}

        {!draft && (
          <button
            type="button"
            onClick={() => setDraft(emptyDraft(url))}
            className="text-muted-foreground hover:text-foreground text-left text-sm underline"
          >
            …or enter an item manually
          </button>
        )}

        {draft && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
          >
            <div className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draft.imageUrl || "/placeholder-item.svg"}
                alt=""
                className="bg-muted h-28 w-24 shrink-0 rounded-md border object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = "0.3";
                }}
              />
              <div className="flex flex-1 flex-col gap-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={draft.title}
                    onChange={(e) => update("title", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={draft.brandName}
                    onChange={(e) => update("brandName", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-1 grid gap-1.5">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  inputMode="decimal"
                  value={draft.price}
                  onChange={(e) => update("price", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="col-span-1 grid gap-1.5">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={draft.currency}
                  onChange={(e) =>
                    update("currency", e.target.value.toUpperCase())
                  }
                  maxLength={3}
                />
              </div>
              <div className="col-span-2 grid gap-1.5">
                <Label>Category</Label>
                <Select
                  value={draft.category}
                  onValueChange={(v) => update("category", v as Category)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={draft.imageUrl}
                onChange={(e) => update("imageUrl", e.target.value)}
                placeholder="https://…"
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Colors</Label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_COLORS.map((c) => {
                  const active = draft.colorTags.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleColor(c)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs capitalize transition-colors",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-accent",
                      )}
                      aria-pressed={active}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="description">Notes</Label>
              <Textarea
                id="description"
                value={draft.description}
                onChange={(e) => update("description", e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !draft.title.trim()}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving
                  </>
                ) : (
                  "Add to catalog"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
