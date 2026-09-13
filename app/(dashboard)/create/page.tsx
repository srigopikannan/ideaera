import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import NextLink from "next/link";
import {
  Lightbulb,
  FolderPlus,
  Building2,
  Trophy,
  Users,
  Plus
} from "lucide-react";

export default function CreateCenterPage() {
  const creationOptions = [
    {
      title: "Post an Idea",
      description: "Share your vision and find potential co-founders.",
      icon: Lightbulb,
      href: "/ideas/create",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      title: "Start a Project",
      description: "Create a workspace for your team to build and track tasks.",
      icon: FolderPlus,
      href: "/projects/create",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Register Company",
      description: "Establish your company presence and attract talent.",
      icon: Building2,
      href: "/companies/create",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Host Hackathon",
      description: "Organize a challenge to spark innovation and growth.",
      icon: Trophy,
      href: "/hackathons/create",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      title: "Create Connection",
      description: "Reach out to a professional in your network.",
      icon: Users,
      href: "/people",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4">
          <Plus className="h-6 w-6" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Create Center</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Everything you need to start your journey on IdeaConnect. What would you like to build today?
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {creationOptions.map((option) => (
          <Card key={option.title} className="group hover:shadow-lg transition-all duration-300 flex flex-col">
            <CardHeader>
              <div className={`h-12 w-12 rounded-2xl ${option.bgColor} ${option.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <option.icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">{option.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {option.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-6 border-t">
              <Button asChild className="w-full gap-2">
                <NextLink href={option.href}>Get Started</NextLink>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
