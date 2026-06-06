import { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../artifacts/api-server/dist/app.mjs";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Make sure req and res are compatible with Express
  app(req as any, res as any);
}

