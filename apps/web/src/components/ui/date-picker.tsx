"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { uk, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: Date | undefined;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
  clearable?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Оберіть дату",
  disabled,
  className,
  clearable = false,
}: DatePickerProps) {
  const locale = useLocale();
  const dateFnsLocale = locale === "uk" ? uk : enUS;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-stone-300 bg-white px-3 py-1 text-left text-sm shadow-sm transition hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-400",
            !value && "text-stone-400",
            className,
          )}
        >
          <span className="truncate">
            {value
              ? format(value, "d MMM yyyy", { locale: dateFnsLocale })
              : placeholder}
          </span>
          <span className="ml-2 flex items-center gap-1">
            {clearable && value && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange?.(undefined);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange?.(undefined);
                  }
                }}
                className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                aria-label="Очистити"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <CalendarIcon className="h-4 w-4 opacity-60" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => onChange?.(d ?? undefined)}
          disabled={disabled}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
