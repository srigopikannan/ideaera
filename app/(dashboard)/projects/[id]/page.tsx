import { getProjectDetailAction } from "@/app/(dashboard)/actions/projects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
Card,
CardContent,
CardHeader,
CardTitle,
} from "@/components/ui/card";
import {
Avatar,
AvatarFallback,
AvatarImage,
} from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
Users,
CheckSquare,
Flag,
Plus,
ExternalLink,
MessageSquare,
MoreVertical,
} from "lucide-react";
import NextLink from "next/link";
import { notFound } from "next/navigation";

function getName(value: unknown): string {
if (typeof value === "string") {
return value;
}

if (
value &&
typeof value === "object" &&
"full_name" in value &&
typeof value.full_name === "string"
) {
return value.full_name;
}

return "Unknown user";
}

function getAvatar(value: unknown): string | undefined {
if (
value &&
typeof value === "object" &&
"avatar_url" in value &&
typeof value.avatar_url === "string"
) {
return value.avatar_url;
}

return undefined;
}

function getInitial(value: unknown): string {
return getName(value).charAt(0).toUpperCase() || "?";
}

export default async function ProjectWorkspacePage({
params,
}: {
params: { id: string };
}) {
const result = await getProjectDetailAction(params.id);

if (!result.success || !result.project) {
notFound();
}

const { project, role } = result;

return (
  <div className="space-y-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <NextLink
           href="/projects"
           className="hover:text-primary transition-colors"
         >
Projects </NextLink>
        <span>/</span>

        <span className="text-foreground font-medium">
          {project.name}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {project.name}
        </h1>

        <Badge variant="secondary">
          {project.status}
        </Badge>
      </div>
    </div>

    <div className="flex gap-2">
      {project.repository_url && (
        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-2"
        >
          <NextLink
            href={project.repository_url}
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" />
            Repo
          </NextLink>
        </Button>
      )}

      <Button size="sm" className="gap-2">
        <MessageSquare className="h-4 w-4" />
        Project Chat
      </Button>
    </div>
  </div>

  <div className="grid gap-8 lg:grid-cols-4">
    <div className="lg:col-span-3 space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" />
              Milestones
            </CardTitle>

            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {project.milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No milestones yet.
              </p>
            ) : (
              project.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      {milestone.title}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Due{" "}
                      {milestone.due_date
                        ? new Date(
                            milestone.due_date
                          ).toLocaleDateString()
                        : "No date"}
                    </p>
                  </div>

                  {milestone.completed_at ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-200">
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      Pending
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-muted/50 text-center">
              <p className="text-2xl font-bold">
                {project.tasks.length}
              </p>

              <p className="text-xs text-muted-foreground">
                Total Tasks
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/50 text-center">
              <p className="text-2xl font-bold">
                {project.tasks.filter(
                  (task) => task.status === "Completed"
                ).length}
              </p>

              <p className="text-xs text-muted-foreground">
                Completed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">
            Task Board
          </h3>

          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>

        <div className="grid gap-4">
          {project.tasks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-3xl">
              <p className="text-muted-foreground">
                No tasks created yet. Start by breaking down
                your project.
              </p>
            </div>
          ) : (
            project.tasks.map((task) => {
              const assignee = task.assigned_to as unknown;

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-background border group hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        task.status === "Completed"
                          ? "bg-green-500"
                          : task.status === "In Progress"
                            ? "bg-blue-500"
                            : "bg-slate-300"
                      }`}
                    />

                    <div className="space-y-1">
                      <p
                        className={`text-sm font-medium ${
                          task.status === "Completed"
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {task.title}
                      </p>

                      <div className="flex items-center gap-2">
                        {assignee != null && (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage
                                src={getAvatar(assignee)}
                              />

                              <AvatarFallback>
                                {String(getInitial(assignee))}
                              </AvatarFallback>
                            </Avatar>

                            <span className="text-[10px] text-muted-foreground">
                              {String(getName(assignee))}
                            </span>
                          </div>
                        )}

                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 h-4"
                        >
                          {String(task.status)}
                        </Badge>

                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 h-4"
                        >
                          {String(task.priority)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>

    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Project Team
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            {project.members.map((member) => {
              const memberUser = member.user as unknown;

              return (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={getAvatar(memberUser)}
                      />

                      <AvatarFallback>
                        {getInitial(memberUser)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-0">
                      <p className="text-sm font-medium">
                        {getName(memberUser)}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  {member.role === "Owner" && (
                    <Badge className="text-[10px] h-4">
                      Owner
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {role === "Owner" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Invite Member
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Project Details
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Description
            </p>

            <p className="text-muted-foreground line-clamp-4">
              {project.description ||
                "No description provided."}
            </p>
          </div>

          <Separator />

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Created
            </p>

            <p className="text-muted-foreground">
              {new Date(
                project.created_at
              ).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
  </div>
);
}
