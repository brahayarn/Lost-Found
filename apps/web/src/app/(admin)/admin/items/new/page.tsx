"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import {
  CreateItemSchema,
  type CreateItemDto,
  ItemCategory,
} from "@lf/shared";
import {
  createItem,
  uploadPhotos,
  type CreateItemResponse,
} from "@/lib/api";
import {
  ImageUpload,
  UploadingOverlay,
} from "@/components/admin/image-upload";
import { CATEGORY_OPTIONS } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const toIsoLocal = (d: Date) => {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
};

export default function NewItemPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const form = useForm<CreateItemDto>({
    resolver: zodResolver(CreateItemSchema),
    defaultValues: {
      title: "",
      description: "",
      category: ItemCategory.OTHER,
      foundLocation: { address: "" },
      foundAt: new Date().toISOString(),
      photoUrls: [],
      isValuable: false,
      serialNumber: "",
      hiddenMarks: "",
      color: "",
      brand: "",
      tags: [],
      internalNotes: "",
    },
  });
  const [tagsInput, setTagsInput] = useState("");

  const isValuable = form.watch("isValuable");

  const submit = async (dto: CreateItemDto) => {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20);
    dto = { ...dto, tags };
    let photoUrls: string[] = [];
    let blurredPhotoUrls: string[] = [];
    if (photos.length > 0) {
      try {
        setUploading(true);
        const res = await uploadPhotos(photos);
        photoUrls = res.urls;
        blurredPhotoUrls = res.blurredUrls;
      } catch (err) {
        setUploading(false);
        toast.error("Не вдалось завантажити фото", {
          description: err instanceof Error ? err.message : undefined,
        });
        return;
      } finally {
        setUploading(false);
      }
    }
    mutation.mutate({ ...dto, photoUrls, blurredPhotoUrls });
  };

  const mutation = useMutation<CreateItemResponse, Error, CreateItemDto>({
    mutationFn: createItem,
    onSuccess: (res) => {
      toast.success("Знахідку зареєстровано", {
        description: `${res.itemNumber} · код ${res.trackingCode}`,
      });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      router.push("/admin/items");
    },
    onError: (err) => {
      toast.error("Не вдалось зберегти", { description: err.message });
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/admin/items">
            <ArrowLeft className="mr-1 h-4 w-4" /> До списку
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          Реєстрація знахідки
        </h1>
        <p className="text-sm text-stone-500">
          Заповніть деталі речі, яку знайшли. Система автоматично згенерує
          tracking-код.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(submit)}
          className="space-y-5"
        >
          <Card>
            <CardHeader>
              <CardTitle>Опис речі</CardTitle>
              <CardDescription>
                Що це і чому виділяється серед інших.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Назва</FormLabel>
                    <FormControl>
                      <Input placeholder="Чорний рюкзак Nike" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Опис</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Великий рюкзак з ноутбуком всередині, на бічній кишені — нашивка."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Чим детальніше, тим точніший автоматичний матчинг.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Категорія</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Де і коли</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="foundLocation.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Місце знахідки</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="вул. Бандери 12, біля корпусу №3"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foundAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата і час</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={
                          field.value
                            ? toIsoLocal(new Date(field.value))
                            : ""
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(
                            v ? new Date(v).toISOString() : "",
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Додаткові ознаки</CardTitle>
              <CardDescription>
                Колір, бренд і теги допомагають точніше матчити заявки.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Колір</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="чорний"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Бренд</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nike"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormItem>
                <FormLabel>Теги</FormLabel>
                <FormControl>
                  <Input
                    placeholder="кожаний, дитячий, рожевий"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </FormControl>
                <FormDescription>
                  Через кому. До 20 тегів, кожен до 40 символів.
                </FormDescription>
              </FormItem>

              <FormField
                control={form.control}
                name="internalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Внутрішні нотатки</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Помітки лише для персоналу — не показуються публічно."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Бачать тільки оператори та адміни.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Фотографії</CardTitle>
              <CardDescription>
                До 5 зображень. Гостям показуємо розмиту версію — лише
                власник побачить чітке фото.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ImageUpload
                files={photos}
                onChange={setPhotos}
                disabled={uploading || mutation.isPending}
              />
              <UploadingOverlay visible={uploading} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Цінна річ</CardTitle>
                <CardDescription>
                  Активуйте, якщо потрібен серійний номер та приховані прикмети.
                </CardDescription>
              </div>
              <FormField
                control={form.control}
                name="isValuable"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardHeader>
            {isValuable && (
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Серійний номер</FormLabel>
                      <FormControl>
                        <Input placeholder="SN: ABC-123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hiddenMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Приховані прикмети</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="Гравіювання на внутрішній стороні, наклейка з ім'ям…"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Видно тільки оператору. Допомагає верифікувати власника.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/items">Скасувати</Link>
            </Button>
            <Button type="submit" disabled={uploading || mutation.isPending}>
              {uploading
                ? "Завантаження фото…"
                : mutation.isPending
                  ? "Збереження…"
                  : "Зареєструвати"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
