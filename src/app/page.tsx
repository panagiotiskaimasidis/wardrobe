import Link from "next/link";
import { Shirt, MousePointerClick, Link2, Users } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { getCatalogStats, getRecentProducts } from "@/lib/queries/products";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FEATURES = [
  {
    icon: Link2,
    title: "Clip from anywhere",
    body: "Paste a product link from any brand and Wardrobe pulls in the image, price, and details automatically.",
  },
  {
    icon: MousePointerClick,
    title: "Drag to curate",
    body: "Drag items onto visual closets, reorder them, and move pieces between boards until the look feels right.",
  },
  {
    icon: Users,
    title: "Share & react",
    body: "Follow friends, browse their closets in a live feed, and like, comment, or re-save anything you love.",
  },
];

export default async function HomePage() {
  const [user, stats, recent] = await Promise.all([
    getCurrentUser(),
    getCatalogStats(),
    getRecentProducts(8),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="flex flex-col items-center gap-6 py-20 text-center">
        <span className="text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
          <Shirt className="text-primary h-3.5 w-3.5" />
          Pinterest × wishlist × wardrobe planner
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          Curate the clothes you love, from every brand.
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg text-pretty">
          Wardrobe lets you collect fashion from anywhere on the web, arrange it
          into beautiful closets, and share the look with friends.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/catalog">Browse the catalog</Link>
          </Button>
          {user ? (
            <Button asChild size="lg" variant="outline">
              <Link href="/collections">Go to my closets</Link>
            </Button>
          ) : (
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Sign in to start</Link>
            </Button>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {stats.products.toLocaleString()} items · {stats.brands} brands ·{" "}
          {stats.collections} public closets
        </p>
      </section>

      {recent.length > 0 && (
        <section className="pb-16">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-semibold tracking-tight">
              Fresh in the catalog
            </h2>
            <Button asChild variant="link" size="sm">
              <Link href="/catalog">View all →</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recent.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 pb-24 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <f.icon className="text-primary h-6 w-6" />
              <CardTitle>{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{f.body}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
