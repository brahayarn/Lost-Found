"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { uk } from "date-fns/locale";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={uk}
      showOutsideDays
      className={cn("rdp-lf", className)}
      {...props}
    />
  );
}
