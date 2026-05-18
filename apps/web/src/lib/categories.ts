import { ItemCategory } from "@lf/shared";
import { useTranslations } from "next-intl";

export const CATEGORY_VALUES: ItemCategory[] = [
  ItemCategory.ELECTRONICS,
  ItemCategory.DOCUMENTS,
  ItemCategory.KEYS,
  ItemCategory.BAG,
  ItemCategory.CLOTHING,
  ItemCategory.JEWELRY,
  ItemCategory.OTHER,
];

export function useCategoryOptions(): Array<{
  value: ItemCategory;
  label: string;
}> {
  const t = useTranslations("categories");
  return CATEGORY_VALUES.map((value) => ({ value, label: t(value) }));
}

export function useCategoryLabel() {
  const t = useTranslations("categories");
  return (value: ItemCategory | string) => {
    try {
      return t(value);
    } catch {
      return value;
    }
  };
}
