import { decodeSuiPrivateKey } from "@mysten/sui.js/cryptography";
import { NAVISDKClient } from "navi-sdk";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { sign } from "crypto";

export class NaViIntergration {
  public network: string;

  constructor(network: string) {
    this.network = network;
  }

  public async getPool(tokenName: string, privateKey: string) {
    // Use an existing mnemonic or leave empty to generate a new one
    const client = new NAVISDKClient({
      networkType: this.network,
    });
    return client;
  }
}
