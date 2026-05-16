import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { UserRole } from "@lf/shared";
import { User, UserDocument } from "./user.schema";

const SEED_EMAIL = "admin@lf.com";
const SEED_PASSWORD = "password123";
const SEED_NAME = "Admin";

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    const count = await this.userModel.estimatedDocumentCount();
    if (count > 0) return;
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
    await this.userModel.create({
      email: SEED_EMAIL,
      passwordHash,
      name: SEED_NAME,
      role: UserRole.ADMIN,
    });
    this.logger.warn(
      `🔑 Seeded admin user: ${SEED_EMAIL} / ${SEED_PASSWORD} (CHANGE ON PROD!)`,
    );
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase().trim() });
  }

  findById(id: string) {
    return this.userModel.findById(id);
  }

  list() {
    return this.userModel
      .find({}, { passwordHash: 0 })
      .sort({ createdAt: -1 })
      .lean();
  }

  async create(data: {
    email: string;
    name: string;
    password: string;
    role: UserRole;
  }) {
    const email = data.email.toLowerCase().trim();
    const existing = await this.userModel.findOne({ email });
    if (existing) throw new ConflictException("Email вже зайнятий");
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.userModel.create({
      email,
      name: data.name,
      passwordHash,
      role: data.role,
    });
    return this.publicView(user);
  }

  async setRole(id: string, role: UserRole) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: { role } },
      { new: true },
    );
    if (!user) throw new NotFoundException("User not found");
    return this.publicView(user);
  }

  async remove(id: string) {
    const adminCount = await this.userModel.countDocuments({
      role: UserRole.ADMIN,
    });
    const target = await this.userModel.findById(id);
    if (!target) throw new NotFoundException("User not found");
    if (target.role === UserRole.ADMIN && adminCount === 1) {
      throw new ConflictException("Не можна видалити останнього адміна");
    }
    await this.userModel.deleteOne({ _id: id });
    return { id };
  }

  private publicView(u: UserDocument) {
    return {
      id: u._id.toString(),
      email: u.email,
      name: u.name,
      role: u.role,
    };
  }
}
