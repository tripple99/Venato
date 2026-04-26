import { z } from "zod";
import { AuthRole } from "../auths/auth.interface";

const createUser = z.object({
  email: z.string().email("Invalid email address"),
  fullname: z.string().min(2, "Fullname must be at least 2 characters"),
  role: z.nativeEnum(AuthRole).default(AuthRole.User),
});

export default {
  createUser,
};
