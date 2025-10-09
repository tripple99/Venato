import { email } from "zod";
import HttpException from "../../exceptions/http.exception";
import { IProfile } from "./profile.interface";
import profileModel from "./profile.model";



class ProfileService{
  public async createProfile(data:IProfile):Promise<IProfile  >{
      try {
        const createProfile = new profileModel(data)
        return await createProfile.save()
      } catch (error) {
        throw new HttpException(400,"Failed",`Failed to create user Profile ${error}`)
      }
  }
 public async updateProfile(uid: string, data: Partial<IProfile>): Promise<IProfile> {
  try {
    // If uid is the _id
    const updatedProfile = await profileModel.findByIdAndUpdate(
      uid,
      { $set: data },
      { new: true } // return updated document
    ).exec();

    if (!updatedProfile) {
      throw new HttpException(404, "Not found", `User doesn't exist`);
    }

    return updatedProfile;
  } catch (error) {
    throw new HttpException(400, "Failed", `Failed to update user profile ${error}`);
  }
}
public async deleteProfile(uid:string):Promise<IProfile>{
  try {
     const userProfile = await profileModel.findByIdAndDelete({uid}).exec()
     if(!userProfile) throw new HttpException(404,"Not found",`User doesn't exist`)
     return userProfile
  }catch(error) {
    throw new HttpException(404,"Not found",`Failed to delete user`)
  }
}

}


export default ProfileService;