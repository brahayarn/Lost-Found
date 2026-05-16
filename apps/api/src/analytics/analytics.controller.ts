import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ItemStatus, MatchProposalStatus, UserRole } from "@lf/shared";
import { Roles } from "../auth/decorators";
import { Item, ItemDocument } from "../items/item.schema";
import { Claim, ClaimDocument } from "../claims/claim.schema";
import {
  MatchProposal,
  MatchProposalDocument,
} from "../match-proposals/match-proposal.schema";

@ApiTags("analytics")
@ApiBearerAuth()
@Roles(UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN)
@Controller("analytics")
export class AnalyticsController {
  constructor(
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(Claim.name) private readonly claimModel: Model<ClaimDocument>,
    @InjectModel(MatchProposal.name)
    private readonly proposalModel: Model<MatchProposalDocument>,
  ) {}

  @Get("summary")
  @ApiOperation({ summary: "Зведена статистика для дашборду" })
  async summary() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalItems, todayItems, returnedItems, openClaims, pendingMatches] =
      await Promise.all([
        this.itemModel.countDocuments({}),
        this.itemModel.countDocuments({ createdAt: { $gte: startOfToday } }),
        this.itemModel.countDocuments({ status: ItemStatus.RETURNED }),
        this.claimModel.countDocuments({
          status: { $nin: ["CLOSED", "REJECTED"] },
        }),
        this.proposalModel.countDocuments({
          status: MatchProposalStatus.PENDING,
        }),
      ]);

    return {
      totalItems,
      todayItems,
      returnedItems,
      openClaims,
      pendingMatches,
      conversionRate:
        totalItems > 0 ? Math.round((returnedItems / totalItems) * 100) : 0,
    };
  }

  @Get("daily")
  @ApiOperation({ summary: "Денна динаміка за останні 7 днів" })
  async daily() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);

    const [items, returned] = await Promise.all([
      this.itemModel.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]),
      this.itemModel.aggregate([
        {
          $match: {
            status: ItemStatus.RETURNED,
            updatedAt: { $gte: start },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const itemsMap = new Map(items.map((x) => [x._id, x.count]));
    const returnedMap = new Map(returned.map((x) => [x._id, x.count]));

    const days: Array<{ date: string; found: number; returned: number }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: key,
        found: itemsMap.get(key) ?? 0,
        returned: returnedMap.get(key) ?? 0,
      });
    }
    return days;
  }

  @Get("locations")
  @ApiOperation({ summary: "Топ-10 локацій за кількістю знахідок" })
  async locations() {
    return this.itemModel.aggregate([
      { $match: { "foundLocation.address": { $exists: true } } },
      { $group: { _id: "$foundLocation.address", value: { $sum: 1 } } },
      { $project: { _id: 0, name: "$_id", value: 1 } },
      { $sort: { value: -1 } },
      { $limit: 10 },
    ]);
  }

  @Get("categories")
  @ApiOperation({ summary: "Розподіл речей за категоріями" })
  async categories() {
    const result = await this.itemModel.aggregate([
      { $group: { _id: "$category", value: { $sum: 1 } } },
      { $project: { _id: 0, name: "$_id", value: 1 } },
      { $sort: { value: -1 } },
    ]);
    return result;
  }
}
