import HttpException from "../../exceptions/http.exception";
import authModel from "../auths/auth.model";
import { IAuth, AllowedMarkets, AuthRole } from "../auths/auth.interface";
import { IProfile } from "../profile/profile.interface";
import profileModel from "../profile/profile.model";
import marketModel from "../markets/market.model";
import {
  PaginationQuery,
  PaginationResult,
} from "../../interface/pagination.interface";
import {
  buildSortOptions,
  createPaginatedQuerySchema,
  createPaginatedResult,
  paginationQuery,
} from "../../utils/pagination";

class AccessControlService {
  public async grantMarketAccess(
    uid: string,
    marketId: string,
    data: Partial<IAuth>,
  ): Promise<IProfile> {
    try {
      const isVerified = await authModel.findById(uid);
      if (!isVerified?.isVerified)
        throw new HttpException(404, "Not found", "User doesn't exist");
      const user = await authModel.findByIdAndUpdate(
        uid,
        {
          $set: {
            allowedMarkets: marketId,
          },
        },
        { new: true },
      );
      // const marketName = await marketModel.findById(marketId)
      const profile = await profileModel
        .findOneAndUpdate(
          { uid: uid },
          {
            $set: {
              userRole: data.userRole,
              userMarket: marketId,
            },
          },
          { new: true },
        )
        .populate("userMarket");
      console.log(profile);
      if (!user)
        throw new HttpException(404, "Not found", "User doesn't exist");
      return profile;
    } catch (error) {
      throw new HttpException(404, "failed", `Failed to grant role `);
    }
  }

  public async grantRole(uid: string, role: AuthRole): Promise<IProfile> {
    try {
      const isVerified = await authModel.findById(uid);
      if (!isVerified?.isVerified)
        throw new HttpException(404, "Not found", "User doesn't exist");
      const user = await authModel
        .findByIdAndUpdate(
          uid,
          {
            $set: {
              userRole: role,
            },
          },
          { new: true },
        )
        .lean();
      const profile = await profileModel
        .findOneAndUpdate(
          { uid: uid },
          {
            $set: {
              userRole: role,
            },
          },
          { new: true },
        )
        .lean();

      return profile;
    } catch (error) {
      throw new HttpException(
        error.status,
        `${error}`,
        `Failed to grant role `,
      );
    }
  }

  public async revokeAccess(uid: string): Promise<IAuth> {
    try {
      const user = await authModel.findById(uid);
      if (!user)
        throw new HttpException(404, "Not found", "User doesn't exist");
      user.userRole = null as any;
      user.allowedMarkets = [] as any;
      const profile = await profileModel.findOneAndUpdate(
        { uid },
        {
          $set: {
            userRole: null as any,
            allowedMarkets: [] as any,
          },
        },
        { new: true },
      );
      return await user.save();
    } catch (error) {
      throw new HttpException(400, "failed", `Failed to revoke user access `);
    }
  }

  public async getAllUsers(query: any): Promise<PaginationResult<IAuth>> {
    try {
      const pagination = paginationQuery(query);
      const sortOptions = buildSortOptions(
        pagination.sortBy,
        pagination.sortOrder,
      );
      const [users, totalCount] = await Promise.all([
        authModel
          .find({})
          .sort(sortOptions)
          .skip(pagination.skip)
          .limit(pagination.limit)
          // .populate({
          //   path: "allowedMarkets",
          //   select: "name location",
          // })
          .lean(),
        authModel.countDocuments({}).lean(),
      ]);
      return createPaginatedResult(
        users,
        totalCount,
        pagination.page,
        pagination.limit,
      );
    } catch (error) {
      throw new HttpException(
        400,
        "failed",
        `Failed to get all users ${error}`,
      );
    }
  }
}

export default AccessControlService;
