import { ItemCategory } from "@lf/shared";

export const CATEGORY_OPTIONS: Array<{
  value: ItemCategory;
  label: string;
}> = [
  { value: ItemCategory.ELECTRONICS, label: "Електроніка" },
  { value: ItemCategory.DOCUMENTS, label: "Документи" },
  { value: ItemCategory.KEYS, label: "Ключі" },
  { value: ItemCategory.BAG, label: "Сумка / Рюкзак" },
  { value: ItemCategory.CLOTHING, label: "Одяг" },
  { value: ItemCategory.JEWELRY, label: "Прикраси" },
  { value: ItemCategory.OTHER, label: "Інше" },
];
