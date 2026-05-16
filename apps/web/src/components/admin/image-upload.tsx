"use client";

import { useState, useRef, useCallback } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  max?: number;
  disabled?: boolean;
}

const MAX_BYTES = 8 * 1024 * 1024;

export function ImageUpload({
  files,
  onChange,
  max = 5,
  disabled,
}: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const append = useCallback(
    (incoming: FileList | File[]) => {
      setError(null);
      const list = Array.from(incoming);
      const valid: File[] = [];
      for (const f of list) {
        if (!f.type.startsWith("image/")) {
          setError("Лише зображення (JPEG/PNG/WEBP)");
          continue;
        }
        if (f.size > MAX_BYTES) {
          setError(`Файл "${f.name}" більше 8 MB`);
          continue;
        }
        valid.push(f);
      }
      const next = [...files, ...valid].slice(0, max);
      onChange(next);
    },
    [files, max, onChange],
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled) return;
          if (e.dataTransfer.files?.length) append(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 bg-stone-50/60 px-6 py-10 text-center transition-colors",
          dragOver && "border-stone-900 bg-stone-100",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <ImagePlus className="h-7 w-7 text-stone-400" />
        <div className="text-sm text-stone-700">
          <span className="font-medium">Натисніть</span> або перетягніть файли
        </div>
        <p className="text-xs text-stone-500">
          До {max} зображень, кожне ≤ 8 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) append(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="text-xs font-medium text-red-600">{error}</p>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {files.map((f, i) => (
            <ImagePreview
              key={`${f.name}-${i}`}
              file={f}
              onRemove={() =>
                onChange(files.filter((_, idx) => idx !== i))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ImagePreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const url = URL.createObjectURL(file);
  return (
    <div className="group relative aspect-square overflow-hidden rounded-md border border-stone-200 bg-stone-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={file.name}
        className="h-full w-full object-cover"
        onLoad={() => URL.revokeObjectURL(url)}
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full bg-stone-900/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function UploadingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="flex items-center gap-2 rounded-md bg-stone-900/5 p-3 text-sm text-stone-700">
      <Loader2 className="h-4 w-4 animate-spin" />
      Завантажуємо фото…
    </div>
  );
}

// re-export Button to keep imports neat
export { Button };
