"use client";

import * as React from "react";
import { cn, getInitials } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
}

export function Avatar({
  src,
  alt,
  size = "md",
  online,
  className,
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = React.useState(false);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl",
  };

  const statusSize = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3.5 w-3.5",
    xl: "h-4 w-4",
  };

  return (
    <div className={cn("relative inline-block flex-shrink-0", className)} {...props}>
      <div
        className={cn(
          "relative overflow-hidden rounded-full border border-border bg-muted flex items-center justify-center font-medium text-muted-foreground select-none",
          sizeClasses[size]
        )}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <span>{getInitials(alt)}</span>
        )}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-surface bg-success",
            statusSize[size],
            !online && "bg-muted-foreground/50"
          )}
        />
      )}
    </div>
  );
}
