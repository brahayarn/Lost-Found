"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Save, Mail, MousePointerClick, Tag, Type } from "lucide-react";
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

interface Fields {
  subject: string;
  heading: string;
  body: string;
  ctaText: string;
  footer: string;
}

const TEMPLATE_META: Record<
  string,
  {
    title: string;
    audience: string;
    trigger: string;
  }
> = {
  "match-found": {
    title: "Знайдено можливий збіг",
    audience: "Заявнику (людині, що шукає річ)",
    trigger: "Коли система знаходить знахідку, схожу на заявку",
  },
  "retention-expired": {
    title: "Термін зберігання вичерпано",
    audience: "Персоналу",
    trigger: "Коли річ переходить у статус «До утилізації»",
  },
  "retention-warning": {
    title: "Термін зберігання спливає",
    audience: "Заявнику й персоналу",
    trigger: "За 7, 3, 1 день до автоматичної утилізації",
  },
  "subscription-match": {
    title: "Збіг за підпискою",
    audience: "Підписнику (гостю)",
    trigger: "Коли зʼявилась нова знахідка в категорії підписки",
  },
};

const VARIABLE_LABELS: Record<string, string> = {
  itemNumber: "Номер знахідки",
  itemTitle: "Назва знахідки",
  itemUrl: "Посилання на знахідку",
  category: "Категорія",
  score: "Точність збігу",
  daysLeft: "Днів залишилось",
};

const SAMPLE_VARS: Record<string, string> = {
  itemNumber: "LF-2026-00042",
  itemTitle: "Чорний рюкзак Wenger",
  itemUrl: "http://localhost:3001/items/sample",
  category: "Електроніка",
  score: "0.87",
  daysLeft: "3",
};

const MARKER_OPEN = "<!--LF:";
const MARKER_CLOSE = "-->";

function buildHtml(f: Fields): string {
  const bodyHtml = f.body
    .trim()
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 12px;color:#57534e;line-height:1.6;">${escapeHtml(
          p.trim(),
        ).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");

  const cta = f.ctaText.trim()
    ? `<p style="margin:24px 0;"><a href="{{itemUrl}}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:500;">${escapeHtml(
        f.ctaText.trim(),
      )}</a></p>`
    : "";

  const footer = f.footer.trim()
    ? `<p style="margin-top:24px;color:#a8a29e;font-size:12px;border-top:1px solid #e7e5e4;padding-top:16px;">${escapeHtml(
        f.footer.trim(),
      )}</p>`
    : "";

  return [
    `${MARKER_OPEN}LF-EMAIL${MARKER_CLOSE}`,
    `${MARKER_OPEN}HEADING:${encode(f.heading)}${MARKER_CLOSE}`,
    `${MARKER_OPEN}BODY:${encode(f.body)}${MARKER_CLOSE}`,
    `${MARKER_OPEN}CTA:${encode(f.ctaText)}${MARKER_CLOSE}`,
    `${MARKER_OPEN}FOOTER:${encode(f.footer)}${MARKER_CLOSE}`,
    `<div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#1c1917;padding:24px;">`,
    `<h2 style="font-size:22px;margin:0 0 16px;font-weight:600;">${escapeHtml(
      f.heading,
    )}</h2>`,
    bodyHtml,
    cta,
    footer,
    `</div>`,
  ].join("\n");
}

function buildText(f: Fields): string {
  const parts = [f.heading, f.body];
  if (f.ctaText) parts.push(`${f.ctaText}: {{itemUrl}}`);
  if (f.footer) parts.push(f.footer);
  return parts.filter(Boolean).join("\n\n");
}

function encode(s: string): string {
  return encodeURIComponent(s);
}
function decode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function parseHtml(html: string): Partial<Fields> | null {
  if (!html.includes(`${MARKER_OPEN}LF-EMAIL`)) return null;
  const out: Partial<Fields> = {};
  const keys: Array<keyof Fields> = ["heading", "body", "ctaText", "footer"];
  const markerKey: Record<string, keyof Fields> = {
    HEADING: "heading",
    BODY: "body",
    CTA: "ctaText",
    FOOTER: "footer",
  };
  for (const m of html.matchAll(/<!--LF:(HEADING|BODY|CTA|FOOTER):([^]*?)-->/g)) {
    const k = markerKey[m[1]];
    out[k] = decode(m[2]);
  }
  for (const k of keys) if (out[k] === undefined) out[k] = "";
  return out;
}

