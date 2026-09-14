"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn("w-full", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            currentValue: value,
            onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({
  children,
  className,
  currentValue,
  onValueChange,
}: {
  children: React.ReactNode;
  className?: string;
  currentValue?: string;
  onValueChange?: (val: string) => void;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-11 items-center justify-start rounded-xl bg-muted/60 p-1 text-muted-foreground border border-border/60",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const childElem = child as React.ReactElement<{ value?: string; isSelected?: boolean; onSelect?: () => void }>;
          return React.cloneElement(childElem, {
            isSelected: childElem.props.value === currentValue,
            onSelect: () => onValueChange?.(childElem.props.value || ""),
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  isSelected,
  onSelect,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "bg-surface text-foreground shadow-subtle border border-border/70"
          : "hover:text-foreground hover:bg-surface/50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
  currentValue,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  currentValue?: string;
}) {
  if (value !== currentValue) return null;
  return <div className={cn("mt-4 animate-fade-in", className)}>{children}</div>;
}
