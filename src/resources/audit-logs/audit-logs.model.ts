import mongoose from "mongoose";
import { AuthRole } from "../auths/auth.interface";
import { IAuditLog } from "./audit-logs.interface";

const AuditLogSchema = new mongoose.Schema<IAuditLog>({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
  },

  actorType: {
    type: String,
    enum: AuthRole,
    required: true,
  },

  action: {
    type: String,
    required: true,
  },

  entityType: {
    type: String,
  },

  entityId: {
    type: mongoose.Schema.Types.ObjectId,
  },

  status: {
    type: String,
    enum: ["SUCCESS", "FAILED"],
    default: "SUCCESS",
  },

  ipAddress: String,
  userAgent: String,

  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },

  before: {
    type: mongoose.Schema.Types.Mixed,
  },

  after: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false } // immutable
});


AuditLogSchema.index({ actorId: 1 });
AuditLogSchema.index({ entityId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });


export default mongoose.model("AuditLog", AuditLogSchema);