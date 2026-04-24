import HttpException from "../../exceptions/http.exception";
import authModel from "../auths/auth.model";
import { IAuth, AllowedMarkets, AuthRole } from "../auths/auth.interface";
import { IProfile } from "../profile/profile.interface";
import profileModel from "../profile/profile.model";
import marketModel from "../markets/market.model";
import AuditLogService from "../audit-logs/audit-log.service";
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
  private logs = new AuditLogService();

  public async grantMarketAccess(
    uid: string,
    marketId: string,
    adminId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<IAuth> {
    let isVerified = null;
    try {
      isVerified = await authModel.findById(uid);
      if (!isVerified?.isVerified || isVerified.userRole !== AuthRole.Admin) throw new HttpException(400, "failed", "This user is not verified and is not an Administrator");
       
      const user = await authModel.findByIdAndUpdate(
        uid,
        {
          $set: {
            allowedMarkets: marketId,
          },
        },
        { new: true },
      ).populate("allowedMarkets").select("-password -sessionToken -refreshToken ");
      
      if (!user)
        throw new HttpException(404, "Not found", "User doesn't exist");

      await profileModel.findOneAndUpdate(
        { uid: uid },
        {
          $set: {
            userMarket: marketId,
          },
        },
        { new: true },
      );

      await this.logs.logAction({
        actorId: adminId,
        actorType: AuthRole.superAdmin,
        action: "MARKET_ACCESS_GRANTED",
        entityType: user.userRole,
        entityId: user._id,
        status: "SUCCESS",
        ipAddress,
        userAgent,
        metadata: { targetUserId: uid, marketId }
      });

      return user;
    } catch (error: any) {
      await this.logs.logAction({
        actorId: adminId,
        actorType: AuthRole.superAdmin,
        action: "MARKET_ACCESS_GRANTED",
        entityType: isVerified?.userRole || AuthRole.User,
        status: "FAILED",
        ipAddress,
        userAgent,
        metadata: { targetUserId: uid, marketId, error: error.message }
      });
      throw new HttpException(400, "failed", `Failed to grant market access `);
    }
  }

  public async grantRole(uid: string, role: AuthRole, adminId?: string, ipAddress?: string, userAgent?: string): Promise<IAuth> {
    let isVerified = null;
    try {
      isVerified = await authModel.findById(uid);
      if (!isVerified?.isVerified)
        throw new HttpException(400, "failed", "User is not verified");
      
      const user = await authModel.findByIdAndUpdate(
          uid,
          {
            $set: {
              userRole: role,
            },
          },
          { new: true },
        ).populate("allowedMarkets").select("-password -sessionToken -refreshToken ")
        .lean();

      if (!user)
        throw new HttpException(404, "Not found", "User doesn't exist");

      await profileModel.findOneAndUpdate(
          { uid: uid },
          {
            $set: {
              roles: role,
            },
          },
          { new: true },
        );

      await this.logs.logAction({
        actorId: adminId,
        actorType: AuthRole.superAdmin,
        action: "ROLE_GRANTED",
        entityType: user.userRole,
        entityId: (user as any)._id,
        status: "SUCCESS",
        ipAddress,
        userAgent,
        metadata: { targetUserId: uid, role }
      });

      return user as any;
    } catch (error: any) {
      await this.logs.logAction({
        actorId: adminId,
        actorType: AuthRole.superAdmin,
        action: "ROLE_GRANTED",
        entityType: isVerified?.userRole || AuthRole.User,
        status: "FAILED",
        ipAddress,
        userAgent,
        metadata: { targetUserId: uid, role, error: error.message }
      });
      throw new HttpException(
        error.status || 400,
        `${error}`,
        `Failed to grant role `,
      );
    }
  }

  public async verifyUser(uid: string, adminId?: string, ipAddress?: string, userAgent?: string): Promise<IAuth> {
    try {
      const user = await authModel.findById(uid);
      if (!user)
        throw new HttpException(404, "Not found", "User doesn't exist");
      user.isVerified = true;
      await user.save();

      await this.logs.logAction({
        actorId: adminId,
        actorType: AuthRole.superAdmin,
        action: "USER_VERIFIED",
        entityType: user.userRole,
        entityId: user._id,
        status: "SUCCESS",
        ipAddress,
        userAgent,
        metadata: { targetUserId: uid }
      });

      return user;
    } catch (error: any) {
      await this.logs.logAction({
        actorId: adminId,
        actorType: AuthRole.superAdmin,
        action: "USER_VERIFIED",
        entityType: AuthRole.User, // Fallback
        status: "FAILED",
        ipAddress,
        userAgent,
        metadata: { targetUserId: uid, error: error.message }
      });
      throw new HttpException(400, "failed", `Failed to verify user `);
    }
  }

  public async revokeAccess(uid: string, adminId?: string, ipAddress?: string, userAgent?: string): Promise<IAuth> {
    try {
      const user = await authModel.findById(uid);
      if (!user)
        throw new HttpException(404, "Not found", "User doesn't exist");
      user.userRole = null as any;
      user.allowedMarkets = [] as any;
      
      await profileModel.findOneAndUpdate(
        { uid },
        {
          $set: {
            userRole: null as any,
            allowedMarkets: [] as any,
          },
        },
        { new: true },
      );
      
      const savedUser = await user.save();

      await this.logs.logAction({
        actorId: adminId,
        actorType: AuthRole.superAdmin,
        action: "ACCESS_REVOKED",
        entityType: user.userRole,
        entityId: user._id,
        status: "SUCCESS",
        ipAddress,
        userAgent,
        metadata: { targetUserId: uid }
      });

      return savedUser;
    } catch (error: any) {
      await this.logs.logAction({
        actorId: adminId,
        actorType: AuthRole.superAdmin,
        action: "ACCESS_REVOKED",
        entityType: AuthRole.User, // Fallback
        status: "FAILED",
        ipAddress,
        userAgent,
        metadata: { targetUserId: uid, error: error.message }
      });
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
          .populate({
            path: "allowedMarkets",
            select: "name location",
          })
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
