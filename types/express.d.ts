import type { TokenPayload } from "../middlewares/auth.middleware";

declare global {
  namespace Express {
    interface User extends TokenPayload {}
    interface Request {
      user?: User;
    }
  }
}

export {};
