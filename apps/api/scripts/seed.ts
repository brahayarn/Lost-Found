/**
 * Seed-скрипт для демо-даних Lost & Found Platform.
 *
 * Запуск: pnpm --filter @lf/api seed
 * Очистка + наповнення: pnpm --filter @lf/api seed -- --reset
 *
 * Створює: користувачів (OPERATOR, MANAGER), знахідки у різних статусах,
 * заявки (частина з матчами), match-proposals, акти видачі,
 * підписки, налаштування retention policies.
 */
import * as path from "path";
import * as dotenv from "dotenv";
import * as bcrypt from "bcrypt";
import mongoose, { Schema, Types } from "mongoose";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI не задано. Перевір .env");
  process.exit(1);
}

const RESET = process.argv.includes("--reset");

// Локальне визначення enum-ів (дублюємо щоб не тягнути @lf/shared у raw-скрипт)
const ItemStatus = {
  NEW: "NEW",
  VERIFICATION: "VERIFICATION",
  PUBLISHED: "PUBLISHED",
  MATCHED: "MATCHED",
  CLAIMED: "CLAIMED",
  RETURNED: "RETURNED",
  TO_DISPOSE: "TO_DISPOSE",
  ARCHIVED: "ARCHIVED",
} as const;
const ItemCategory = {
  ELECTRONICS: "ELECTRONICS",
  DOCUMENTS: "DOCUMENTS",
  KEYS: "KEYS",
  BAG: "BAG",
  CLOTHING: "CLOTHING",
  JEWELRY: "JEWELRY",
  OTHER: "OTHER",
} as const;
const ClaimStatus = {
  NEW: "NEW",
  PROCESSING: "PROCESSING",
  MATCHED: "MATCHED",
  READY_FOR_HANDOVER: "READY_FOR_HANDOVER",
  CLOSED: "CLOSED",
  REJECTED: "REJECTED",
} as const;

// Loose Mongoose схеми лише для запису
const itemSchema = new Schema({}, { strict: false, timestamps: true, collection: "items" });
const claimSchema = new Schema({}, { strict: false, timestamps: true, collection: "claims" });
const userSchema = new Schema({}, { strict: false, timestamps: true, collection: "users" });
const counterSchema = new Schema({}, { strict: false, collection: "counters" });
const proposalSchema = new Schema({}, { strict: false, timestamps: true, collection: "match_proposals" });
const handoverSchema = new Schema({}, { strict: false, timestamps: true, collection: "handover_acts" });
const subscriptionSchema = new Schema({}, { strict: false, timestamps: true, collection: "subscriptions" });
const retentionPolicySchema = new Schema({}, { strict: false, timestamps: true, collection: "retention_policies" });

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
function code(year: number, n: number): string {
  return `LF-${year}-${String(n).padStart(5, "0")}`;
}
function claimCode(year: number, n: number): string {
  return `CL-${year}-${String(n).padStart(5, "0")}`;
}

