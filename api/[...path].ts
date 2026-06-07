import { type VercelRequest, type VercelResponse } from "@vercel/node";
import express from "express";
import cors from "cors";
import router from "../artifacts/api-server/src/routes";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", router);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel will handle the request
  return app(req, res);
}
