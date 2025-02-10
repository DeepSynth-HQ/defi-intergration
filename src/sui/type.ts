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

export type IAddLiquidity = {
  poolId: string;
  privateKey: string;
  totalAmount: number;
};

export type ITVLPoolResponse = {
  address: string;
  config: {
    defaultRange: string;
    defaultRangePoint: string[];
    tickSpacing: number;
  };
  day: {
    apr: {
      feeApr: string;
      rewardApr: string;
      total: string;
    };
    fee: string;
    priceMax: string;
    priceMin: string;
    volume: string;
    volumeQuoteQty: string;
  };
  feeRate: string;
  month: {
    apr: {
      feeApr: string;
      rewardApr: string;
      total: string;
    };
    fee: string;
    priceMax: string;
    priceMin: string;
    volume: string;
    volumeQuoteQty: string;
  };
  price: string;
  rewards: {
    dailyRewards: string;
    dailyRewardsUsd: string;
    endTime: string;
    perSecondRewards: string;
    token: {
      address: string;
      circulatingSupply: string;
      decimals: number;
      hasBluefinPools: boolean;
      isVerified: boolean;
      logoURI: string;
      name: string;
      rfqSupported: boolean;
      symbol: string;
      totalSupply: string;
    };
    totalReward: string;
  }[];
  symbol: string;
  tags: string[];
  tokenA: {
    amount: string;
    info: {
      address: string;
      circulatingSupply: string;
      decimals: number;
      hasBluefinPools: boolean;
      isVerified: boolean;
      logoURI: string;
      name: string;
      rfqSupported: boolean;
      symbol: string;
      totalSupply: string;
    };
  };
  tokenB: {
    amount: string;
    info: {
      address: string;
      circulatingSupply: string;
      decimals: number;
      hasBluefinPools: boolean;
      isVerified: boolean;
      logoURI: string;
      name: string;
      rfqSupported: boolean;
      symbol: string;
      totalSupply: string;
    };
  };
  totalApr: string;
  tvl: string;
  verified: boolean;
  week: {
    apr: {
      feeApr: string;
      rewardApr: string;
      total: string;
    };
    fee: string;
    priceMax: string;
    priceMin: string;
    volume: string;
    volumeQuoteQty: string;
  };
};

export type ITransferRequest = {
  privateKey: string;
  to: string;
  token: string;
  amount: number;
};
