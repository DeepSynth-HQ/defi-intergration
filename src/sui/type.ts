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
