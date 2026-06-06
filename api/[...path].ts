import { createRequestHandler } from "@vercel/node";
import app from "../artifacts/api-server/dist/app.mjs";

export default createRequestHandler(app);
