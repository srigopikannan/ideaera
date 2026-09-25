"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Project,
  ProjectTask,
  ProjectMilestone,
  ProjectMember,
  ProjectFile,
  ProjectDiscussion,
  ProjectActivity,
  Profile,
  TaskStatus,
  TaskPriority,
} from "@/types";
import {
  createProjectTaskAction,
  updateProjectTaskAction,
  deleteProjectTaskAction,
  createProjectMilestoneAction,
  addProjectFileAction,
  deleteProjectFileAction,
  addProjectDiscussionAction,
} from "@/app/(dashboard)/actions/projects";
import {
  Kanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Send,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  Users,
  Flag,
  MessageSquare,
  Activity,
  Calendar,
  Check,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { Github } from "@/components/ui/brand-icons";
import { cn, formatDate } from "@/lib/utils";

interface ProjectWorkspaceProps {
  project: Project;
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  members: ProjectMember[];
  files: ProjectFile[];
  discussions: ProjectDiscussion[];
  activity: ProjectActivity[];
  currentUser?: Profile | null;
}

const TABS = [
  { id: "overview", label: "Overview", icon: Flag },
  { id: "tasks", label: "Tasks & Kanban", icon: Kanban },
  { id: "milestones", label: "Milestones", icon: Calendar },
  { id: "team", label: "Team Roles", icon: Users },
  { id: "files", label: "Files & Resources", icon: FileText },
  { id: "discussions", label: "Discussions", icon: MessageSquare },
  { id: "activity", label: "Activity Log", icon: Activity },
];

const TASK_STATUSES: TaskStatus[] = ["Todo", "In Progress", "Review", "Completed"];
const TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];

