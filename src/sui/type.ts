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
