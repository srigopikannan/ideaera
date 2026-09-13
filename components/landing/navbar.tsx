import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Menu } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Search className="h-5 w-5" />
            </div>
            <span>IdeaConnect</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/people" className="transition-colors hover:text-foreground">
              People
            </Link>

            <Link href="/ideas" className="transition-colors hover:text-foreground">
              Ideas
            </Link>

            <Link href="/projects" className="transition-colors hover:text-foreground">
              Projects
            </Link>

            <Link href="/hackathons" className="transition-colors hover:text-foreground">
              Hackathons
            </Link>

            <Link href="/companies" className="transition-colors hover:text-foreground">
              Companies
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm font-medium"
              >
                Log in
              </Button>
            </Link>

            <Link href="/signup">
              <Button size="sm" className="text-sm font-medium">
                Get Started
              </Button>
            </Link>
          </div>

          <Link href="/dashboard" className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open dashboard"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}