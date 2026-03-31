export enum OtpPurpose {
  VERIFICATION = "verification",
  RESETPASSWORD = "reset-password",
  Registration = "registeration",
}
interface OTP {
  uid: string;
  otp: string;
  purpose:OtpPurpose;
  createdAt: Date;
  expiresAt: Date;
  isVerified?: boolean;
}

interface OTPOptions {
  digits?: boolean;
  lowerCaseAlphabets?: boolean;
  upperCaseAlphabets?: boolean;
  specialChars?: boolean;
}

export { OTP, OTPOptions };