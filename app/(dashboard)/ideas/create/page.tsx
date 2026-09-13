"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Lightbulb, Loader2 } from "lucide-react";
import { createIdeaAction, getAvailableSkillsAction } from "@/app/(dashboard)/actions/ideas";
import { toast } from "sonner";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  problem: z.string().min(20, "Please describe the problem more clearly"),
  solution: z.string().min(20, "Please describe your solution more clearly"),
  description: z.string().min(50, "Provide a more detailed description"),
  category: z.string().min(1, "Please select a category"),
  stage: z.enum(["Idea", "Planning", "Prototype", "MVP", "Testing", "Launch"]),
  visibility: z.enum(["public", "private"]),
  requirements: z.array(z.object({
    skillId: z.string(),
    minLevel: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]),
    priority: z.enum(["low", "medium", "high"]),
  })).min(1, "Add at least one skill requirement"),
});

interface Skill {
  id: string;
  name: string;
}

export default function CreateIdeaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      problem: "",
      solution: "",
      description: "",
      category: "",
      stage: "Idea",
      visibility: "public",
      requirements: [{ skillId: "", minLevel: "Intermediate", priority: "medium" }],
    },
  });

  const addRequirement = () => {
    const current = form.getValues("requirements");
    form.setValue("requirements", [...current, { skillId: "", minLevel: "Intermediate", priority: "medium" }]);
  };

  const removeRequirement = (index: number) => {
    const current = form.getValues("requirements");
    form.setValue("requirements", current.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const result = await createIdeaAction(values);
      if (result.success) {
        toast.success("Idea posted successfully!");
        router.push("/ideas");
      } else {
        toast.error(result.error || "Failed to create idea");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Load skills on mount
  useEffect(() => {
    getAvailableSkillsAction().then(setSkills);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Share Your Idea</h1>
        <p className="text-muted-foreground">Describe your vision and find the perfect teammates to bring it to life.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="p-6 space-y-6">
            <div className="grid gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AI-Powered Personal Finance Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FinTech">FinTech</SelectItem>
                          <SelectItem value="HealthTech">HealthTech</SelectItem>
                          <SelectItem value="EdTech">EdTech</SelectItem>
                          <SelectItem value="SaaS">SaaS</SelectItem>
                          <SelectItem value="Web3">Web3</SelectItem>
                          <SelectItem value="AI/ML">AI/ML</SelectItem>
                          <SelectItem value="E-commerce">E-commerce</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Stage</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Idea">Idea</SelectItem>
                          <SelectItem value="Planning">Planning</SelectItem>
                          <SelectItem value="Prototype">Prototype</SelectItem>
                          <SelectItem value="MVP">MVP</SelectItem>
                          <SelectItem value="Testing">Testing</SelectItem>
                          <SelectItem value="Launch">Launch</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              The Vision
            </h3>
            <div className="grid gap-6">
              <FormField
                control={form.control}
                name="problem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>The Problem</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What pain point are you solving?"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="solution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>The Solution</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="How does your idea solve this problem?"
                        className="min-h-[120px]"
                        {...field}
                      />
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
                    <FormLabel>Full Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a deep dive into the features, target audience, and goals..."
                        className="min-h-[200px]"
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Teammate Requirements</h3>
              <Button type="button" variant="outline" size="sm" onClick={addRequirement} className="gap-1">
                <Plus className="h-4 w-4" />
                Add Skill
              </Button>
            </div>

            <div className="space-y-4">
              {form.watch("requirements").map((_, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-muted/50 border relative group">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeRequirement(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  <FormField
                    control={form.control}
                    name={`requirements.${index}.skillId`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Skill</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select skill" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {skills.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`requirements.${index}.minLevel`}
                    render={({ field }) => (
                      <FormItem className="w-full sm:w-40">
                        <FormLabel className="text-xs">Min Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`requirements.${index}.priority`}
                    render={({ field }) => (
                      <FormItem className="w-full sm:w-40">
                        <FormLabel className="text-xs">Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="ghost" type="button" onClick={() => router.push("/ideas")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="px-8">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Idea
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
