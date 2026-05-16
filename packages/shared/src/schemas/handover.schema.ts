import { z } from "zod";

export const HandoverDtoSchema = z.object({
  signature: z
    .string()
    .regex(/^data:image\/(png|jpeg);base64,/, "Підпис у форматі data URL")
    .max(2_000_000, "Підпис завеликий"),
  claimId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  operatorName: z.string().min(1).max(100).optional(),
  notes: z.string().max(2000).optional(),
});
export type HandoverDto = z.infer<typeof HandoverDtoSchema>;
