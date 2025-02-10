import { TransactionBlock } from "@mysten/sui.js/transactions";
import { ITransferRequest } from "./type.js";
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { decodeSuiPrivateKey } from "@mysten/sui.js/cryptography";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { getTokenInfo, getWalletBalances } from "./cetus.js";

const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });

export async function transfer(param: ITransferRequest) {
  try {
    const key = decodeSuiPrivateKey(param.privateKey);
    const signer = Ed25519Keypair.fromSecretKey(key.secretKey);
    if (!signer)
      return { code: 400, data: "Private key is invalid", status: false };
    // get token objects
    const coins = await getWalletBalances(signer.toSuiAddress());
    if (typeof coins.data == "string")
      return { code: 400, data: coins.data, status: false };
    const transferToken = coins.data.find(
      // @ts-ignore
      (coin) => coin.coinType === param.token
    );
    if (!transferToken)
      return { code: 400, data: "Token not found", status: false };
    console.log(transferToken);

    // check balance
    // @ts-ignore
    if (transferToken.balance < param.amount) {
      return { code: 400, data: "Insufficient balance", status: false };
    }
    const tokenInfo = await getTokenInfo(param.token);
    if (!tokenInfo)
      return { code: 400, data: "Token not found", status: false };

    const scaledAmount = param.amount * 10 ** tokenInfo.decimals;
    const txb = new TransactionBlock();
    txb.setGasBudget(500000000);
    // @ts-ignore
    const splitCoint = txb.splitCoins(txb.object(transferToken.coinObjectId), [
      scaledAmount,
    ]);
    txb.transferObjects([splitCoint], txb.pure(param.to));
    const result = await suiClient.signAndExecuteTransactionBlock({
      signer,
      transactionBlock: txb,
    });
    const transactionResponse = await suiClient.waitForTransactionBlock({
      digest: result.digest,
    });
    console.log(transactionResponse);
    return { code: 200, data: transactionResponse, status: true };
  } catch (e) {
    // @ts-ignore
    return { code: 401, data: e.message, status: false };
  }
}

async function getTokenObjects(coinType: string, address: string) {
  const coins = await suiClient.getCoins({ owner: address, coinType });
  return coins.data;
}
