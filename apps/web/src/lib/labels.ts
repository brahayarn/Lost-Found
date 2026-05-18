import { useTranslations } from "next-intl";

function makeLabel(ns: string) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const t = useTranslations(ns);
  return (value: string) => {
    try {
      return t(value);
    } catch {
      return value;
    }
  };
}

export const useItemStatusLabel = () => makeLabel("itemStatus");
export const useClaimStatusLabel = () => makeLabel("claimStatus");
export const useMatchStatusLabel = () => makeLabel("matchStatus");

export const useScoreLabel = () => {
  const t = useTranslations("labels");
  return t("score");
};
