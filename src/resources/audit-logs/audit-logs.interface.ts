import { Document, Types } from "mongoose";
import { AuthRole } from "../auths/auth.interface";
export interface IAuditLog extends Document {
  actorId?: Types.ObjectId;
  actorType: AuthRole;
  action: string;
  entityType?: string;
  entityId?: Types.ObjectId;
  status: "SUCCESS" | "FAILED";
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  before?: any;
  after?: any;
  createdAt: Date;
}

export interface ILogActionParams {
  actorId?: any;
  actorType: AuthRole;
  action: string;
  entityType?: string;
  entityId?: any;
  status?: "SUCCESS" | "FAILED";
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  before?: any;
  after?: any;
}