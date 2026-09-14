"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Conversation, Message, Profile } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMessageAction } from "@/app/(dashboard)/actions/social";
import { formatTimeAgo } from "@/lib/utils";
import {
  Send,
  Search,
  MessageSquare,
  ArrowLeft,
  Sparkles,
  CheckCheck,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MessagingInterfaceProps {
  conversations: Conversation[];
  activeUserId?: string;
  initialMessages?: Message[];
}

export function MessagingInterface({
  conversations,
  activeUserId,
  initialMessages = [],
}: MessagingInterfaceProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedUserId, setSelectedUserId] = React.useState<string | undefined>(
    activeUserId || conversations[0]?.other_user.id
  );
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [inputContent, setInputContent] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Active user details
  const activeConversation = conversations.find(
    (c) => c.other_user.id === selectedUserId
  );
  const activeUser = activeConversation?.other_user;

  // Filtered conversations
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.other_user.full_name.toLowerCase().includes(q) ||
      c.other_user.username.toLowerCase().includes(q) ||
      c.last_message.content.toLowerCase().includes(q)
    );
  });

  const handleSelectConversation = (userId: string) => {
    setSelectedUserId(userId);
    router.push(`/messages/${userId}`);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || !selectedUserId || isSending) return;

    const content = inputContent.trim();
    setInputContent("");
    setIsSending(true);

    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      sender_id: "usr_curr_1",
      receiver_id: selectedUserId,
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await sendMessageAction(selectedUserId, content);
      if (res.success && res.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMessage.id ? res.message! : m))
        );
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-surface shadow-card overflow-hidden h-[calc(100vh-140px)] min-h-[550px] flex">
      {/* Pane 1: Conversations List */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-surface flex-shrink-0",
          selectedUserId && "hidden md:flex"
        )}
      >
        {/* Search header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Messages</h2>
            <span className="text-xs text-muted-foreground font-medium">
              {conversations.length} {conversations.length === 1 ? "thread" : "threads"}
            </span>
          </div>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* List items */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isSelected = conv.other_user.id === selectedUserId;
              return (
                <button
                  key={conv.other_user.id}
                  onClick={() => handleSelectConversation(conv.other_user.id)}
                  className={cn(
                    "w-full p-4 flex items-start gap-3 text-left transition-colors hover:bg-surface-hover group",
                    isSelected && "bg-muted/70"
                  )}
                >
                  <Avatar
                    src={conv.other_user.avatar_url}
                    alt={conv.other_user.full_name}
                    size="md"
                    online={true}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {conv.other_user.full_name}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(conv.last_message.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground truncate line-clamp-1">
                      {conv.last_message.content}
                    </p>
                  </div>

                  {conv.unread_count > 0 && (
                    <span className="flex-shrink-0 h-4 min-w-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No conversations found.
            </div>
          )}
        </div>
      </div>

      {/* Pane 2: Active Chat Conversation */}
      <div
        className={cn(
          "flex-1 flex flex-col bg-background/50",
          !selectedUserId && "hidden md:flex"
        )}
      >
        {activeUser ? (
          <>
            {/* Chat Top Bar */}
            <div className="h-16 px-6 border-b border-border bg-surface flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedUserId(undefined)}
                  className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-surface-hover"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <Avatar
                  src={activeUser.avatar_url}
                  alt={activeUser.full_name}
                  size="sm"
                  online={true}
                />

                <div>
                  <Link
                    href={`/people/${activeUser.username}`}
                    className="text-sm font-bold text-foreground hover:text-primary transition-colors block leading-none"
                  >
                    {activeUser.full_name}
                  </Link>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block truncate max-w-xs">
                    {activeUser.headline || `@${activeUser.username}`}
                  </span>
                </div>
              </div>

              <Link href={`/people/${activeUser.username}`}>
                <Button size="sm" variant="outline" className="text-xs h-8">
                  Profile
                </Button>
              </Link>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Encrypted Notice Banner */}
              <div className="py-2 text-center text-[11px] text-muted-foreground">
                <span className="px-3 py-1 rounded-full bg-surface border border-border/80">
                  🔒 Direct innovator messaging channel
                </span>
              </div>

              {messages.map((msg) => {
                const isMe = msg.sender_id === "usr_curr_1";
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[80%] sm:max-w-[70%]",
                      isMe ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-subtle",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-surface border border-border text-foreground rounded-bl-none"
                      )}
                    >
                      {msg.content}
                    </div>

                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                      <span>{formatTimeAgo(msg.created_at)}</span>
                      {isMe && (
                        <span>
                          {msg.read_at ? (
                            <CheckCheck className="h-3 w-3 text-primary" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-border bg-surface flex items-center gap-3"
            >
              <Input
                type="text"
                placeholder={`Message ${activeUser.full_name}...`}
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                className="flex-1 h-11"
              />
              <Button
                type="submit"
                variant="default"
                size="icon"
                disabled={!inputContent.trim() || isSending}
                className="h-11 w-11 rounded-xl shadow-subtle flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 stroke-[1.5] mb-3 opacity-40" />
            <h3 className="text-base font-semibold text-foreground">
              Select a conversation
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Choose an existing chat thread or reach out to someone new from the people directory.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
