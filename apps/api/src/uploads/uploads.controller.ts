import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from "@nestjs/swagger";
import { diskStorage } from "multer";
import * as path from "path";
import * as fs from "fs";
import * as fsp from "fs/promises";
import { customAlphabet } from "nanoid";
import sharp from "sharp";
import { UserRole } from "@lf/shared";
import { Roles } from "../auth/decorators";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
const BLUR_DIR = path.join(UPLOAD_DIR, "blur");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(BLUR_DIR, { recursive: true });

const nano = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);
const ALLOWED = /^image\/(jpeg|png|webp|gif)$/;
const MAX_BYTES = 8 * 1024 * 1024;

interface UploadedPhoto {
  url: string;
  blurredUrl: string;
}

@ApiTags("uploads")
@ApiBearerAuth()
@Controller("uploads")
export class UploadsController {
  @Post()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: "Завантаження фото (оригінал + розмита копія)" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FilesInterceptor("files", 5, {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase() || ".bin";
          cb(null, `${Date.now()}-${nano()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED.test(file.mimetype)) {
          return cb(new BadRequestException("Лише JPEG/PNG/WEBP/GIF"), false);
        }
        cb(null, true);
      },
      limits: { fileSize: MAX_BYTES },
    }),
  )
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[]; blurredUrls: string[]; photos: UploadedPhoto[] }> {
    if (!files?.length) throw new BadRequestException("Не передано файлів");

    const base = process.env.PUBLIC_URL ?? "http://localhost:3000";
    const photos: UploadedPhoto[] = [];

    for (const f of files) {
      const blurName = f.filename.replace(/\.[^.]+$/, ".jpg");
      const blurPath = path.join(BLUR_DIR, blurName);

      await sharp(f.path)
        .resize({ width: 800, withoutEnlargement: true })
        .blur(20)
        .jpeg({ quality: 60 })
        .toFile(blurPath);

      photos.push({
        url: `${base}/uploads/${f.filename}`,
        blurredUrl: `${base}/uploads/blur/${blurName}`,
      });
    }

    return {
      urls: photos.map((p) => p.url),
      blurredUrls: photos.map((p) => p.blurredUrl),
      photos,
    };
  }
}
