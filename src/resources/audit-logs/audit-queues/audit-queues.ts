import auditLogsModel from "../audit-logs.model";
import { agenda } from "../../../helpers/agenda";
import logger from "../../../utils/logger";

// jobs/auditLog.job.ts
agenda.define("LOG_AUDIT_EVENT", async (job) => {
  const { auditData } = job.attrs.data;
  try {
    await auditLogsModel.create(auditData);
    await job.remove();
  } catch (err) {
    logger.error("Failed to write audit log:", { error: err });
  }
});

