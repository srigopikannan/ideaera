"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";
import {
  sendDirectMessageAction,
  getChatHistoryAction,
  markReadAction,
} from "@/app/(dashboard)/actions/social";
import { toast } from "sonner";
import NextLink from "next/link";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: Date;
}

interface MessageForm {
  content: string;
}

export default function MessageDetailPage() {
  const params = useParams();
  const partnerId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<MessageForm>({
    defaultValues: {
      content: "",
    },
  });

  async function loadMessages() {
    try {
      const history = await getChatHistoryAction(partnerId);

      // Server returns newest first, so reverse for chat display.
      setMessages([...history].reverse());

      await markReadAction(partnerId);
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!partnerId) return;

    loadMessages();
  }, [partnerId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onSubmit = async (data: MessageForm) => {
    const content = data.content.trim();

    if (!content) {
      return;
    }

    reset({ content: "" });

    try {
      const result = await sendDirectMessageAction(
        partnerId,
        content
      );

      if (!result.success) {
        toast.error(
          result.error || "Failed to send message"
        );
        return;
      }

      // Refetch the conversation so the newly created
      // message has its real id, sender_id, receiver_id,
      // and created_at values.
      await loadMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("An unexpected error occurred");
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] rounded-3xl border overflow-hidden bg-background">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center justify-between bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            asChild
          >
            <NextLink href="/messages">
              <ArrowLeft className="h-4 w-4" />
            </NextLink>
          </Button>

          <Avatar className="h-10 w-10">
            <AvatarImage src={undefined} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>

          <div>
            <p className="font-semibold leading-none">
              Teammate
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              Online
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat Messages */}
      <ScrollArea
        ref={scrollRef}
        className="flex-1 p-6"
      >
        <div className="space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center py-20">
              <p className="text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              /*
               * Messages returned by the server contain the
               * actual sender_id.
               *
               * The current user's id is not available in this
               * page yet, so we use the temporary "me" value only
               * if it exists.
               */
              const isMe = msg.sender_id === "me";

              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    isMe
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] space-y-1 ${
                      isMe
                        ? "items-end"
                        : "items-start"
                    } flex flex-col`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted rounded-tl-none"
                      }`}
                    >
                      {msg.content}
                    </div>

                    <span className="text-[10px] text-muted-foreground px-1">
                      {new Date(
                        msg.created_at
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-4 border-t bg-background">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex gap-2"
        >
          <Input
            {...register("content")}
            placeholder="Type your message..."
            className="flex-1"
            autoComplete="off"
          />

          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}