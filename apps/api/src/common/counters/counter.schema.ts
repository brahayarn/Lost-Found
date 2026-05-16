import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type CounterDocument = HydratedDocument<Counter>;

@Schema({ collection: "counters", versionKey: false })
export class Counter {
  @Prop({ type: String, required: true, unique: true })
  _id!: string;

  @Prop({ type: Number, required: true, default: 0 })
  seq!: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
