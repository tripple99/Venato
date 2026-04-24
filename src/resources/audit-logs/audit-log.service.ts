import HttpException from "../../exceptions/http.exception";
import auditLogModel from "./audit-logs.model";
import { IAuditLog, ILogActionParams } from "./audit-logs.interface";
import { PaginationQuery, PaginationResult } from "../../interface/pagination.interface";
import { buildSortOptions, createPaginatedResult, paginationQuery } from "../../utils/pagination";
import { AuthRole } from "../auths/auth.interface";
import { agenda } from "../../helpers/agenda";
import logger from "../../utils/logger";
import authModel from "../auths/auth.model";


export default class AuditLogService {

    public async logAction(params: ILogActionParams): Promise<void> {
        try {
            await agenda.now("LOG_AUDIT_EVENT", { auditData: params });
        } catch (error) {
            logger.error(`[AUDIT QUEUE ERROR] Failed to queue audit log:`, { error });
            // Fallback to direct write if queue fails? User might prefer queue only for performance
             // throw new HttpException(400, "failed", `Failed to log action ${error}`);
        }
    }


    public async getAllAuditLogs(query:any): Promise<PaginationResult<IAuditLog>> {
        try {
            const pagination = paginationQuery(query);
            const sortOptions = buildSortOptions(pagination.sortBy, pagination.sortOrder);
            const [auditLogs, totalCount] = await Promise.all([
                auditLogModel
                    .find({})
                    .sort(sortOptions)
                    .skip(pagination.skip)
                    .limit(pagination.limit)
                    .populate({
                        path: "actorId",
                        select: "name email",
                    })
                    .lean(),
                auditLogModel.countDocuments({}).lean(),
            ]);
            return createPaginatedResult(auditLogs, totalCount, pagination.page, pagination.limit);
        } catch (error) {
            throw new HttpException(400, "failed", `Failed to get all audit logs ${error}`);
        }
    }
}