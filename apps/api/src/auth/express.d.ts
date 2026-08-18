// Augments Express's Request type so `requireAuth` can attach the signed-in
// user's ID for downstream handlers without an `as` cast at every call site.
import "express";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}
