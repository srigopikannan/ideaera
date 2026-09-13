"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export const Select = ({
  children,
  value,
  defaultValue,
  onValueChange,
  disabled,
}: SelectProps) => {
  return (
    <div
      className={cn("relative", disabled && "pointer-events-none opacity-50")}
      data-value={value ?? defaultValue}
      data-disabled={disabled ? "true" : undefined}
      onChange={(event) => {
        const target = event.target as unknown as  HTMLSelectElement;
        onValueChange?.(target.value);
      }}
    >
      {children}
    </div>
  );
};

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value?: string;
    placeholder?: string;
    onValueChange?: (v: string) => void;
  }
>(({ className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});

SelectTrigger.displayName = "SelectTrigger";

export const SelectValue = ({
  placeholder,
  value,
}: {
  placeholder?: string;
  value?: string;
}) => {
  return (
    <span className="text-sm">
      {value || (
        <span className="text-muted-foreground">{placeholder}</span>
      )}
    </span>
  );
};

export const SelectContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
};

export const SelectItem = ({
  value,
  children,
  onSelect,
  disabled,
}: {
  value: string;
  children: React.ReactNode;
  onSelect?: (v: string) => void;
  disabled?: boolean;
}) => {
  return (
    <div
      role="option"
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onSelect?.(value);
        }
      }}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      {children}
    </div>
  );
};