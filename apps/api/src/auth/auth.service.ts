import {
  Injectable,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { LoginDto, AuthLoginResponse, AuthRefreshResponse } from "@lf/shared";
import { UsersService } from "../users/users.service";
import type { JwtPayload } from "./auth.types";
import { RefreshToken, RefreshTokenDocument } from "./refresh-token.schema";

const REFRESH_BYTES = 48;

function parseDuration(s: string, fallbackMs: number): number {
  // Minimal parser for forms: "15m", "30d", "7d", "1h", "3600s"
  const m = /^(\d+)\s*(s|m|h|d)$/.exec(s.trim());
  if (!m) return fallbackMs;
  const n = Number(m[1]);
  const unit = m[2];
  switch (unit) {
    case "s":
      return n * 1000;
    case "m":
      return n * 60_000;
    case "h":
      return n * 3_600_000;
    case "d":
      return n * 86_400_000;
  }
  return fallbackMs;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessExpires: string;
  private readonly refreshExpires: string;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
    @InjectModel(RefreshToken.name)
    private readonly refreshModel: Model<RefreshTokenDocument>,
  ) {
    this.accessExpires = this.cfg.get<string>("JWT_EXPIRES_IN", "15m");
    this.refreshExpires = this.cfg.get<string>("REFRESH_EXPIRES_IN", "30d");
  }

  private hash(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private generateRefresh(): string {
    return crypto.randomBytes(REFRESH_BYTES).toString("base64url");
  }

  private async issueRefresh(
    userId: Types.ObjectId,
    meta: { userAgent?: string; ip?: string } = {},
  ): Promise<string> {
    const token = this.generateRefresh();
    const expiresAt = new Date(
      Date.now() + parseDuration(this.refreshExpires, 30 * 86_400_000),
    );
    await this.refreshModel.create({
      tokenHash: this.hash(token),
      userId,
      expiresAt,
      userAgent: meta.userAgent,
      ip: meta.ip,
    });
    return token;
  }

  private async signAccess(payload: JwtPayload): Promise<string> {
    return this.jwt.signAsync(payload);
  }

  private accessExpiresInSec(): number {
    return Math.floor(parseDuration(this.accessExpires, 900_000) / 1000);
  }

  async login(
    dto: LoginDto,
    meta: { userAgent?: string; ip?: string } = {},
  ): Promise<AuthLoginResponse> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };
    const accessToken = await this.signAccess(payload);
    const refreshToken = await this.issueRefresh(user._id, meta);

    return {
      token: accessToken, // backward-compat
      accessToken,
      refreshToken,
      expiresIn: this.accessExpiresInSec(),
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refresh(
    refreshToken: string,
    meta: { userAgent?: string; ip?: string } = {},
  ): Promise<AuthRefreshResponse> {
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token required");
    }

    const tokenHash = this.hash(refreshToken);
    const record = await this.refreshModel.findOne({ tokenHash });

    if (!record) {
      this.logger.warn("Refresh attempt with unknown token");
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (record.revokedAt) {
      // Реюз revoked токена — потенційний витік: відкликати всі сесії юзера.
      this.logger.warn(
        `Refresh reuse detected for user ${record.userId} — revoking all`,
      );
      await this.refreshModel.updateMany(
        { userId: record.userId, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } },
      );
      throw new UnauthorizedException("Refresh token revoked");
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException("Refresh token expired");
    }

    const user = await this.users.findById(record.userId.toString());
    if (!user) throw new UnauthorizedException("User not found");

    // Ротація
    const newRefresh = this.generateRefresh();
    const newHash = this.hash(newRefresh);
    const newExpiresAt = new Date(
      Date.now() + parseDuration(this.refreshExpires, 30 * 86_400_000),
    );

    record.revokedAt = new Date();
    record.replacedBy = newHash;
    await record.save();

    await this.refreshModel.create({
      tokenHash: newHash,
      userId: user._id,
      expiresAt: newExpiresAt,
      userAgent: meta.userAgent,
      ip: meta.ip,
    });

    const accessToken = await this.signAccess({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      accessToken,
      refreshToken: newRefresh,
      expiresIn: this.accessExpiresInSec(),
    };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    const tokenHash = this.hash(refreshToken);
    await this.refreshModel.updateOne(
      { tokenHash, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
  }
}
