import sui = require("@mysten/sui/transactions");
export type ICetusSwap = {
  poolId: string;
  inputAmount: number;
  privateKey: string;
  aToB: boolean;
};

export type IBalanceRequest = {
  address: string;
  coinType: string;
};

export type ICoinResponse = {
  coinType: string;
  coinObjectId: string;
  version: string;
  digest: string;
  balance: string;
  previousTransaction: string;
};

export type SwapArgs = {
  fromCoinType: string;
  toCoinType: string;
  fromAmount?: number;
  toAmount?: number;
  maxSlippage: number;
  txb: sui.Transaction;
};

export type ICreatePool = {
  coinTypeA: string;
  coinTypeB: string;
  poolUri: string;
  privateKey: string;
};
