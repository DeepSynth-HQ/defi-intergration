import { decodeSuiPrivateKey } from "@mysten/sui.js/cryptography";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import {
  NAVISDKClient,
  USDT,
  Sui,
  flashloan,
  nUSDC,
  repayFlashLoan,
  SignAndSubmitTXB,
} from "navi-sdk";
import { sign } from "crypto";
import { Transaction } from "@mysten/sui/transactions";
import { CoinInfo, PoolConfig } from "navi-sdk/dist/types/index.js";
import { pool } from "navi-sdk/dist/address.js";

export class NaViIntergration {
  public network: string;

  constructor(network: string) {
    this.network = network;
  }

  public async fashloanSui(amount: number, mnemonic: string) {
    // Use an existing mnemonic or leave empty to generate a new one
    const client = new NAVISDKClient({
      networkType: this.network,
      mnemonic: mnemonic,
    });

    const tx = new Transaction();
    const account = client.accounts[0];
    const sender = account.address;

    console.log("Sender Address:", sender);
    tx.setSender(sender);

    try {
      // Fetch the coin object for the account
      const sourceTokenObjAddress = await account.getCoins(Sui);
      const coinObjects = sourceTokenObjAddress.data || [];
      if (coinObjects.length === 0) {
        throw new Error(`No coin objects found for ${Sui.symbol}`);
      }
      const sourceTokenObj = tx.object(coinObjects[0].coinObjectId);

      // Retrieve loan pool configuration
      const loanPoolConfig: PoolConfig =
        // @ts-ignore
        pool[this.CONFIG.toBorrowCoin.symbol as keyof Pool];
      console.log("Loan Pool Configuration:", loanPoolConfig);

      // Calculate the amount to borrow in smallest units (wei-like units)
      const borrowAmountInWei = amount * 10 ** Sui.decimal;

      // Execute flashloan and get the borrowed balance
      const [borrowedBalance, receipt] = await flashloan(
        // @ts-ignore
        tx,
        loanPoolConfig,
        borrowAmountInWei
      );

      const flashCoin = tx.moveCall({
        target: "0x2::coin::from_balance",
        arguments: [borrowedBalance],
        typeArguments: [loanPoolConfig.type],
      });

      // Merge borrowed funds with the wallet balance
      tx.mergeCoins(sourceTokenObj, [flashCoin]);

      // Prepare repayment balance
      const repayBalance = tx.moveCall({
        target: "0x2::coin::into_balance",
        arguments: [sourceTokenObj],
        typeArguments: [loanPoolConfig.type],
      });

      // Repay the flashloan
      const [remainingBalance] = await repayFlashLoan(
        // @ts-ignore
        tx,
        loanPoolConfig,
        receipt,
        repayBalance
      );

      // create a coin object from the remaining balance
      const extraCoin = tx.moveCall({
        target: "0x2::coin::from_balance",
        arguments: [remainingBalance],
        typeArguments: [loanPoolConfig.type],
      });

      // Transfer remaining funds back to the wallet
      tx.transferObjects([extraCoin], sender);

      // Sign and submit the transaction
      const result = await SignAndSubmitTXB(
        // @ts-ignore
        tx,
        account.client,
        account.keypair
      );
      console.log("Transaction Result:", result);
    } catch (error) {
      console.error("Error during flashloan execution:", error);
    }
  }
}
