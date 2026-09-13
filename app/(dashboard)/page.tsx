import { getMyConnectionsAction } from "@/app/(dashboard)/actions/social";
import { getMyIdeasAction } from "@/app/(dashboard)/actions/ideas";
import { getMyProjectsAction } from "@/app/(dashboard)/actions/projects";
import { getNotificationsAction } from "@/app/(dashboard)/actions/social";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NextLink from "next/link";
import {
  LayoutDashboard,
  Lightbulb,
  FolderKanban,
  Users,
  Bell,
  ArrowUpRight,
  TrendingUp,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const [connections, ideas, projects, notifications] = await Promise.all([
    getMyConnectionsAction(),
    getMyIdeasAction(),
    getMyProjectsAction(),
    getNotificationsAction(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, Founder</h1>
          <p className="text-muted-foreground">Here's what's happening with your collaborations.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <NextLink href="/match">Find Co-founder</NextLink>
          </Button>
          <Button asChild className="gap-2">
            <NextLink href="/ideas/create">
              <Lightbulb className="h-4 w-4" />
              New Idea
            </NextLink>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Network"
          value={connections.connections.length}
          description="Professional connections"
          icon={Users}
          trend="+12% this month"
          href="/connections"
        />
        <StatCard
          title="Ideas"
          value={ideas.length}
          description="Concepts in pipeline"
          icon={Lightbulb}
          trend="3 new this week"
          href="/ideas"
        />
        <StatCard
          title="Projects"
          value={projects.length}
          description="Active workspaces"
          icon={FolderKanban}
          trend="2 near completion"
          href="/projects"
        />
        <StatCard
          title="Alerts"
          value={notifications.filter(n => !n.is_read).length}
          description="Unread notifications"
          icon={Bell}
          trend="Action required"
          href="/connections"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Projects / Ideas */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Collaborations</CardTitle>
              <CardDescription>Your most recent project activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <NextLink href="/projects">View All <ArrowUpRight className="h-3 w-3" /></NextLink>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-2xl">
                <p className="text-muted-foreground">No active projects. Start something new!</p>
              </div>
            ) : (
              projects.slice(0, 3).map(project => (
                <div key={project.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border group hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold group-hover:text-primary transition-colors">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.description}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <NextLink href={`/projects/${project.id}`}>Workspace</NextLink>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions / AI Suggestion */}
        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Zap className="h-24 w-24 rotate-12" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Match Insight
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <p className="text-sm opacity-90">
                Based on your profile, there are <strong>4 new potential co-founders</strong> in the AI/ML space who complement your skill set.
              </p>
              <Button variant="secondary" className="w-full font-semibold" asChild>
                <NextLink href="/match">View Matches</NextLink>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <QuickLink href="/people" icon={Users} label="Discover" />
              <QuickLink href="/ideas" icon={Lightbulb} label="Explore" />
              <QuickLink href="/hackathons" icon={TrendingUp} label="Events" />
              <QuickLink href="/settings" icon={LayoutDashboard} label="Profile" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon, trend, href }: { title: string; value: number; description: string; icon: React.ComponentType<any>; trend: string; href: string }) {
  return (
    <Card className="group hover:shadow-md transition-all duration-300 cursor-pointer">
      <NextLink href={href}>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Icon className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="text-[10px] font-medium">
              {trend}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </NextLink>
    </Card>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<any>; label: string }) {
  return (
    <Button variant="outline" asChild className="h-auto py-3 gap-2 flex-col">
      <NextLink href={href}>
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </NextLink>
    </Button>
  );
}
