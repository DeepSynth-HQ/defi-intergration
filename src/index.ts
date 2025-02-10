import cors from "cors";
import express from "express";
import dotenv from "dotenv";

import {
  IAddLiquidity,
  IBalanceRequest,
  ICetusSwap,
  ICreatePool,
  ITransferRequest,
} from "./sui/type.js";
import {
  addLiquidity,
  cetusSwap,
  createClmmPool,
  getPoolInfo,
  getPools,
  getTokenInfoByName,
  getUsdcPool,
  getUserBalance,
  getWalletBalances,
} from "./sui/cetus.js";
import {
  createAccount, restoreAccount
} from "./sui/init.js";
import { getPoolByTVL } from "./sui/bluefin.js";
import { getAPRByToken, getPoolByTVL } from "./sui/bluefin.js";
import { transfer } from "./sui/sui.js";
import { NaViIntergration } from "./sui/navi.js";

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

app.post("/createAccount", async (_req, res) => {
  try {
    const result = await createAccount();
    if (!result) {
      res.send({ code: 400, data: "Failed to create account", status: false });
      return;
    }
    res.send({ code: 200, data: result, status: true });
  } catch (e) {
    res.send({ code: 500, data: "Error creating account", status: false });
  }
});


app.post("/restoreAccount", async (_req, res) => {
  try {
    const privateKey = _req.body.privateKey;
    if (!privateKey) {
      res.send({ code: 400, data: "Private key is required", status: false });
      return;
    }
    const result = await restoreAccount(privateKey);
    if (!result) {
      res.send({ code: 400, data: "Failed to restore account", status: false });
      return;
    }
    res.send({ code: 200, data: result, status: true });
  } catch (e) {
    res.send({ code: 500, data: "Error restoring account", status: false });
  }
});




app.get("/tokensByName", async (_req, res) => {
  const result = await getTokenInfoByName((_req.query.name as string) || "SUI");
  res.send(result);
});

app.get("/getPool", async (_req, res) => {
  const result = await getPools(
    _req.query.coinA as string,
    _req.query.coinB as string
  );
  res.send(result);
});

app.get("/poolInfo", async (_req, res) => {
  const result = await getPoolInfo(_req.query.poolId as string);
  res.send(result);
});

app.post("/createPool", async (_req, res) => {
  try {
    const body = _req.body as ICreatePool;
    const result = await createClmmPool(body);
    res.send(result);
  } catch (e) {
    res.send({ code: 401, data: "Invalid Params fetch blance", status: false });
  }
});

app.post("/addLiquidity", async (_req, res) => {
  try {
    const body = _req.body as IAddLiquidity;
    const result = await addLiquidity(body);
    res.send(result);
  } catch (e) {
    res.send({ code: 400, data: "Invalid params", status: false });
  }
});

app.get("/getPoolByTVL", async (_req, res) => {
  const range = _req.query.range as string;
  if (!range) {
    res.send({ code: 400, data: "Invalid params", status: false });
  }
  const resu = await getPoolByTVL(parseInt(range));
  res.send(resu);
});

app.get("/getAPRByToken", async (_req, res) => {
  const result = await getAPRByToken(_req.query.token as string);
  res.send(result);
});

app.post("/transfer", async (_req, res) => {
  const body = _req.body as ITransferRequest;
  const result = await transfer(body);
  res.send(result);
});

app.get("/navi", async (_req, res) => {
  const navi = new NaViIntergration("testnet");
  const result = await navi.getPool("SUI", "privateKey");
  res.send(result);
});

app.listen(3000, () => {
  console.log(`REST API is listening on port: ${3000}.`);
});
