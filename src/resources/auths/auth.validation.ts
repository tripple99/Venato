import {z} from "zod" 
import { OtpPurpose } from "../otp/opt.protocol"




const register = z.object({
   fullname: z.string().min(1,"fullname is required"),
   email:z.string().email("Invalid email address"),
   password:z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
})

const login = z.object({
  email:z.string().email("Invalid email address"),
  password:z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
})

const forgotPassword = z.object({
  email:z.string().email("Invalid email address"),
  // purpose: z.literal(OtpPurpose.RESETPASSWORD),
})
const refreshToken = z.object({
  token:z.object({
        refreshToken: z.string().min(1, 'Refresh token is required')
    })
})

const validateOtp = z.object({
  email:z.string().email("Invalid email address"),
  purpose:z.enum([OtpPurpose.VERIFICATION,OtpPurpose.RESETPASSWORD,OtpPurpose.Registration]),
  otp:z.string().regex(/^[a-z0-9]{6}$/, "Must be 6 lowercase letters/numbers"),
})

const resendOtp = z.object({
  email:z.string().email("Invalid email address"),
  purpose:z.enum([OtpPurpose.VERIFICATION,OtpPurpose.RESETPASSWORD,OtpPurpose.Registration])
})

const updatePassword = z.object({
password:z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
resetToken: z.string().min(1, 'Reset token is required'),
})


export default {
  register,
   login,
   refreshToken,
   forgotPassword,
   validateOtp,
   updatePassword,
   resendOtp,

}