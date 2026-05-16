import { Injectable } from "@nestjs/common";
import PDFDocument = require("pdfkit");
import * as QRCode from "qrcode";

const MM = 2.83465; // 1mm = 2.83465pt
const LABEL_W = 60 * MM;
const LABEL_H = 40 * MM;

const CATEGORY_LABEL: Record<string, string> = {
  ELECTRONICS: "Електроніка",
  DOCUMENTS: "Документи",
  KEYS: "Ключі",
  BAG: "Сумка",
  CLOTHING: "Одяг",
  JEWELRY: "Прикраси",
  OTHER: "Інше",
};

interface LabelInput {
  itemNumber: string;
  category: string;
  trackingCode: string;
  publicUrl: string;
}

@Injectable()
export class PdfService {
  async generateItemLabel(input: LabelInput): Promise<Buffer> {
    const qrPng = await QRCode.toBuffer(input.publicUrl, {
      type: "png",
      errorCorrectionLevel: "M",
      margin: 0,
      width: 256,
    });

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: [LABEL_W, LABEL_H],
        margin: 0,
        info: { Title: `Label ${input.itemNumber}` },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const padding = 3 * MM;
      const qrSize = 28 * MM;
      const qrX = LABEL_W - qrSize - padding;
      const qrY = (LABEL_H - qrSize) / 2;

      // Brand
      doc
        .fillColor("#1c1917")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("L&F", padding, padding);

      doc
        .font("Helvetica")
        .fontSize(6)
        .fillColor("#78716c")
        .text("Lost & Found", padding, padding + 12);

      // Item number — head text
      doc
        .fillColor("#1c1917")
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(input.itemNumber, padding, padding + 24, {
          width: qrX - padding - 2,
        });

      // Category
      const categoryLabel =
        CATEGORY_LABEL[input.category] ?? input.category;
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#44403c")
        .text(categoryLabel, padding, padding + 42, {
          width: qrX - padding - 2,
        });

      // Tracking code (small, monospace-style)
      doc
        .font("Courier")
        .fontSize(7)
        .fillColor("#78716c")
        .text(input.trackingCode, padding, LABEL_H - padding - 8, {
          width: qrX - padding - 2,
        });

      // QR
      doc.image(qrPng, qrX, qrY, { width: qrSize, height: qrSize });

      doc.end();
    });
  }
}
