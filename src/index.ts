import cors from "cors";
import express from "express";
import dotenv from "dotenv";

import { ICetusSwap } from "./sui/type.js";
import { cetusSwap } from "./sui/cetus.js";

//init keypair

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json({ limit: "10mb" }));
app.post("/cetusSwap", async (_req, res) => {
  const body: ICetusSwap = _req.body;
  const result = await cetusSwap(body);
  res.send(result);
});

app.listen(3000, () => {
  console.log(`REST API is listening on port: ${3000}.`);
});