async function main() {
  console.log("→ Підключення до MongoDB…");
  await mongoose.connect(MONGO_URI!);

  const Item = mongoose.model("Item", itemSchema);
  const Claim = mongoose.model("Claim", claimSchema);
  const User = mongoose.model("User", userSchema);
  const Counter = mongoose.model("Counter", counterSchema);
  const MatchProposal = mongoose.model("MatchProposal", proposalSchema);
  const HandoverAct = mongoose.model("HandoverAct", handoverSchema);
  const Subscription = mongoose.model("Subscription", subscriptionSchema);
  const RetentionPolicy = mongoose.model("RetentionPolicy", retentionPolicySchema);

  if (RESET) {
    console.log("→ Очистка демо-даних (--reset)…");
    await Promise.all([
      Item.deleteMany({}),
      Claim.deleteMany({}),
      MatchProposal.deleteMany({}),
      HandoverAct.deleteMany({}),
      Subscription.deleteMany({}),
      Counter.deleteMany({}),
      // users: лишаємо лише seed admin
      User.deleteMany({
        email: { $nin: ["admin@lf.com"] },
      }),
    ]);
  }

  const existingItems = await Item.countDocuments();
  if (existingItems >= 10 && !RESET) {
    console.log(
      `→ Вже є ${existingItems} знахідок. Пропускаю. Запусти з --reset щоб переробити.`,
    );
    await mongoose.disconnect();
    return;
  }

  const year = new Date().getFullYear();

  console.log("→ Користувачі…");
  const passwordHash = await bcrypt.hash("password123", 10);
  await User.updateOne(
    { email: "operator@lf.com" },
    {
      $setOnInsert: {
        email: "operator@lf.com",
        passwordHash,
        name: "Оператор Тестовий",
        role: "OPERATOR",
      },
    },
    { upsert: true },
  );
  await User.updateOne(
    { email: "manager@lf.com" },
    {
      $setOnInsert: {
        email: "manager@lf.com",
        passwordHash,
        name: "Керівник Тестовий",
        role: "MANAGER",
      },
    },
    { upsert: true },
  );

  console.log("→ Retention policies…");
  const policies = [
    { category: ItemCategory.DOCUMENTS, days: 30 },
    { category: ItemCategory.ELECTRONICS, days: 120 },
    { category: ItemCategory.KEYS, days: 60 },
    { category: ItemCategory.BAG, days: 90 },
    { category: ItemCategory.CLOTHING, days: 60 },
    { category: ItemCategory.JEWELRY, days: 180 },
    { category: ItemCategory.OTHER, days: 90 },
  ];
  for (const p of policies) {
    await RetentionPolicy.updateOne(
      { category: p.category },
      { $setOnInsert: p },
      { upsert: true },
    );
  }

  // Реалістичні знахідки
  console.log("→ Знахідки…");
  const itemSeeds = [
    {
      seq: 1,
      title: "Чорний шкіряний гаманець",
      description: "Знайдено біля виходу №3. Всередині є кілька карток і скляночка.",
      category: ItemCategory.DOCUMENTS,
      status: ItemStatus.PUBLISHED,
      address: "Аеропорт, термінал A, вихід №3",
      foundAt: daysAgo(2),
      retentionDays: 30,
      color: "чорний",
      brand: "Wallet",
      tags: ["шкіра", "гаманець"],
      isValuable: true,
    },
    {
      seq: 2,
      title: "iPhone 13 Pro срібний",
      description: "Айфон у срібному корпусі, екран без подряпин, без чохла.",
      category: ItemCategory.ELECTRONICS,
      status: ItemStatus.VERIFICATION,
      address: "Конференц-зал «Карпати»",
      foundAt: daysAgo(1),
      retentionDays: 120,
      color: "срібний",
      brand: "Apple",
      tags: ["смартфон", "iphone"],
      isValuable: true,
      serialNumber: "F2L8Z9XYRY",
      hiddenMarks: "Маленька подряпина на верхньому лівому куті задньої кришки",
    },
    {
      seq: 3,
      title: "Зв’язка ключів з брелком Renault",
      description: "5 ключів на металевому кільці + ключ від машини Renault.",
      category: ItemCategory.KEYS,
      status: ItemStatus.PUBLISHED,
      address: "Паркінг P-2, рівень 1",
      foundAt: daysAgo(5),
      retentionDays: 60,
      tags: ["renault", "ключі", "брелок"],
    },
    {
      seq: 4,
      title: "Червоний рюкзак Wenger",
      description: "Невеликий рюкзак, в кишені — записник і ручка.",
      category: ItemCategory.BAG,
      status: ItemStatus.PUBLISHED,
      address: "Корпус №1, аудиторія 305",
      foundAt: daysAgo(7),
      retentionDays: 90,
      color: "червоний",
      brand: "Wenger",
      tags: ["рюкзак"],
    },
    {
      seq: 5,
      title: "Сонячні окуляри Ray-Ban Wayfarer",
      description: "Класичні чорні окуляри, без футляра. Стан гарний.",
      category: ItemCategory.OTHER,
      status: ItemStatus.PUBLISHED,
      address: "Кафе на 2-му поверсі",
      foundAt: daysAgo(3),
      retentionDays: 90,
      color: "чорний",
      brand: "Ray-Ban",
      tags: ["окуляри"],
    },
    {
      seq: 6,
      title: "Золота сережка з перлиною",
      description: "Одна сережка, золото 585°, біла перлина.",
      category: ItemCategory.JEWELRY,
      status: ItemStatus.VERIFICATION,
      address: "Готель «Опера», номер 412",
      foundAt: daysAgo(4),
      retentionDays: 180,
      color: "золотий",
      tags: ["перлина", "золото"],
      isValuable: true,
      hiddenMarks: "Невелика подряпина на верхньому кріпленні",
    },
    {
      seq: 7,
      title: "Дитяча шапка з помпоном",
      description: "В'язана шапка синього кольору, розмір ~4-6 років.",
      category: ItemCategory.CLOTHING,
      status: ItemStatus.PUBLISHED,
      address: "Дитячий майданчик біля корпусу №2",
      foundAt: daysAgo(10),
      retentionDays: 60,
      color: "синій",
      tags: ["дитяче", "шапка"],
    },
    {
      seq: 8,
      title: "Парасолька великa чорна",
      description: "Складна парасолька на 8 спиць, ручка трохи потерта.",
      category: ItemCategory.OTHER,
      status: ItemStatus.PUBLISHED,
      address: "Гардероб, термінал B",
      foundAt: daysAgo(6),
      retentionDays: 90,
      color: "чорний",
      tags: ["парасолька"],
    },
    {
      seq: 9,
      title: "MacBook Air 13 (2022)",
      description: "Сірий MacBook Air M2, стикер на задній панелі.",
      category: ItemCategory.ELECTRONICS,
      status: ItemStatus.MATCHED,
      address: "Конференц-зал «Дніпро»",
      foundAt: daysAgo(8),
      retentionDays: 120,
      color: "сірий",
      brand: "Apple",
      tags: ["ноутбук", "macbook"],
      isValuable: true,
      serialNumber: "C02G123XQ6L7",
      hiddenMarks: "Стикер «Hack the planet» біля логотипа",
    },
    {
      seq: 10,
      title: "Студентський квиток, А. Іванов",
      description: "Студентський УжНУ, ФМО, 3 курс.",
      category: ItemCategory.DOCUMENTS,
      status: ItemStatus.CLAIMED,
      address: "Корпус №3, 1-й поверх, біля деканату",
      foundAt: daysAgo(2),
      retentionDays: 30,
      tags: ["студентський", "документи"],
    },
    {
      seq: 11,
      title: "Сумочка cross-body коричнева",
      description: "Маленька коричнева сумочка через плече, всередині косметика.",
      category: ItemCategory.BAG,
      status: ItemStatus.RETURNED,
      address: "Тренажерний зал",
      foundAt: daysAgo(25),
      retentionDays: 90,
      color: "коричневий",
      tags: ["сумка"],
    },
    {
      seq: 12,
      title: "Чорний шарф Burberry",
      description: "Кашеміровий шарф у класичну клітинку Burberry.",
      category: ItemCategory.CLOTHING,
      status: ItemStatus.RETURNED,
      address: "Готель «Опера», ресторан",
      foundAt: daysAgo(15),
      retentionDays: 60,
      color: "чорний",
      brand: "Burberry",
      tags: ["шарф", "кашемір"],
    },
    {
      seq: 13,
      title: "Велосипедний шолом Bell",
      description: "Чорний шолом, розмір M, підкладка в гарному стані.",
      category: ItemCategory.OTHER,
      status: ItemStatus.RETURNED,
      address: "Велопаркінг, корпус №1",
      foundAt: daysAgo(40),
      retentionDays: 90,
      color: "чорний",
      brand: "Bell",
      tags: ["шолом", "велосипед"],
    },
    {
      seq: 14,
      title: "Ноутбук Lenovo ThinkPad чорний",
      description: "Старіший ThinkPad, без зарядки. Робочий.",
      category: ItemCategory.ELECTRONICS,
      status: ItemStatus.TO_DISPOSE,
      address: "Конференц-зал «Карпати»",
      foundAt: daysAgo(125),
      retentionDays: 120,
      color: "чорний",
      brand: "Lenovo",
      tags: ["ноутбук", "thinkpad"],
      isValuable: true,
      // вже минув термін
      retentionDateOverride: daysAgo(2),
    },
    {
      seq: 15,
      title: "Старі ключі без брелка",
      description: "3 ключі, металеве кільце, без позначок.",
      category: ItemCategory.KEYS,
      status: ItemStatus.ARCHIVED,
      address: "Гардероб, термінал A",
      foundAt: daysAgo(120),
      retentionDays: 60,
      tags: ["ключі"],
    },
    {
      seq: 16,
      title: "Зошит з лекцій з математичного аналізу",
      description: "Загальний зошит, на обкладинці написано «Михайло К.»",
      category: ItemCategory.OTHER,
      status: ItemStatus.PUBLISHED,
      address: "Бібліотека, 3-й поверх",
      foundAt: daysAgo(1),
      retentionDays: 90,
      tags: ["зошит", "матаналіз"],
    },
    {
      seq: 17,
      title: "Окуляри для зору в чорній оправі",
      description: "Окуляри з товстою чорною оправою, без футляра.",
      category: ItemCategory.OTHER,
      status: ItemStatus.PUBLISHED,
      address: "Кафе на 2-му поверсі",
      foundAt: daysAgo(9),
      retentionDays: 90,
      color: "чорний",
      tags: ["окуляри", "зір"],
    },
    {
      seq: 18,
      title: "Дитячий рюкзак з єдинорогом",
      description: "Маленький рожевий рюкзак з принтом єдинорога, всередині кольорові олівці.",
      category: ItemCategory.BAG,
      status: ItemStatus.PUBLISHED,
      address: "Дитячий майданчик біля корпусу №2",
      foundAt: daysAgo(4),
      retentionDays: 90,
      color: "рожевий",
      tags: ["дитяче", "рюкзак", "єдиноріг"],
    },
  ];

  const itemIdsByTracking = new Map<string, Types.ObjectId>();

  for (const s of itemSeeds) {
    const trackingCode = code(year, s.seq);
    const itemNumber = trackingCode;
    const retentionDate =
      (s as any).retentionDateOverride ??
      new Date(
        new Date(s.foundAt).getTime() + s.retentionDays * 86_400_000,
      );

    const doc = {
      itemNumber,
      trackingCode,
      title: s.title,
      description: s.description,
      category: s.category,
      status: s.status,
      foundLocation: { address: s.address },
      foundAt: s.foundAt,
      photoUrls: [],
      blurredPhotoUrls: [],
      isValuable: s.isValuable ?? false,
      serialNumber: (s as any).serialNumber,
      hiddenMarks: (s as any).hiddenMarks,
      color: s.color,
      brand: s.brand,
      tags: s.tags ?? [],
      retentionDate,
    };

    const created = await Item.findOneAndUpdate(
      { trackingCode },
      { $setOnInsert: doc },
      { upsert: true, new: true },
    );
    itemIdsByTracking.set(trackingCode, created._id as Types.ObjectId);
  }

  // Counter для items:YEAR — встановимо в максимум
  await Counter.updateOne(
    { _id: `items:${year}` },
    { $set: { seq: itemSeeds.length } },
    { upsert: true },
  );

  console.log("→ Заявки…");
  const claimSeeds = [
    {
      seq: 1,
      claimerEmail: "oksana.shev@example.com",
      description: "Загубила гаманець з документами в аеропорту коло терміналу A.",
      category: ItemCategory.DOCUMENTS,
      address: "Аеропорт, термінал A",
      lostAt: daysAgo(3),
      status: ClaimStatus.MATCHED,
      identityConfirmed: false,
      matchToItem: 1,
    },
    {
      seq: 2,
      claimerEmail: "ivan.koval@example.com",
      description: "Шукаю MacBook Air сірий, з наклейкою Hack the planet.",
      category: ItemCategory.ELECTRONICS,
      address: "Конференц-зал «Дніпро»",
      lostAt: daysAgo(9),
      status: ClaimStatus.READY_FOR_HANDOVER,
      identityConfirmed: true,
      matchToItem: 9,
    },
    {
      seq: 3,
      claimerEmail: "andriy.ivanov@uzhnu.edu.ua",
      description: "Студентський квиток на ім'я Іванов А., випав біля деканату.",
      category: ItemCategory.DOCUMENTS,
      address: "Корпус №3, біля деканату",
      lostAt: daysAgo(2),
      status: ClaimStatus.READY_FOR_HANDOVER,
      identityConfirmed: true,
      matchToItem: 10,
    },
    {
      seq: 4,
      claimerEmail: "nastia.lev@example.com",
      description: "Шукаю свою сумочку cross-body, забула в тренажерному залі.",
      category: ItemCategory.BAG,
      address: "Тренажерний зал",
      lostAt: daysAgo(26),
      status: ClaimStatus.CLOSED,
      identityConfirmed: true,
      matchToItem: 11,
    },
    {
      seq: 5,
      claimerEmail: "kateryna.h@example.com",
      description: "Забула шарф Burberry у ресторані готелю «Опера».",
      category: ItemCategory.CLOTHING,
      address: "Готель «Опера», ресторан",
      lostAt: daysAgo(16),
      status: ClaimStatus.CLOSED,
      identityConfirmed: true,
      matchToItem: 12,
    },
    {
      seq: 6,
      claimerEmail: "petro.s@example.com",
      description: "Загубив сонячні окуляри в кафе на 2-му поверсі.",
      category: ItemCategory.OTHER,
      address: "Кафе на 2-му поверсі",
      lostAt: daysAgo(3),
      status: ClaimStatus.NEW,
      identityConfirmed: false,
      matchToItem: null,
    },
    {
      seq: 7,
      claimerEmail: "olha.k@example.com",
      description: "Шукаю дочкин рюкзак з єдинорогом, був на дитячому майданчику.",
      category: ItemCategory.BAG,
      address: "Дитячий майданчик",
      lostAt: daysAgo(5),
      status: ClaimStatus.NEW,
      identityConfirmed: false,
      matchToItem: null,
    },
  ];

  const claimIdsBySeq = new Map<number, Types.ObjectId>();

  for (const c of claimSeeds) {
    const claimNumber = claimCode(year, c.seq);
    const doc = {
      claimNumber,
      status: c.status,
      category: c.category,
      description: c.description,
      lostAt: c.lostAt,
      lostLocation: { address: c.address },
      claimerEmail: c.claimerEmail,
      identityConfirmed: c.identityConfirmed,
    };
    const created = await Claim.findOneAndUpdate(
      { claimNumber },
      { $setOnInsert: doc },
      { upsert: true, new: true },
    );
    claimIdsBySeq.set(c.seq, created._id as Types.ObjectId);
  }
  await Counter.updateOne(
    { _id: `claims:${year}` },
    { $set: { seq: claimSeeds.length } },
    { upsert: true },
  );

  console.log("→ Match proposals…");
  for (const c of claimSeeds) {
    if (!c.matchToItem) continue;
    const itemId = itemIdsByTracking.get(code(year, c.matchToItem));
    const claimId = claimIdsBySeq.get(c.seq);
    if (!itemId || !claimId) continue;

    const status =
      c.status === ClaimStatus.READY_FOR_HANDOVER ||
      c.status === ClaimStatus.CLOSED
        ? "CONFIRMED"
        : "PENDING";

    await MatchProposal.updateOne(
      { itemId, claimId },
      {
        $setOnInsert: {
          itemId,
          claimId,
          score: 0.75 + Math.random() * 0.2,
          status,
          reasons: [
            `category=${c.category}`,
            `lostAt≈foundAt`,
            "text-score=high",
          ],
        },
      },
      { upsert: true },
    );
  }

  console.log("→ Handover acts (для RETURNED)…");
  const handoverSeeds: Array<{
    itemSeq: number;
    claimSeq: number | null;
    operator: string;
    notes: string;
    daysAgoSigned: number;
  }> = [
    {
      itemSeq: 11,
      claimSeq: 4,
      operator: "Оператор Тестовий",
      notes: "Заявник упізнав вміст. Документ перевірено.",
      daysAgoSigned: 3,
    },
    {
      itemSeq: 12,
      claimSeq: 5,
      operator: "Адмін Тестовий",
      notes: "Підтвердження за чеком з ресторану.",
      daysAgoSigned: 5,
    },
    {
      itemSeq: 13,
      claimSeq: null,
      operator: "Оператор Тестовий",
      notes: "Власник пред'явив фото з велосипедом і шоломом.",
      daysAgoSigned: 8,
    },
  ];
  // Невеликий 1×1 PNG як підпис (placeholder)
  const stubSignature =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=";
  for (const h of handoverSeeds) {
    const itemId = itemIdsByTracking.get(code(year, h.itemSeq));
    const claimId = h.claimSeq ? claimIdsBySeq.get(h.claimSeq) : undefined;
    if (!itemId) continue;
    await HandoverAct.updateOne(
      { itemId, operatorName: h.operator, notes: h.notes },
      {
        $setOnInsert: {
          itemId,
          claimId,
          operatorName: h.operator,
          signature: stubSignature,
          notes: h.notes,
          handoverDate: daysAgo(h.daysAgoSigned),
        },
      },
      { upsert: true },
    );
  }

  console.log("→ Підписки гостей…");
  const subSeeds = [
    { email: "fan-of-apple@example.com", category: ItemCategory.ELECTRONICS, keywords: ["apple", "macbook", "iphone"] },
    { email: "lost-keys@example.com", category: ItemCategory.KEYS, keywords: [] },
    { email: "mom-of-twins@example.com", category: ItemCategory.BAG, keywords: ["дитяче"] },
    { email: "office-admin@example.com", category: ItemCategory.DOCUMENTS, keywords: ["студентський"] },
  ];
  for (const s of subSeeds) {
    await Subscription.updateOne(
      { email: s.email.toLowerCase(), category: s.category },
      {
        $setOnInsert: {
          email: s.email.toLowerCase(),
          category: s.category,
          keywords: s.keywords,
          active: true,
        },
      },
      { upsert: true },
    );
  }

  console.log("\n✅ Готово. Засіяно:");
  console.log(`   Знахідок: ${itemSeeds.length}`);
  console.log(`   Заявок: ${claimSeeds.length}`);
  console.log(`   Match proposals: ${claimSeeds.filter((c) => c.matchToItem).length}`);
  console.log(`   Handover acts: ${handoverSeeds.length}`);
  console.log(`   Підписок: ${subSeeds.length}`);
  console.log("\nКредентіали:");
  console.log("   admin@lf.com / password123 (ADMIN, seed)");
  console.log("   operator@lf.com / password123 (OPERATOR)");
  console.log("   manager@lf.com / password123 (MANAGER)");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
