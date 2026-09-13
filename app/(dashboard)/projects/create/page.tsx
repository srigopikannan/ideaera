"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FolderPlus, Lightbulb } from "lucide-react";
import { createProjectAction, getMyProjectsAction } from "@/app/(dashboard)/actions/projects";
import { getMyIdeasAction } from "@/app/(dashboard)/actions/ideas";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters").max(100),
  description: z.string().min(10, "Please provide a brief description"),
  ideaId: z.string().optional(),
  repository_url: z.string().url("Invalid repository URL").optional().or(z.literal("")),
});

interface Idea {
  id: string;
  title: string;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [myIdeas, setMyIdeas] = useState<Idea[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      ideaId: "",
      repository_url: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const result = await createProjectAction({
        name: values.name,
        description: values.description,
        ideaId: values.ideaId || undefined,
      });
      if (result.success) {
        toast.success("Project workspace created successfully!");
        router.push("/projects");
      } else {
        toast.error(result.error || "Failed to create project");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Load my ideas to allow conversion
  useEffect(() => {
    getMyIdeasAction().then(setMyIdeas);
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-muted-foreground">Establish a workspace to collaborate, track tasks, and reach your milestones.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="p-6 space-y-6">
            <div className="grid gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Project Nexus" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What is this project about and what are you building?"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Convert from an Idea</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Linking a project to an existing idea keeps your vision connected and allows you to track the evolution from concept to product.
            </p>
            <FormField
              control={form.control}
              name="ideaId"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an idea to convert..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {myIdeas.map(idea => (
                        <SelectItem key={idea.id} value={idea.id}>
                          {idea.title}
                        </SelectItem>
                      ))}
                      {myIdeas.length === 0 && (
                        <SelectItem value="" disabled>No ideas found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          <Card className="p-6 space-y-6">
            <div className="grid gap-6">
              <FormField
                control={form.control}
                name="repository_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub Repository URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/username/repo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="ghost" type="button" onClick={() => router.push("/projects")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="px-8 gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <FolderPlus className="h-4 w-4" />
              Create Workspace
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

import { Card } from "@/components/ui/card";
