import cors from "cors";
import express from "express";
import dotenv from "dotenv";

import { IBalanceRequest, ICetusSwap } from "./sui/type.js";
import {
  cetusSwap,
  getTokenInfoByName,
  getUserBalance,
  getWalletBalances,
} from "./sui/cetus.js";

//init keypair

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json({ limit: "10mb" }));
app.post("/swap", async (_req, res) => {
  const body: ICetusSwap = _req.body;
  const result = await cetusSwap(body);
  res.send(result);
});

app.get("/balance", async (_req, res) => {
  try {
    const params: IBalanceRequest = {
      address: _req.query.address as string,
      coinType: _req.query.coinType as string,
    };
    if (!params.address || !params.coinType) {
      res.send({ code: 400, data: "Invalid params", status: false });
    }
    console.log(params);

    const result = await getUserBalance(params.address, params.coinType);
    res.send(result);
  } catch (e) {
    res.send({ code: 500, data: "Error when fetch blance", status: false });
  }
});

app.get("/allTokens", async (_req, res) => {
  const result = await getWalletBalances((_req.query.address as string) || "s");
  res.send(result);
});

app.get("/tokenByName", async (_req, res) => {
  const result = await getTokenInfoByName((_req.query.name as string) || "SUI");
  res.send(result);
});

app.listen(3000, () => {
  console.log(`REST API is listening on port: ${3000}.`);
});
