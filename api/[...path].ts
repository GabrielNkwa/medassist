import { createRequestHandler } from "@vercel/node";
import app from "../artifacts/api-server/src/app";

export default createRequestHandler(app);
