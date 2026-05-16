import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Counter } from "./counter.schema";

@Injectable()
export class CountersService {
  constructor(
    @InjectModel(Counter.name) private readonly counterModel: Model<Counter>,
  ) {}

  async nextSeq(name: string): Promise<number> {
    const doc = await this.counterModel.findByIdAndUpdate(
      name,
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return doc.seq;
  }

  async nextItemNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const key = `items:${year}`;
    const seq = await this.nextSeq(key);
    return `LF-${year}-${String(seq).padStart(5, "0")}`;
  }
}
