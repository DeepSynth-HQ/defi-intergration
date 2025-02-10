import { initCetusSDK } from "@cetusprotocol/cetus-sui-clmm-sdk";
import { SuiClient } from "@mysten/sui/client";
import ed25519 = require("@mysten/sui/keypairs/ed25519");
import { NETWORK } from "./constants.js";

const { Ed25519Keypair } = ed25519;

export function init() {
  const client = new SuiClient({ url: `https://fullnode.${NETWORK}.sui.io` });
  const cetusClmmSDK = initCetusSDK({ network: NETWORK });
  // transaction will convert from B to A
  const a2b = false;
  //  input amount is coin B
  const byAmountIn = true;
  return { client, cetusClmmSDK, a2b, byAmountIn };
}

export async function createAccount() {
  try {
    const keypair = new Ed25519Keypair();

    return {
      address: keypair.toSuiAddress(),
      publicKey: keypair.getPublicKey().toBase64(),
      privateKey: keypair.getSecretKey(),
    };
  } catch (e) {
    return null;
  }
}

export async function restoreAccount(privateKey: string) {
  try {
    const keypair = Ed25519Keypair.fromSecretKey(privateKey);
    return {
      address: keypair.toSuiAddress(),
      publicKey: keypair.getPublicKey().toBase64(),
    };
  } catch (e) {
    return null;
  }
}

export function createSigner(privateKey: string) {
  try {
    const signer = Ed25519Keypair.fromSecretKey(privateKey);
    return signer;
  } catch (e) {
    return null;
  }
}
// suiprivkey1qp2wz6plr997wyqpd3el4kknt3jq2q096jtcvr4f5h62g9yrztgpsf3vhk0
// pool 0xac0f21905ef111da92f7d0e1efc12d14ba17a9798dc6f4e86be9901144b8c84e
