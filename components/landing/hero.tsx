import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Lightbulb, Rocket } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background py-24 lg:py-32">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Join the professional builder community
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-[1.1]">
          Have an Idea? <br />
          <span className="text-primary">Find the People to Build It.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Connect with people who have the skills, interests and ambition to
          turn ideas into real projects. The professional ecosystem for
          founders, developers, and designers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="h-12 px-8 text-md font-semibold gap-2 group"
            asChild
          >
            <Link href="/people">
              Find Teammates
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-md font-medium"
              asChild
            >
              <Link href="/hackathons">Explore Hackathons</Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-md font-medium"
              asChild
            >
              <Link href="/ideas/create">Post Your Idea</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-12 border-t border-border/50">
          <div className="flex items-center gap-4 text-left p-4 rounded-2xl transition-colors hover:bg-accent/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Complementary Skills
              </h3>
              <p className="text-sm text-muted-foreground">
                Find exactly who you need to fill your team&apos;s gaps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-left p-4 rounded-2xl transition-colors hover:bg-accent/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lightbulb className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Vetted Ideas
              </h3>
              <p className="text-sm text-muted-foreground">
                Discover and contribute to high-potential concepts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-left p-4 rounded-2xl transition-colors hover:bg-accent/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Rocket className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Real-World Impact
              </h3>
              <p className="text-sm text-muted-foreground">
                Build startups and products that solve actual problems.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}