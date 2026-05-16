"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, Save } from "lucide-react";
import {
  listNotificationTemplates,
  updateNotificationTemplate,
  type NotificationTemplateApi,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Draft {
  subject: string;
  html: string;
  text: string;
}

function renderHandlebars(
  tpl: string,
  vars: Record<string, string>,
): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

function TemplateEditor({ template }: { template: NotificationTemplateApi }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft>({
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setDraft({
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }, [template]);

  const mutation = useMutation({
    mutationFn: () =>
      updateNotificationTemplate(template.key, draft),
    onSuccess: () => {
      toast.success(`${template.key} оновлено`);
      qc.invalidateQueries({ queryKey: ["notification-templates"] });
    },
    onError: (e) =>
      toast.error("Не вдалось зберегти", {
        description: e instanceof Error ? e.message : undefined,
      }),
  });

  // Sample values for preview
  const sampleVars: Record<string, string> = {
    itemNumber: "LF-2026-00042",
    score: "0.87",
    itemUrl: "http://localhost:3001/items/sample",
    daysLeft: "3",
  };
  const previewSubject = renderHandlebars(draft.subject, sampleVars);
  const previewHtml = renderHandlebars(draft.html, sampleVars);

  const dirty =
    draft.subject !== template.subject ||
    draft.html !== template.html ||
    draft.text !== template.text;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-mono text-base">{template.key}</CardTitle>
            <CardDescription>{template.description}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-1">
            {template.variables.map((v) => (
              <code
                key={v}
                className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-700"
              >
                {`{{${v}}}`}
              </code>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-stone-500">
            Subject
          </label>
          <Input
            value={draft.subject}
            onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-stone-500">
            HTML
          </label>
          <Textarea
            rows={8}
            className="font-mono text-xs"
            value={draft.html}
            onChange={(e) => setDraft((d) => ({ ...d, html: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-stone-500">
            Plain text fallback
          </label>
          <Textarea
            rows={3}
            className="font-mono text-xs"
            value={draft.text}
            onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
          />
        </div>

        {showPreview && (
          <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-stone-500">
              Попередній перегляд (sample values)
            </p>
            <p className="mb-2 font-medium text-stone-800">{previewSubject}</p>
            <div
              className="rounded-md bg-white p-3 text-sm"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview((p) => !p)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? "Сховати" : "Preview"}
          </Button>
          <Button
            size="sm"
            disabled={!dirty || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <Save className="mr-2 h-4 w-4" />
            {mutation.isPending ? "Зберігаємо…" : "Зберегти"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NotificationTemplatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: listNotificationTemplates,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Шаблони сповіщень
        </h1>
        <p className="text-sm text-stone-500">
          Редагуй subject + HTML листів. Підстановки —{" "}
          <code className="rounded bg-stone-100 px-1">{`{{variable}}`}</code>{" "}
          (Handlebars).
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <div className="space-y-5">
          {data?.map((t) => <TemplateEditor key={t._id} template={t} />)}
        </div>
      )}
    </div>
  );
}
