"use client";

import * as React from "react";
import { Search, X, Loader2, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableItem {
  id: string;
  name: string;
  extra?: string;
  code?: string;
  city?: string | null;
  state?: string | null;
  district?: string | null;
}

export interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onSelect: (item: SearchableItem) => void;
  onClear?: () => void;
  onSearch: (query: string) => Promise<SearchableItem[]>;
  disabled?: boolean;
  disabledMessage?: string;
  leftIcon?: React.ReactNode;
  emptyMessage?: string;
  customActionSlot?: React.ReactNode;
  className?: string;
  required?: boolean;
}

export function SearchableSelect({
  label,
  placeholder = "Search...",
  value = "",
  onSelect,
  onClear,
  onSearch,
  disabled = false,
  disabledMessage,
  leftIcon,
  emptyMessage = "No results found.",
  customActionSlot,
  className,
  required = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const [items, setItems] = React.useState<SearchableItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  // Sync internal input value when external value changes
  React.useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Reset displayed text to actual selected value if user didn't pick anything
        setInputValue(value || "");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [value]);

  // Debounced search trigger (instant on focus/open, 250ms on typing)
  React.useEffect(() => {
    if (!isOpen || disabled) return;

    setIsLoading(true);
    const isInitialOpen = (inputValue === value);
    const delay = isInitialOpen ? 0 : 250;

    const timer = setTimeout(async () => {
      try {
        const query = isInitialOpen ? "" : inputValue;
        const results = await onSearch(query);
        setItems(results);
        setHighlightedIndex(-1);
      } catch (err) {
        console.error("SearchableSelect search error:", err);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [inputValue, isOpen, disabled, value, onSearch]);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
  };

  const handleSelect = (item: SearchableItem) => {
    setInputValue(item.name);
    setIsOpen(false);
    onSelect(item);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue("");
    setItems([]);
    if (onClear) onClear();
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev < items.length - 1 ? prev + 1 : 0;
        scrollIntoView(next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : items.length - 1;
        scrollIntoView(next);
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && items[highlightedIndex]) {
        handleSelect(items[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setInputValue(value || "");
    }
  };

  const scrollIntoView = (index: number) => {
    if (listRef.current) {
      const element = listRef.current.children[index] as HTMLElement;
      if (element) {
        element.scrollIntoView({ block: "nearest" });
      }
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full text-left", className)}>
      {label && (
        <label className="text-xs font-semibold text-foreground mb-1.5 block">
          {label} {required && <span className="text-indigo-400">*</span>}
        </label>
      )}

      {/* Main Input Control Capsule */}
      <div
        className={cn(
          "relative flex items-center w-full rounded-xl border bg-surface px-3 py-2 text-sm transition-all",
          isOpen
            ? "border-indigo-400/60 ring-2 ring-indigo-400/20 bg-surface/90"
            : "border-border hover:border-border/80",
          disabled && "opacity-50 cursor-not-allowed bg-surface-muted/30"
        )}
        onClick={handleOpen}
      >
        {leftIcon ? (
          <div className="mr-2 text-muted-foreground shrink-0">{leftIcon}</div>
        ) : (
          <Search className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
        )}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={handleOpen}
          onKeyDown={handleKeyDown}
          placeholder={disabled && disabledMessage ? disabledMessage : placeholder}
          disabled={disabled}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:cursor-not-allowed"
          autoComplete="off"
        />

        {/* Status Indicators & Actions */}
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />}

          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180 text-foreground"
            )}
          />
        </div>
      </div>

      {/* Dropdown Results Overlay */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl border border-white/15 bg-[#0d1017] shadow-2xl backdrop-blur-2xl overflow-hidden animate-fade-in">
          <ul
            ref={listRef}
            className="max-h-60 sm:max-h-72 overflow-y-auto p-1.5 space-y-1 divide-y divide-white/[0.04]"
            role="listbox"
          >
            {items.length === 0 && !isLoading ? (
              <li className="py-6 px-4 text-center text-xs font-mono text-neutral-400">
                {emptyMessage}
              </li>
            ) : (
              items.map((item, index) => {
                const isSelected = item.name.toLowerCase() === value.toLowerCase();
                const isHighlighted = highlightedIndex === index;

                return (
                  <li
                    key={item.id || index}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer flex items-center justify-between gap-3 transition-colors",
                      isHighlighted
                        ? "bg-white/10 text-white"
                        : isSelected
                        ? "bg-indigo-500/20 text-indigo-200 font-medium"
                        : "text-neutral-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{item.name}</p>
                      {item.extra && (
                        <p className="text-[10px] font-mono text-neutral-400 truncate mt-0.5">
                          {item.extra}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                    )}
                  </li>
                );
              })
            )}
          </ul>

          {/* Custom Action Slot (e.g. Can't find college? Add College) */}
          {customActionSlot && (
            <div className="p-2.5 border-t border-white/[0.08] bg-[#090b10]">
              {customActionSlot}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