function defaultsFromHtml(template: NotificationTemplateApi): Fields {
  const parsed = parseHtml(template.html);
  if (parsed) {
    return {
      subject: template.subject,
      heading: parsed.heading ?? "",
      body: parsed.body ?? "",
      ctaText: parsed.ctaText ?? "",
      footer: parsed.footer ?? "",
    };
  }
  // Fallback: best-effort extraction from legacy HTML
  const headingMatch = template.html.match(/<h2[^>]*>([^<]+)<\/h2>/);
  const ctaMatch = template.html.match(/<a[^>]*>([^<]+)<\/a>/);
  const text = template.html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    subject: template.subject,
    heading: headingMatch?.[1]?.trim() ?? "",
    body: text,
    ctaText: ctaMatch?.[1]?.trim() ?? "",
    footer: "",
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderHandlebars(
  tpl: string,
  vars: Record<string, string>,
): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

function TemplateEditor({ template }: { template: NotificationTemplateApi }) {
  const qc = useQueryClient();
  const meta = TEMPLATE_META[template.key] ?? {
    title: template.key,
    audience: "",
    trigger: template.description,
  };

  const [fields, setFields] = useState<Fields>(() => defaultsFromHtml(template));
  const [initial, setInitial] = useState<Fields>(fields);

  useEffect(() => {
    const d = defaultsFromHtml(template);
    setFields(d);
    setInitial(d);
  }, [template]);

  const mutation = useMutation({
    mutationFn: () =>
      updateNotificationTemplate(template.key, {
        subject: fields.subject,
        html: buildHtml(fields),
        text: buildText(fields),
      }),
    onSuccess: () => {
      toast.success(`Шаблон «${meta.title}» збережено`);
      qc.invalidateQueries({ queryKey: ["notification-templates"] });
      setInitial(fields);
    },
    onError: (e) =>
      toast.error("Не вдалось зберегти", {
        description: e instanceof Error ? e.message : undefined,
      }),
  });

  const previewSubject = useMemo(
    () => renderHandlebars(fields.subject, SAMPLE_VARS),
    [fields.subject],
  );
  const previewHtml = useMemo(
    () => renderHandlebars(buildHtml(fields), SAMPLE_VARS),
    [fields],
  );

  const dirty =
    fields.subject !== initial.subject ||
    fields.heading !== initial.heading ||
    fields.body !== initial.body ||
    fields.ctaText !== initial.ctaText ||
    fields.footer !== initial.footer;

  const setF = <K extends keyof Fields>(k: K, v: Fields[K]) =>
    setFields((s) => ({ ...s, [k]: v }));

  return (
    <Card>
      <CardHeader className="border-b border-stone-100">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-stone-100">
              <Mail className="h-4 w-4 text-stone-700" />
            </div>
            <div>
              <CardTitle className="text-base">{meta.title}</CardTitle>
              <CardDescription className="text-xs">
                <span className="font-mono text-stone-400">{template.key}</span>
              </CardDescription>
            </div>
          </div>
        </div>
        <div className="mt-3 grid gap-2 rounded-md bg-stone-50 p-3 text-xs sm:grid-cols-2">
          <div>
            <span className="text-stone-500">Кому: </span>
            <span className="text-stone-800">{meta.audience}</span>
          </div>
          <div>
            <span className="text-stone-500">Коли: </span>
            <span className="text-stone-800">{meta.trigger}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <Field
              icon={<Type className="h-3.5 w-3.5" />}
              label="Тема листа"
              hint="Те, що людина побачить у списку у поштовій скриньці"
            >
              <Input
                value={fields.subject}
                onChange={(e) => setF("subject", e.target.value)}
              />
            </Field>

            <Field label="Заголовок усередині листа">
              <Input
                value={fields.heading}
                onChange={(e) => setF("heading", e.target.value)}
              />
            </Field>

            <Field
              label="Текст листа"
              hint="Пишіть звичайним текстом. Порожній рядок між абзацами = новий абзац."
            >
              <Textarea
                rows={6}
                value={fields.body}
                onChange={(e) => setF("body", e.target.value)}
              />
            </Field>

            <Field
              icon={<MousePointerClick className="h-3.5 w-3.5" />}
              label="Текст на кнопці"
              hint="Кнопка веде на сторінку знахідки. Залиште порожнім — кнопки не буде."
            >
              <Input
                value={fields.ctaText}
                onChange={(e) => setF("ctaText", e.target.value)}
                placeholder="Подивитись знахідку"
              />
            </Field>

            <Field
              label="Підпис унизу"
              hint="Дрібний сірий текст внизу листа. Опційно."
            >
              <Input
                value={fields.footer}
                onChange={(e) => setF("footer", e.target.value)}
                placeholder="Якщо це не ваша річ — проігноруйте лист"
              />
            </Field>

            {template.variables.length > 0 && (
              <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-stone-700">
                  <Tag className="h-3.5 w-3.5" />
                  Доступні підстановки
                </div>
                <p className="mb-2 text-xs text-stone-500">
                  Вставляйте у поля як <code className="rounded bg-white px-1">{`{{name}}`}</code>
                  {" "}— при відправці підставиться реальне значення.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {template.variables.map((v) => (
                    <code
                      key={v}
                      className="rounded bg-white px-2 py-0.5 text-xs text-stone-700 ring-1 ring-stone-200"
                      title={VARIABLE_LABELS[v] ?? v}
                    >
                      {`{{${v}}}`}
                      {VARIABLE_LABELS[v] && (
                        <span className="ml-1 text-stone-400">
                          — {VARIABLE_LABELS[v]}
                        </span>
                      )}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
              Як виглядатиме лист
            </p>
            <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
              <div className="border-b border-stone-100 bg-stone-50 px-4 py-2.5">
                <p className="text-xs text-stone-500">Тема</p>
                <p className="text-sm font-medium text-stone-900">
                  {previewSubject}
                </p>
              </div>
              <div
                className="text-sm"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
            <p className="mt-2 text-xs text-stone-400">
              Превʼю зі зразковими даними ({SAMPLE_VARS.itemNumber}, score {SAMPLE_VARS.score} тощо)
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-stone-100 pt-4">
          <Button
            size="sm"
            disabled={!dirty || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <Save className="mr-2 h-4 w-4" />
            {mutation.isPending
              ? "Зберігаємо…"
              : dirty
                ? "Зберегти зміни"
                : "Збережено"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  hint,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-stone-700">
        {icon}
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
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
          Шаблони листів
        </h1>
        <p className="text-sm text-stone-500">
          Тут редагуються автоматичні листи, що йдуть на email. Заповніть поля
          звичайним текстом — система сама збере оформлений email і підставить
          номери знахідок, посилання та інші дані.
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
