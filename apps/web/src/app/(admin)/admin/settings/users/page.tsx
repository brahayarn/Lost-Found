"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { UserRole, type IUser } from "@lf/shared";
import {
  listUsers,
  createUser,
  updateUserRole,
  deleteUser,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.nativeEnum(UserRole),
});
type CreateForm = z.infer<typeof CreateSchema>;

const ROLE_OPTIONS = [
  { value: UserRole.OPERATOR, label: "Оператор" },
  { value: UserRole.MANAGER, label: "Керівник" },
  { value: UserRole.ADMIN, label: "Адмін" },
];

export default function UsersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  const form = useForm<CreateForm>({
    resolver: zodResolver(CreateSchema),
    defaultValues: { role: UserRole.OPERATOR, name: "", email: "", password: "" },
  });

  const create = useMutation({
    mutationFn: createUser,
    onSuccess: (u) => {
      toast.success(`Користувача створено: ${u.email}`);
      qc.invalidateQueries({ queryKey: ["users"] });
      form.reset();
      setShowForm(false);
    },
    onError: (err: Error) =>
      toast.error("Не вдалось створити", { description: err.message }),
  });

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      updateUserRole(id, role),
    onSuccess: () => {
      toast.success("Роль оновлено");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) =>
      toast.error("Помилка", { description: err.message }),
  });

  const remove = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success("Користувача видалено");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) =>
      toast.error("Не вдалось видалити", { description: err.message }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Користувачі
          </h1>
          <p className="text-sm text-stone-500">
            Керування персоналом та ролями.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <UserPlus className="mr-2 h-4 w-4" />
          {showForm ? "Сховати форму" : "Додати користувача"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Новий користувач</CardTitle>
            <CardDescription>
              Користувач зможе одразу залогінитись з вказаним паролем.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((dto) => create.mutate(dto))}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Імʼя</FormLabel>
                      <FormControl>
                        <Input placeholder="Іван Петренко" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="ivan@lf.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пароль</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="мін. 6 символів"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Роль</FormLabel>
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
                          {ROLE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending ? "Створення…" : "Створити"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Імʼя</TH>
                  <TH>Email</TH>
                  <TH>Роль</TH>
                  <TH className="w-[1%]"></TH>
                </TR>
              </THead>
              <TBody>
                {users?.map((u: IUser) => (
                  <TR key={u.id}>
                    <TD className="font-medium">{u.name}</TD>
                    <TD className="text-stone-600">{u.email}</TD>
                    <TD>
                      <Select
                        value={u.role}
                        onValueChange={(role) =>
                          setRole.mutate({ id: u.id, role: role as UserRole })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TD>
                    <TD>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Видалити ${u.email}?`)) {
                            remove.mutate(u.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TD>
                  </TR>
                ))}
                {users?.length === 0 && (
                  <TR>
                    <TD colSpan={4} className="py-8 text-center text-sm text-stone-500">
                      <Badge tone="slate">Немає користувачів</Badge>
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
