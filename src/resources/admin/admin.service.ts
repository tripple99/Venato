import crypto from "crypto";
import HttpException from "../../exceptions/http.exception";
import authModel from "../auths/auth.model";
import { IAuth, AuthRole } from "../auths/auth.interface";
import AuditLogService from "../audit-logs/audit-log.service";
import AgendaQueueService from "../mail/email.worker";
import Mailtemplates from "../mail/mail.templates";

class AdminService {
  private logs = new AuditLogService();
  private agenda = new AgendaQueueService();

  public async inviteUser(
    adminId: string,
    email: string,
    fullname: string,
    role: AuthRole,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ message: string; user: Partial<IAuth> }> {
    try {
      // 1. Check if user already exists
      const existingUser = await authModel.findOne({ email });
      if (existingUser) {
        throw new HttpException(409, "Conflict", "User with this email already exists");
      }

      // 2. Generate a highly secure dummy password to satisfy Mongoose validation
      // This will be overwritten when the user sets their actual password
      const dummyPassword = crypto.randomBytes(64).toString("hex");

      // 3. Create user with isActive: false
      const newUser = new authModel({
        fullname,
        email,
        password: dummyPassword,
        userRole: role,
        isActive: false,
        isVerified: false,
      });

      await newUser.save();

      // 4. Generate Invite Link to Forgot Password Page and Send Email
      // Ideally, the base URL should come from env variables
      const baseUrl = process.env.FRONTEND_URL || "https://venato-frontend.vercel.app";
      const inviteLink = `${baseUrl}/auth/forgot-password`;
      
      const emailContent = Mailtemplates.userInviteTemplate.replace(
        "{{INVITE_LINK}}",
        inviteLink
      );

      await this.agenda.sendNow(
        email,
        "You've been invited to Venato",
        emailContent,
        "Invite"
      );

      // 6. Audit Logging
      await this.logs.logAction({
        actorId: adminId,
        actorType: AuthRole.superAdmin, // Or depending on the admin who created it
        action: "USER_INVITED",
        entityType: role,
        entityId: newUser._id,
        status: "SUCCESS",
        ipAddress,
        userAgent,
        metadata: { targetEmail: email, role }
      });

      return {
        message: "User successfully invited. An email has been sent.",
        user: {
          id: newUser.id,
          email: newUser.email,
          fullname: newUser.fullname,
          userRole: newUser.userRole,
        }
      };
    } catch (error: any) {
      await this.logs.logAction({
        actorId: adminId,
        actorType: AuthRole.superAdmin,
        action: "USER_INVITED",
        status: "FAILED",
        ipAddress,
        userAgent,
        metadata: { targetEmail: email, role, error: error.message }
      });
      if (error instanceof HttpException) throw error;
      throw new HttpException(400, "Failed", "Failed to invite user");
    }
  }
}

export default AdminService;
