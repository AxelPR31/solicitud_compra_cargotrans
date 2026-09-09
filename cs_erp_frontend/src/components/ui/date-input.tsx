"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
}

export function parseToIsoDate(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3];
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function DateInput({
  value,
  onChange,
  className,
  placeholder = "dd/mm/aaaa",
}: DateInputProps) {
  const [text, setText] = React.useState(() => isoToDisplay(value));
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  const commitText = (raw: string) => {
    if (!raw.trim()) {
      onChange("");
      setText("");
      return;
    }

    const iso = parseToIsoDate(raw);
    if (iso === null) {
      setText(isoToDisplay(value));
      return;
    }

    onChange(iso);
    setText(isoToDisplay(iso));
  };

  const handleCalendarPick = (iso: string) => {
    onChange(iso);
    setText(isoToDisplay(iso));
    setOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={e => commitText(e.target.value)}
        onClick={() => setOpen(true)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitText(text);
          }
        }}
        placeholder={placeholder}
        className="h-9 cursor-text pr-9 text-sm"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-9 w-9 text-slate-500 hover:text-slate-700"
            aria-label="Abrir calendario"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="end">
          <p className="mb-2 text-xs font-medium text-slate-600">Seleccionar fecha</p>
          <input
            type="date"
            value={value || ""}
            onChange={e => handleCalendarPick(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
