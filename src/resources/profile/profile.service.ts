import HttpException from "../../exceptions/http.exception";
import { IProfile } from "./profile.interface";
import profileModel from "./profile.model";
import AuditLogService from "../audit-logs/audit-log.service";
import { AuthRole } from "../auths/auth.interface";

class ProfileService {
  private logs = new AuditLogService();

  public async createProfile(data:IProfile):Promise<IProfile  >{
      try {
        const createProfile = new profileModel(data)
       
        return await createProfile.save()
      } catch (error) {
        throw new HttpException(400,"Failed",`Failed to create user Profile`)
      }
  }

  public async getProfile(uid:string):Promise<IProfile>{
    try {
      const userProfile = await profileModel.findOne({uid}).exec()
      if(!userProfile) throw new HttpException(404,"Not found",`User doesn't exist`)
      return userProfile
    } catch(error) {
      throw new HttpException(404,"Not found",`Failed to get user`)
    }
  }

  public async updateProfile(uid: string, data: Partial<IProfile>, ipAddress?: string, userAgent?: string): Promise<IProfile> {
    try {
      const updatedProfile = await profileModel.findByIdAndUpdate(
        uid,
        { $set: data },
        { new: true }
      ).exec();

      if (!updatedProfile) {
        throw new HttpException(404, "Not found", `User doesn't exist`);
      }

      await this.logs.logAction({
        actorId: updatedProfile.uid.toString(),
        actorType: AuthRole.User,
        action: "PROFILE_UPDATED",
        entityType: "Profile",
        entityId: updatedProfile._id,
        status: "SUCCESS",
        ipAddress,
        userAgent,
        metadata: { updatedFields: Object.keys(data) }
      });

      return updatedProfile;
    } catch (error: any) {
       await this.logs.logAction({
        actorType: AuthRole.User,
        action: "PROFILE_UPDATED",
        entityType: "Profile",
        status: "FAILED",
        ipAddress,
        userAgent,
        metadata: { error: error.message }
      });
      throw new HttpException(400, "Failed", `Failed to update user profile`);
    }
  }

  public async deleteProfile(uid:string, actorId?: string, ipAddress?: string, userAgent?: string): Promise<IProfile> {
    try {
       const userProfile = await profileModel.findByIdAndDelete({uid}).exec()
       if(!userProfile) throw new HttpException(404,"Not found",`User doesn't exist`)
       
       await this.logs.logAction({
        actorId: actorId || userProfile.uid.toString(),
        actorType: actorId ? AuthRole.superAdmin : AuthRole.User,
        action: "PROFILE_DELETED",
        entityType: "Profile",
        entityId: userProfile._id,
        status: "SUCCESS",
        ipAddress,
        userAgent,
        metadata: { deletedUserId: uid }
      });

       return userProfile
    } catch(error: any) {
       await this.logs.logAction({
        actorType: AuthRole.User,
        action: "PROFILE_DELETED",
        entityType: "Profile",
        status: "FAILED",
        ipAddress,
        userAgent,
        metadata: { error: error.message }
      });
      throw new HttpException(404,"Not found",`Failed to delete user`)
    }
  }
}

export default ProfileService;
