"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Conversation, Message, Profile } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMessageAction, getMessagesAction } from "@/app/(dashboard)/actions/social";
import { formatTimeAgo } from "@/lib/utils";
import {
  Send,
  Search,
  MessageSquare,
  ArrowLeft,
  CheckCheck,
  Check,
  Users,
  MapPin,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MessagingInterfaceProps {
  conversations: Conversation[];
  people: Profile[];
  currentUserId: string;
  activeUserId?: string;
  activeUser?: Profile | null;
  initialMessages?: Message[];
}

export function MessagingInterface({
  conversations,
  people,
  currentUserId,
  activeUserId,
  activeUser,
  initialMessages = [],
}: MessagingInterfaceProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");

  // Determine initial active tab:
  // If active user is selected and not yet in conversations, default to 'people' tab
  // If conversations is empty, default to 'people' tab so user sees available innovators
  const [activeTab, setActiveTab] = React.useState<"chats" | "people">(() => {
    if (activeUserId && !conversations.some((c) => c.other_user.id === activeUserId)) {
      return "people";
    }
    return conversations.length > 0 ? "chats" : "people";
  });

  const [conversationList, setConversationList] = React.useState<Conversation[]>(conversations);
  const [selectedUserId, setSelectedUserId] = React.useState<string | undefined>(
    activeUserId || (conversations.length > 0 ? conversations[0].other_user.id : undefined)
  );

  // Resolved selected user profile
  const [selectedUser, setSelectedUser] = React.useState<Profile | undefined>(() => {
    if (activeUser) return activeUser;
    if (activeUserId) {
      const fromConv = conversations.find((c) => c.other_user.id === activeUserId)?.other_user;
      if (fromConv) return fromConv;
      return people.find((p) => p.id === activeUserId);
    }
    return conversations[0]?.other_user;
  });

  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [inputContent, setInputContent] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keep selected user updated if activeUserId/activeUser props change
  React.useEffect(() => {
    if (activeUserId && activeUserId !== selectedUserId) {
      setSelectedUserId(activeUserId);
      const user =
        activeUser ||
        conversationList.find((c) => c.other_user.id === activeUserId)?.other_user ||
        people.find((p) => p.id === activeUserId);
      if (user) setSelectedUser(user);
    }
  }, [activeUserId, activeUser, conversationList, people]);

  // Filtered conversations
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return conversationList;
    const q = searchQuery.toLowerCase().trim();
    return conversationList.filter((c) => {
      const nameMatch = c.other_user.full_name?.toLowerCase().includes(q);
      const userMatch = c.other_user.username?.toLowerCase().includes(q);
      const skillMatch = c.other_user.skills?.some((s) => s.toLowerCase().includes(q));
      const contentMatch = c.last_message?.content?.toLowerCase().includes(q);
      return nameMatch || userMatch || skillMatch || contentMatch;
    });
  }, [conversationList, searchQuery]);

  // Filtered people
  const filteredPeople = React.useMemo(() => {
    if (!searchQuery.trim()) return people;
    const q = searchQuery.toLowerCase().trim();
    return people.filter((p) => {
      const nameMatch = p.full_name?.toLowerCase().includes(q);
      const userMatch = p.username?.toLowerCase().includes(q);
      const skillMatch = p.skills?.some((s) => s.toLowerCase().includes(q));
      const bioMatch =
        p.bio?.toLowerCase().includes(q) || p.headline?.toLowerCase().includes(q);
      return nameMatch || userMatch || skillMatch || bioMatch;
    });
  }, [people, searchQuery]);

  const handleSelectUser = async (user: Profile) => {
    if (selectedUserId === user.id) return;

    setSelectedUserId(user.id);
    setSelectedUser(user);
    window.history.pushState(null, "", `/messages/${user.id}`);

    // Check if conversation already exists in conversations
    const existingConv = conversationList.find((c) => c.other_user.id === user.id);
    if (!existingConv) {
      // Direct new conversation: start with empty message list immediately
      setMessages([]);
    } else {
      setIsLoadingMessages(true);
      try {
        const res = await getMessagesAction(user.id);
        if (res.success && res.messages) {
          setMessages(res.messages);
        }
      } catch (err) {
        console.error("Failed to fetch messages for user", err);
      } finally {
        setIsLoadingMessages(false);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || !selectedUserId || isSending) return;

    const content = inputContent.trim();
    setInputContent("");
    setIsSending(true);

    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: selectedUserId,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await sendMessageAction(selectedUserId, content);
      if (res.success && res.message) {
        const confirmedMsg = res.message;
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMessage.id ? confirmedMsg : m))
        );

        // Update conversation list
        setConversationList((prev) => {
          const exists = prev.some((c) => c.other_user.id === selectedUserId);
          if (exists) {
            return prev.map((c) =>
              c.other_user.id === selectedUserId
                ? { ...c, last_message: confirmedMsg }
                : c
            );
          } else if (selectedUser) {
            return [
              {
                other_user: selectedUser,
                last_message: confirmedMsg,
                unread_count: 0,
              },
              ...prev,
            ];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-surface shadow-card overflow-hidden h-[calc(100vh-140px)] min-h-[550px] flex">
      {/* Pane 1: Conversations & People List */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-surface flex-shrink-0 overflow-x-hidden",
          selectedUserId && "hidden md:flex"
        )}
      >
        {/* Header & Search */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Messages</h2>
            <span className="text-xs text-muted-foreground font-medium">
              {conversationList.length} {conversationList.length === 1 ? "chat" : "chats"}
            </span>
          </div>

          <div className="relative">
            <Input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
              className="h-9 text-xs"
            />
          </div>

          {/* Tab Navigation: Chats vs People */}
          <div className="flex border-b border-border/80 gap-3 pt-1">
            <button
              onClick={() => setActiveTab("chats")}
              className={cn(
                "pb-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5",
                activeTab === "chats"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Chats</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                {conversationList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("people")}
              className={cn(
                "pb-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5",
                activeTab === "people"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              <span>People</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                {people.length}
              </span>
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
          {activeTab === "chats" ? (
            /* Chats List */
            filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isSelected = conv.other_user.id === selectedUserId;
                return (
                  <button
                    key={conv.other_user.id}
                    onClick={() => handleSelectUser(conv.other_user)}
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
              <div className="p-8 text-center space-y-3">
                <p className="text-xs text-muted-foreground">
                  {searchQuery ? "No chats found." : "No active chat conversations yet."}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("people")}
                  className="text-xs gap-1.5"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Browse People</span>
                </Button>
              </div>
            )
          ) : (
            /* People List */
            filteredPeople.length > 0 ? (
              filteredPeople.map((person) => {
                const isSelected = person.id === selectedUserId;
                const hasLocation =
                  person.show_location !== false &&
                  (person.city || person.state || person.location);
                const locationText =
                  [person.city, person.state].filter(Boolean).join(", ") ||
                  person.location ||
                  null;

                return (
                  <div
                    key={person.id}
                    onClick={() => handleSelectUser(person)}
                    className={cn(
                      "w-full p-4 flex items-start gap-3 text-left transition-colors hover:bg-surface-hover group cursor-pointer",
                      isSelected && "bg-muted/70"
                    )}
                  >
                    <Avatar
                      src={person.avatar_url}
                      alt={person.full_name}
                      size="md"
                      online={true}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {person.full_name}
                          </p>
                          <span className="text-[11px] text-muted-foreground block truncate">
                            @{person.username}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectUser(person);
                          }}
                          className="h-7 text-[11px] px-2.5 rounded-lg shrink-0 gap-1"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>Message</span>
                        </Button>
                      </div>

                      {/* Bio or Headline */}
                      {(person.bio || person.headline) && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {person.bio || person.headline}
                        </p>
                      )}

                      {/* Location */}
                      {hasLocation && locationText && (
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                          <span className="truncate">{locationText}</span>
                        </div>
                      )}

                      {/* Skills */}
                      {person.skills && person.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {person.skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20"
                            >
                              {skill}
                            </span>
                          ))}
                          {person.skills.length > 3 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-muted-foreground">
                              +{person.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No people found matching "{searchQuery}".
              </div>
            )
          )}
        </div>
      </div>

      {/* Pane 2: Active Chat Conversation */}
      <div
        className={cn(
          "flex-1 flex flex-col bg-background/50 overflow-hidden",
          !selectedUserId && "hidden md:flex"
        )}
      >
        {selectedUser ? (
          <>
            {/* Chat Top Bar */}
            <div className="h-16 px-6 border-b border-border bg-surface flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => {
                    setSelectedUserId(undefined);
                    setSelectedUser(undefined);
                    window.history.pushState(null, "", "/messages");
                  }}
                  className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-surface-hover shrink-0"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <Avatar
                  src={selectedUser.avatar_url}
                  alt={selectedUser.full_name}
                  size="sm"
                  online={true}
                  className="shrink-0"
                />

                <div className="min-w-0">
                  <Link
                    href={`/people/${selectedUser.username}`}
                    className="text-sm font-bold text-foreground hover:text-primary transition-colors block leading-tight truncate"
                  >
                    {selectedUser.full_name}
                  </Link>
                  <span className="text-[11px] text-muted-foreground block truncate">
                    {selectedUser.headline || `@${selectedUser.username}`}
                  </span>
                </div>
              </div>

              <Link href={`/people/${selectedUser.username}`} className="shrink-0">
                <Button size="sm" variant="outline" className="text-xs h-8">
                  Profile
                </Button>
              </Link>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Encrypted Notice Banner */}
              <div className="py-1 text-center text-[11px] text-muted-foreground">
                <span className="px-3 py-1 rounded-full bg-surface border border-border/80">
                  🔒 Direct innovator messaging channel
                </span>
              </div>

              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <Avatar
                    src={selectedUser.avatar_url}
                    alt={selectedUser.full_name}
                    size="lg"
                    online={true}
                    className="mb-3 h-16 w-16"
                  />
                  <h3 className="text-sm font-bold text-foreground">
                    Start a conversation with {selectedUser.full_name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Say hello, share project ideas, collaborate on hackathons, or exchange feedback.
                  </p>
                  {selectedUser.skills && selectedUser.skills.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-1 mt-3 max-w-xs">
                      {selectedUser.skills.slice(0, 4).map((s, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface border border-border text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId;
                  const isRead = Boolean(msg.is_read || msg.read_at);
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
                          "rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-subtle break-words",
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
                            {isRead ? (
                              <CheckCheck className="h-3 w-3 text-primary" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-border bg-surface flex items-center gap-3 flex-shrink-0"
            >
              <Input
                type="text"
                placeholder={`Message ${selectedUser.full_name}...`}
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                className="flex-1 h-11"
                autoFocus
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
