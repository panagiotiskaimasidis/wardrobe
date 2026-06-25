import Link from "next/link";
import { Shirt, Search, Plus } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Shirt className="text-primary h-5 w-5" />
          <span className="text-lg tracking-tight">Wardrobe</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm sm:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/catalog">Catalog</Link>
          </Button>
          {user && (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/feed">Feed</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/collections">My closets</Link>
              </Button>
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Search catalog"
          >
            <Link href="/catalog">
              <Search className="h-4 w-4" />
            </Link>
          </Button>

          {user ? (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/catalog">
                  <Plus className="h-4 w-4" /> Add item
                </Link>
              </Button>
              <UserMenu user={user} />
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
