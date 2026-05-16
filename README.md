# Lost & Found Platform

Веб-орієнтована система для організацій (аеропорти, готелі, університети, ТЦ),
що автоматизує процес реєстрації знайдених речей, пошуку власників і повернення.

## Стек

| Шар | Технології |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form, Zod, next-intl (uk/en) |
| Backend | NestJS 10, Mongoose, Passport-JWT, BullMQ, Handlebars, Sharp, PDFKit, ExcelJS, @nestjs/throttler, @nestjs/schedule |
| База даних | MongoDB Atlas (text-індекси, атомарні лічильники) |
| Черги | Redis + BullMQ |
| Email | Resend (з fallback на dev-лог) |
| Monorepo | pnpm workspaces + Turborepo, спільний пакет `@lf/shared` |

## Швидкий старт

```bash
# 1. Залежності
pnpm install

# 2. Підняти Redis (Mongo беремо з Atlas)
docker compose up -d redis

# 3. (Опційно) наповнити демо-даними
pnpm --filter @lf/api seed

# 4. Запуск
pnpm dev
```

- API → http://localhost:3000
- Swagger UI → http://localhost:3000/api/docs
- Web → http://localhost:3001

## Тестові облікові записи

Створюються автоматично при першому старті API:

| Email | Пароль | Роль |
|---|---|---|
| `admin@lf.com` | `password123` | ADMIN |

Після `pnpm --filter @lf/api seed` також з'являться:

| Email | Пароль | Роль |
|---|---|---|
| `operator@lf.com` | `password123` | OPERATOR |
| `manager@lf.com` | `password123` | MANAGER |

## Конфігурація (`.env`)

```env
MONGO_URI=mongodb+srv://...
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
WEB_ORIGIN=http://localhost:3001
JWT_SECRET=...
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=30d

# Email
RESEND_API_KEY=re_...
MAIL_FROM=Lost & Found <onboarding@resend.dev>
STAFF_EMAILS=admin@example.com
```

Без `RESEND_API_KEY` `EmailService` працює у dev-режимі — листи логуються в консоль.

## Структура

```
apps/
├── api/          # NestJS REST API
└── web/          # Next.js фронт
packages/
└── shared/       # Спільні Zod-схеми та TS-типи
```

## Реалізовані фічі

### Базові (MVP)
- ✅ Реєстрація знахідок з 10+ полями (категорія, локація, фото, колір, бренд, теги)
- ✅ Автоматичний `trackingCode LF-YYYY-NNNNN`
- ✅ PDF-етикетка 60×40 мм з QR-кодом
- ✅ Завантаження фото з server-side blur (Sharp) для публічного каталогу
- ✅ Публічний пошук без реєстрації + повнотекстовий по описам
- ✅ Подача заявок гостями без авторизації
- ✅ JWT auth з ролями (ADMIN, OPERATOR, MANAGER), seed-адмін
- ✅ Аналітика: дашборд + графіки (Recharts) + топ-локацій + категорії
- ✅ CSV та XLSX експорт

### Автоматизація
- ✅ BullMQ авто-матчинг знахідок ↔ заявок з text-score
- ✅ Refresh tokens (15м access / 30д refresh) з ротацією і захистом від reuse
- ✅ Cron retention sweep (`@Cron EVERY_DAY_AT_3AM`): попередження за 7/3/1 день, авто-перехід у `TO_DISPOSE`
- ✅ Налаштовувані терміни зберігання за категоріями (адмінка)
- ✅ Статус `VERIFICATION` для цінних речей + форма верифікації з нотатками
- ✅ Підтвердження особи заявника (`identityConfirmed`)
- ✅ Цифрові акти видачі з canvas-підписом, незмінні
- ✅ Архів повернень з фільтром по даті
- ✅ Email-сповіщення (match-found, retention-warning, subscription-match) через Resend
- ✅ Редаговані Handlebars-шаблони листів з preview
- ✅ Підписки гостей на сповіщення про нові надходження
- ✅ Журнал аудиту (IP, UA, payload) — глобальний interceptor, append-only
- ✅ Rate limiter (100/хв публ, 1000/хв auth) через `@nestjs/throttler`
- ✅ i18n uk/en через next-intl з cookie-based перемикачем

## Корисні команди

```bash
pnpm dev                                  # запуск web+api у watch
pnpm --filter @lf/api dev                 # тільки бекенд
pnpm --filter @lf/web dev                 # тільки фронт
pnpm --filter @lf/api seed                # засіяти демо-дані
pnpm --filter @lf/api seed -- --reset     # очистити та засіяти заново
pnpm --filter @lf/api build               # production-build API
pnpm --filter @lf/web build               # production-build web
docker compose up -d redis                # підняти Redis локально
docker compose down                       # зупинити
```

## Архітектура

```
[Browser]
    │
    │  Next.js (RSC + Client) → axios → /api/v1/*
    ▼
[NestJS API]  ───┐
    │            ├── Mongoose ──→  MongoDB Atlas (items, claims, matches,
    │            │                  retention_policies, handover_acts,
    │            │                  audit_logs, notification_templates,
    │            │                  subscriptions, refresh_tokens, users)
    │            │
    │            ├── BullMQ ──→ Redis  → Workers (matching, notifications)
    │            │                          │
    │            │                          ├──→ Resend (email)
    │            │                          └──→ Handlebars-renderer
    │            │
    │            └── @nestjs/schedule  → Cron retention sweep
    │
    └── Sharp / Multer (uploads, blur)
    └── PDFKit (QR-етикетки)
    └── ExcelJS (XLSX експорт)
```

## Endpoint-карта

| Категорія | Маршрути |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Items | `POST/GET /items`, `/items/admin`, `/items/:id`, `/items/:id/full`, `/items/:id/verify`, `/items/:id/handover`, `/items/:id/label`, `/items/dispose`, `/items/export.csv`, `/items/export.xlsx` |
| Claims | `POST/GET /claims`, `GET/PATCH /claims/:id`, `POST /claims/:id/confirm-identity` |
| Matches | `GET /matches`, `GET /matches/:id`, `POST /matches/:id/confirm`, `POST /matches/:id/reject` |
| Analytics | `/analytics/{summary,daily,locations,categories}` |
| Settings | `/users`, `/retention-policies`, `/notification-templates`, `/subscriptions`, `/audit-logs` |
| Demo | `POST /retention/sweep`, `POST /retention/test-email` |
| Uploads | `POST /uploads` (multipart, повертає оригінал + blur) |

## Курсова

Платформа реалізована як курсова робота за технічним завданням,
що описує систему обліку знайдених речей для організацій з потоком
до 2000 знахідок на місяць.