export function ProjectWorkspace({
  project,
  tasks: initialTasks,
  milestones: initialMilestones,
  members: initialMembers,
  files: initialFiles,
  discussions: initialDiscussions,
  activity: initialActivity,
  currentUser,
}: ProjectWorkspaceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("overview");

  // Local state
  const [tasks, setTasks] = React.useState<ProjectTask[]>(initialTasks);
  const [milestones, setMilestones] = React.useState<ProjectMilestone[]>(initialMilestones);
  const [files, setFiles] = React.useState<ProjectFile[]>(initialFiles);
  const [discussions, setDiscussions] = React.useState<ProjectDiscussion[]>(initialDiscussions);
  const [activity, setActivity] = React.useState<ProjectActivity[]>(initialActivity);

  // Modals state
  const [isAddTaskOpen, setIsAddTaskOpen] = React.useState(false);
  const [taskTitle, setTaskTitle] = React.useState("");
  const [taskDesc, setTaskDesc] = React.useState("");
  const [taskStatus, setTaskStatus] = React.useState<TaskStatus>("Todo");
  const [taskPriority, setTaskPriority] = React.useState<TaskPriority>("Medium");
  const [taskAssignedTo, setTaskAssignedTo] = React.useState("");
  const [taskDueDate, setTaskDueDate] = React.useState("");
  const [isSubmittingTask, setIsSubmittingTask] = React.useState(false);

  // Milestone modal state
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = React.useState(false);
  const [milestoneTitle, setMilestoneTitle] = React.useState("");
  const [milestoneDesc, setMilestoneDesc] = React.useState("");
  const [milestoneDue, setMilestoneDue] = React.useState("");
  const [isSubmittingMilestone, setIsSubmittingMilestone] = React.useState(false);

  // File modal state
  const [isAddFileOpen, setIsAddFileOpen] = React.useState(false);
  const [fileName, setFileName] = React.useState("");
  const [fileUrl, setFileUrl] = React.useState("");
  const [fileType, setFileType] = React.useState("link");
  const [isSubmittingFile, setIsSubmittingFile] = React.useState(false);

  // Discussion state
  const [messageInput, setMessageInput] = React.useState("");
  const [isSubmittingMessage, setIsSubmittingMessage] = React.useState(false);

  const isOwner = Boolean(currentUser?.id && project.owner_id === currentUser.id);
  const isMember = Boolean(
    currentUser?.id && initialMembers.some((m) => m.user_id === currentUser.id)
  );

  // Real Progress Calculation based on completed tasks
  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Task actions
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setIsSubmittingTask(true);

    const res = await createProjectTaskAction(project.id, {
      title: taskTitle.trim(),
      description: taskDesc.trim() || undefined,
      status: taskStatus,
      priority: taskPriority,
      assigned_to: taskAssignedTo || undefined,
      due_date: taskDueDate || undefined,
    });

    setIsSubmittingTask(false);

    if (res.success && res.task) {
      setTasks((prev) => [res.task!, ...prev]);
      setIsAddTaskOpen(false);
      setTaskTitle("");
      setTaskDesc("");
      setTaskStatus("Todo");
      setTaskPriority("Medium");
      setTaskAssignedTo("");
      setTaskDueDate("");
      router.refresh();
    } else {
      alert(res.error || "Failed to create task.");
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    const res = await updateProjectTaskAction(taskId, { status: newStatus }, project.id);
    if (!res.success) {
      alert(res.error || "Failed to update task.");
      router.refresh();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const res = await deleteProjectTaskAction(taskId, project.id);
    if (!res.success) {
      alert(res.error || "Failed to delete task.");
      router.refresh();
    }
  };

  // Milestone actions
  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    setIsSubmittingMilestone(true);

    const res = await createProjectMilestoneAction(project.id, {
      title: milestoneTitle.trim(),
      description: milestoneDesc.trim() || undefined,
      due_date: milestoneDue || undefined,
    });

    setIsSubmittingMilestone(false);

    if (res.success && res.milestone) {
      setMilestones((prev) => [...prev, res.milestone!]);
      setIsAddMilestoneOpen(false);
      setMilestoneTitle("");
      setMilestoneDesc("");
      setMilestoneDue("");
      router.refresh();
    } else {
      alert(res.error || "Failed to create milestone.");
    }
  };

  // Resource actions
  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !fileUrl.trim()) return;
    setIsSubmittingFile(true);

    const res = await addProjectFileAction(project.id, {
      name: fileName.trim(),
      url: fileUrl.trim(),
      file_type: fileType,
    });

    setIsSubmittingFile(false);

    if (res.success && res.file) {
      setFiles((prev) => [res.file!, ...prev]);
      setIsAddFileOpen(false);
      setFileName("");
      setFileUrl("");
      router.refresh();
    } else {
      alert(res.error || "Failed to add resource.");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    const res = await deleteProjectFileAction(fileId, project.id);
    if (!res.success) {
      alert(res.error || "Failed to delete file.");
      router.refresh();
    }
  };

  // Discussion actions
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    setIsSubmittingMessage(true);

    const res = await addProjectDiscussionAction(project.id, messageInput.trim());
    setIsSubmittingMessage(false);

    if (res.success && res.discussion) {
      setDiscussions((prev) => [res.discussion!, ...prev]);
      setMessageInput("");
      router.refresh();
    } else {
      alert(res.error || "Failed to send message.");
    }
  };

  return (
    <section className="relative w-full space-y-6">
      {/* TABS NAVIGATION BAR */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/[0.08] scrollbar-none">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-mono transition-all shrink-0",
                isActive
                  ? "bg-white/[0.08] text-white border border-white/20 shadow-md font-medium"
                  : "text-neutral-400 hover:text-white hover:bg-white/[0.02]"
              )}
            >
              <TabIcon className={cn("h-3.5 w-3.5", isActive ? "text-indigo-400" : "text-neutral-500")} />
              <span>{tab.label}</span>
              {tab.id === "tasks" && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">
                  {tasks.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Progress Bar & KPI Cards */}
          <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#0c0e17] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                  REAL-TIME PROGRESS ENGINE
                </span>
                <h4 className="text-xl font-light text-white">System Delivery Velocity</h4>
              </div>
              <div className="text-right">
                <span className="text-3xl font-light text-emerald-400 font-mono">
                  {progressPercent}%
                </span>
                <span className="text-xs text-neutral-500 font-mono block">
                  {completedCount} of {totalTasks} tasks complete
                </span>
              </div>
            </div>

            <div className="h-2.5 w-full bg-white/[0.05] rounded-full overflow-hidden p-0.5 border border-white/[0.05]">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Tasks</span>
                <p className="text-xl font-mono text-white">{totalTasks}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Milestones</span>
                <p className="text-xl font-mono text-white">{milestones.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Team Members</span>
                <p className="text-xl font-mono text-white">{initialMembers.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Resources</span>
                <p className="text-xl font-mono text-white">{files.length}</p>
              </div>
            </div>
          </div>

          {/* Quick Tasks & Milestones Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Urgent Tasks */}
            <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#0c0e17] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                  <Kanban className="h-4 w-4 text-indigo-400" />
                  <span>Pending Tasks</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("tasks")}
                  className="text-xs font-mono text-indigo-400 hover:text-indigo-300"
                >
                  View All ({tasks.length})
                </button>
              </div>

              {tasks.filter((t) => t.status !== "Completed").length === 0 ? (
                <p className="text-xs font-mono text-neutral-500 p-4 text-center">
                  All tasks completed! Great work team.
                </p>
              ) : (
                <div className="space-y-2">
                  {tasks
                    .filter((t) => t.status !== "Completed")
                    .slice(0, 4)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl border border-white/[0.05] bg-[#090b12] flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 truncate">
                          <span className="text-xs text-white font-medium block truncate">
                            {t.title}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            Status: {t.status} · Priority: {t.priority}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUpdateTaskStatus(t.id, "Completed")}
                          className="px-2.5 py-1 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-[10px] font-mono transition-colors shrink-0"
                        >
                          Mark Done
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Next Milestones */}
            <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#0c0e17] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <span>Key Milestones</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("milestones")}
                  className="text-xs font-mono text-purple-400 hover:text-purple-300"
                >
                  View Timeline
                </button>
              </div>

              {milestones.length === 0 ? (
                <p className="text-xs font-mono text-neutral-500 p-4 text-center">
                  No milestones configured yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {milestones.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-white/[0.05] bg-[#090b12] flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 truncate">
                        <span className="text-xs text-white font-medium block truncate">
                          {m.title}
                        </span>
                        {m.description && (
                          <span className="text-[10px] font-mono text-neutral-500 line-clamp-1">
                            {m.description}
                          </span>
                        )}
                      </div>
                      {m.due_date && (
                        <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                          {formatDate(m.due_date)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TASKS & KANBAN */}
      {activeTab === "tasks" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-light text-white">Project Work Streams</h4>
              <p className="text-xs font-mono text-neutral-400">
                Move tasks across swimlanes to calculate verified completion.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddTaskOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {/* Kanban Board Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TASK_STATUSES.map((status) => {
              const colTasks = tasks.filter((t) => t.status === status);
              const colBadge = {
                Todo: "text-neutral-400 border-white/10",
                "In Progress": "text-indigo-400 border-indigo-500/30",
                Review: "text-amber-400 border-amber-500/30",
                Completed: "text-emerald-400 border-emerald-500/30",
              }[status];

              return (
                <div
                  key={status}
                  className="p-4 rounded-3xl border border-white/[0.08] bg-[#0c0e17] flex flex-col space-y-3 min-h-[380px]"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <span className={cn("text-xs font-mono uppercase tracking-wider font-semibold", colBadge)}>
                      {status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-[10px] font-mono text-neutral-400">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[550px] pr-1">
                    {colTasks.length === 0 ? (
                      <div className="p-6 text-center text-xs font-mono text-neutral-600 border border-dashed border-white/[0.05] rounded-2xl">
                        No tasks in {status}
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-4 rounded-2xl border border-white/[0.06] bg-[#090b12] hover:border-white/20 transition-all space-y-2.5 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-medium text-white leading-snug">
                              {task.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-neutral-600 hover:text-rose-400 p-1 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-[10px] font-mono">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded",
                                task.priority === "Urgent"
                                  ? "bg-rose-500/20 text-rose-300"
                                  : task.priority === "High"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-white/5 text-neutral-400"
                              )}
                            >
                              {task.priority}
                            </span>

                            {/* Move status dropdown */}
                            <select
                              value={task.status}
                              onChange={(e) =>
                                handleUpdateTaskStatus(task.id, e.target.value as TaskStatus)
                              }
                              className="bg-white/[0.04] text-neutral-300 border border-white/10 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                            >
                              {TASK_STATUSES.map((st) => (
                                <option key={st} value={st} className="bg-[#0e111a] text-white">
                                  Move: {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MILESTONES */}
      {activeTab === "milestones" && (
        <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#0c0e17] space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h4 className="text-lg font-light text-white">System Evolution Milestones</h4>
              <p className="text-xs font-mono text-neutral-400">
                Key progression markers from conception to live production deployment.
              </p>
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsAddMilestoneOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Milestone</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {milestones.length === 0 ? (
              <p className="text-xs font-mono text-neutral-500 p-8 text-center">
                No milestones recorded yet. Add your first milestone above.
              </p>
            ) : (
              milestones.map((m, idx) => (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl border border-white/[0.06] bg-[#090b12] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-xs flex items-center justify-center shrink-0">
                      0{idx + 1}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-sm text-white font-medium block">{m.title}</span>
                      {m.description && (
                        <p className="text-xs text-neutral-400 font-light">{m.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {m.due_date && (
                      <span className="text-xs font-mono text-neutral-500">
                        Target: {formatDate(m.due_date)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: TEAM ROLES */}
      {activeTab === "team" && (
        <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#0c0e17] space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h4 className="text-lg font-light text-white">Project Contributors & Roles</h4>
              <p className="text-xs font-mono text-neutral-400">
                Active venture engineers, designers, and domain collaborators.
              </p>
            </div>
            <Link
              href="/people"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 hover:border-white/20 text-neutral-200 text-xs font-mono transition-colors"
            >
              <span>Recruit Members</span>
              <ExternalLink className="h-3 w-3 text-neutral-400" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Project Owner */}
            <div className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/15 space-y-3">
              <div className="flex items-center gap-3">
                {project.owner?.avatar_url ? (
                  <img
                    src={project.owner.avatar_url}
                    alt={project.owner.full_name || ""}
                    className="h-10 w-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-sm flex items-center justify-center shrink-0">
                    {(project.owner?.full_name || "O")[0]}
                  </div>
                )}
                <div className="truncate">
                  <Link
                    href={`/people/${project.owner?.username || ""}`}
                    className="text-xs font-medium text-white hover:underline block truncate"
                  >
                    {project.owner?.full_name || "Owner"}
                  </Link>
                  <span className="text-[10px] font-mono text-indigo-400">Project Lead</span>
                </div>
              </div>
            </div>

            {/* Other Members */}
            {initialMembers
              .filter((m) => m.user_id !== project.owner_id)
              .map((member) => (
                <div
                  key={member.user_id}
                  className="p-5 rounded-2xl border border-white/[0.06] bg-[#090b12] space-y-3"
                >
                  <div className="flex items-center gap-3">
                    {member.user?.avatar_url ? (
                      <img
                        src={member.user.avatar_url}
                        alt={member.user.full_name || ""}
                        className="h-10 w-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-white/5 text-neutral-300 font-mono text-sm flex items-center justify-center shrink-0">
                        {(member.user?.full_name || "M")[0]}
                      </div>
                    )}
                    <div className="truncate">
                      <Link
                        href={`/people/${member.user?.username || ""}`}
                        className="text-xs font-medium text-white hover:underline block truncate"
                      >
                        {member.user?.full_name || "Member"}
                      </Link>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {member.role || "Collaborator"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 5: FILES & RESOURCES */}
      {activeTab === "files" && (
        <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#0c0e17] space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h4 className="text-lg font-light text-white">Repository, Docs & Artifacts</h4>
              <p className="text-xs font-mono text-neutral-400">
                Direct external links, documentation blueprints, and design systems.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddFileOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Resource</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Primary GitHub link if exists */}
            {project.repository_url && (
              <a
                href={project.repository_url}
                target="_blank"
                rel="noreferrer"
                className="p-5 rounded-2xl border border-white/[0.08] bg-[#090b12] hover:border-white/20 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2.5 rounded-xl bg-white/5 text-white shrink-0">
                    <Github className="h-4 w-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-medium text-white block truncate">
                      Source Code Repository
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">GitHub</span>
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white shrink-0" />
              </a>
            )}

            {/* Custom files */}
            {files.map((file) => (
              <div
                key={file.id}
                className="p-5 rounded-2xl border border-white/[0.08] bg-[#090b12] hover:border-white/20 transition-all flex items-center justify-between gap-3 group"
              >
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 truncate flex-1"
                >
                  <div className="p-2.5 rounded-xl bg-white/5 text-indigo-400 shrink-0">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-medium text-white block truncate">
                      {file.name}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 capitalize">
                      {file.file_type}
                    </span>
                  </div>
                </a>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleDeleteFile(file.id)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-white/5 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: DISCUSSIONS */}
      {activeTab === "discussions" && (
        <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#0c0e17] space-y-6">
          <div>
            <h4 className="text-lg font-light text-white">Project Dialogue Stream</h4>
            <p className="text-xs font-mono text-neutral-400">
              Internal asynchronous discussions, standups, and progress updates.
            </p>
          </div>

          {/* New message form */}
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="p-2 rounded-2xl border border-white/10 bg-[#090b12] focus-within:border-indigo-500 transition-all">
              <textarea
                rows={2}
                placeholder="Post a standup note, milestone update, or question for the team..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="w-full p-3 bg-transparent text-xs text-white placeholder:text-neutral-600 focus:outline-none resize-none font-sans"
              />
              <div className="flex justify-end p-2 border-t border-white/[0.04]">
                <button
                  type="submit"
                  disabled={isSubmittingMessage || !messageInput.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-40"
                >
                  <Send className="h-3 w-3" />
                  <span>{isSubmittingMessage ? "Transmitting..." : "Send Note"}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Messages list */}
          <div className="space-y-3">
            {discussions.length === 0 ? (
              <p className="text-xs font-mono text-neutral-500 p-8 text-center">
                No discussion messages posted yet.
              </p>
            ) : (
              discussions.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 rounded-2xl border border-white/[0.06] bg-[#090b12] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                    <span className="text-white font-medium">
                      {msg.user?.full_name || "Team Member"}
                    </span>
                    <span className="text-[10px] text-neutral-500">{formatDate(msg.created_at)}</span>
                  </div>
                  <p className="text-xs text-neutral-300 font-light leading-relaxed whitespace-pre-line">
                    {msg.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 7: ACTIVITY LOG */}
      {activeTab === "activity" && (
        <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#0c0e17] space-y-6">
          <div>
            <h4 className="text-lg font-light text-white">Immutable Project Activity Feed</h4>
            <p className="text-xs font-mono text-neutral-400">
              Verified record of state updates, task progression, and member operations.
            </p>
          </div>

          <div className="space-y-3">
            {activity.length === 0 ? (
              <p className="text-xs font-mono text-neutral-500 p-8 text-center">
                No logged activity yet.
              </p>
            ) : (
              activity.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl border border-white/[0.05] bg-[#090b12] flex items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    <span className="text-white font-medium capitalize">
                      {act.action.replace("_", " ")}
                    </span>
                    {act.details?.title && (
                      <span className="text-neutral-400 truncate max-w-xs">
                        &quot;{act.details.title}&quot;
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-500 shrink-0">
                    {formatDate(act.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0e111a] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-light text-white">Create Work Task</h3>
              <button
                type="button"
                onClick={() => setIsAddTaskOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-neutral-400">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Implement authentication callback with Supabase"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-neutral-400">Description</label>
                <textarea
                  rows={3}
                  placeholder="Acceptance criteria or implementation details..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-neutral-400">Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b12] border border-white/10 text-xs text-white focus:outline-none"
                  >
                    {TASK_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-neutral-400">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b12] border border-white/10 text-xs text-white focus:outline-none"
                  >
                    {TASK_PRIORITIES.map((pr) => (
                      <option key={pr} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-neutral-400">Assign To</label>
                  <select
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b12] border border-white/10 text-xs text-white focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {initialMembers.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.user?.full_name || m.user?.username || m.user_id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-neutral-400">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b12] border border-white/10 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
                  className="px-4 py-2 rounded-full border border-white/10 text-xs font-mono text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask || !taskTitle.trim()}
                  className="px-5 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-40"
                >
                  {isSubmittingTask ? "Saving..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MILESTONE MODAL */}
      {isAddMilestoneOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0e111a] p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-light text-white">Add Project Milestone</h3>
            <form onSubmit={handleCreateMilestone} className="space-y-3">
              <input
                type="text"
                placeholder="Milestone title (e.g. Alpha Testing)"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
              <textarea
                rows={2}
                placeholder="Milestone scope description..."
                value={milestoneDesc}
                onChange={(e) => setMilestoneDesc(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-sans"
              />
              <input
                type="date"
                value={milestoneDue}
                onChange={(e) => setMilestoneDue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#090b12] border border-white/10 text-xs text-white focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMilestoneOpen(false)}
                  className="px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-mono text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMilestone || !milestoneTitle.trim()}
                  className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-40"
                >
                  {isSubmittingMilestone ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD FILE MODAL */}
      {isAddFileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0e111a] p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-light text-white">Add Project Resource</h3>
            <form onSubmit={handleAddFile} className="space-y-3">
              <input
                type="text"
                placeholder="Resource name (e.g. Figma Design System)"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
              <input
                type="url"
                placeholder="Resource URL (https://...)"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#090b12] border border-white/10 text-xs text-white focus:outline-none"
              >
                <option value="link">General Link</option>
                <option value="github">GitHub Repo</option>
                <option value="figma">Figma</option>
                <option value="docs">Documentation</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddFileOpen(false)}
                  className="px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-mono text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFile || !fileName.trim() || !fileUrl.trim()}
                  className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-40"
                >
                  {isSubmittingFile ? "Adding..." : "Add Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
