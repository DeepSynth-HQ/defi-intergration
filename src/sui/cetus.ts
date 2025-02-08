import BN from "bn.js";
import {
  adjustForSlippage,
  CalculateRatesResult,
  d,
  Percentage,
  Pool,
  ClmmPoolUtil,
  TickMath,
  toDecimalsAmount,
  adjustForCoinSlippage,
  AddLiquidityParams,
  printTransaction,
} from "@cetusprotocol/cetus-sui-clmm-sdk";
import { createSigner, init } from "./init.js";
import { ICetusSwap, ICoinResponse, ICreatePool } from "./type.js";
import { stat } from "fs";

// global config

const { client, cetusClmmSDK, byAmountIn } = init();
const SOL_ADDRESS = "";
export async function preswap(
  pool: Pool,
  inputAmount: number,
  coinADecimals: number,
  coinBDecimals: number,
  a2b: boolean
): Promise<CalculateRatesResult> {
  const amount = new BN(inputAmount);

  const swapTicks = await cetusClmmSDK.Pool.fetchTicks({
    pool_id: pool.poolAddress,
    coinTypeA: pool.coinTypeA,
    coinTypeB: pool.coinTypeB,
  });

  const res = cetusClmmSDK.Swap.calculateRates({
    decimalsA: coinADecimals,
    decimalsB: coinBDecimals,
    a2b,
    byAmountIn,
    amount,
    swapTicks,
    currentPool: pool,
  });
  console.log(res);
  return res;
}

export async function cetusSwap(param: ICetusSwap) {
  //get signer
  const signer = createSigner(param.privateKey);
  if (!signer) {
    return {
      code: 400,
      data: "Private key is invalid",
      status: false,
    };
  }
  try {
    //get poll
    const pool = await cetusClmmSDK.Pool.getPool(param.poolId);
    // create slippage
    const slippage = Percentage.fromDecimal(d(5));
    // get the decimals
    const coinADecimals = (await getTokenInfo(pool.coinTypeA))?.decimals;
    const coinBDecimals = (await getTokenInfo(pool.coinTypeB))?.decimals;
    if (!coinADecimals || !coinBDecimals) {
      return { code: 400, data: "Error fetching coin info", status: false };
    }

    const scaleInputAmount =
      param.inputAmount * 10 ** (param.aToB ? coinADecimals : coinBDecimals); // update
    // check user balance
    const balanceCheckResult = await balanceCheck(
      signer.toSuiAddress(),
      param.aToB ? pool.coinTypeA : pool.coinTypeB, //update
      scaleInputAmount
    );
    if (balanceCheckResult === -1) {
      return { code: 400, message: "Error fetching balance", status: false };
    }
    if (balanceCheckResult === -2) {
      return { code: 400, message: "Insufficient balance", status: false };
    }
    // get the preswap calculation
    const res = await preswap(
      pool,
      scaleInputAmount,
      coinADecimals,
      coinBDecimals,
      param.aToB
    );
    // get the amount limit
    const toAmount = byAmountIn
      ? res.estimatedAmountOut
      : res.estimatedAmountIn;
    const amountLimit = adjustForSlippage(toAmount, slippage, !byAmountIn);
    // set the sender address
    cetusClmmSDK.senderAddress = signer.toSuiAddress();
    const { tx, coinABs } =
      await cetusClmmSDK.Swap.createSwapTransactionWithoutTransferCoinsPayload({
        pool_id: pool.poolAddress,
        coinTypeA: pool.coinTypeA,
        coinTypeB: pool.coinTypeB,
        a2b: param.aToB,
        by_amount_in: byAmountIn,
        amount: res.amount.toString(),
        amount_limit: amountLimit.toString(),
      });
    tx.setGasBudget(500000000);
    try {
      await tx.transferObjects(
        [coinABs[0], coinABs[1]],
        // send coin to user
        tx.pure.address(signer.toSuiAddress())
      );
      const transferTxn = await cetusClmmSDK.fullClient.sendTransaction(
        signer,
        tx
      );
      console.log("digest: ", transferTxn?.digest);
      return {
        code: 200,
        status: true,
        data: `Swap token successfully!, Digest: ${transferTxn?.digest}`,
      };
    } catch (e) {
      return {
        code: 400,
        message: "Failed to sign transaction",
        status: false,
      };
    }
  } catch (error) {
    return {
      code: 401,
      message: "Pool not found",
      status: false,
    };
  }
}

async function balanceCheck(
  address: string,
  coinType: string,
  inputAMount: number
) {
  const balance = await getTokenBalance(address, coinType);
  if (!balance) {
    return -1;
  }
  if (parseInt(balance) < inputAMount) {
    console.log(balance, inputAMount);
    return -2;
  }
  return 1;
}

async function getTokenInfo(coinType: string) {
  try {
    const metadata = await client.getCoinMetadata({ coinType });
    return metadata;
  } catch (error) {
    return null;
  }
}

async function getTokenBalance(walletAddress: string, coinType: string) {
  console.log(walletAddress, coinType);
  try {
    const balance = await client.getBalance({ owner: walletAddress, coinType });
    return balance.totalBalance;
  } catch (error) {
    return null;
  }
}

export async function getUserBalance(address: string, coinType: string) {
  try {
    const tokenInfo = await getTokenInfo(coinType);
    if (!tokenInfo)
      return { code: 400, data: "Error fetching coin info", status: false };
    const balance = await getTokenBalance(address, coinType);
    if (!balance)
      return { code: 400, data: "Error fetching balance", status: false };
    return {
      code: 200,
      data: `Balance: ${parseFloat(balance) / 10 ** tokenInfo.decimals}`,
      status: true,
    };
  } catch (error) {
    return { code: 400, data: "Error fetching balance", status: false };
  }
}

export async function getWalletBalances(address: string) {
  try {
    const balance = await client.getAllCoins({ owner: address });
    const validCoins = balance.data
      .map((coin: ICoinResponse) =>
        parseFloat(coin.balance) > 0 ? coin : null
      )
      .filter((coin) => coin !== null);
    const formatedCoins = await Promise.all(
      validCoins.map(async (coin) => {
        if (!coin) return null;
        const tokenInfo = await getTokenInfo(coin.coinType);
        if (!tokenInfo || !coin.balance) return null;
        return {
          symbol: tokenInfo.symbol,
          ...coin,
          balance: parseFloat(coin.balance) / 10 ** tokenInfo.decimals,
        };
      })
    );
    return { code: 200, status: true, data: formatedCoins };
  } catch (error) {
    return { code: 401, status: false, data: "Error fetching balance" };
  }
}

export async function getTokenInfoByName(name: string) {
  try {
    let tokens: string[] = [];
    const tokenInfo = await cetusClmmSDK.Pool.getPoolsWithPage();
    tokenInfo.forEach((pool) => {
      if (pool.coinTypeA.split("::")[2] == name)
        if (!tokens.find((token) => token === pool.coinTypeA))
          tokens.push(pool.coinTypeA);
      if (pool.coinTypeB.split("::")[2] == name)
        if (!tokens.find((token) => token === pool.coinTypeB))
          tokens.push(pool.coinTypeB);
    });
    if (tokens.length === 0)
      return { code: 400, data: "Token not found", status: false };
    return { code: 200, data: tokens, status: true };
  } catch (error) {
    return { code: 400, data: "Error fetching token info", status: false };
  }
}

export async function getUsdcPool(name: string) {}

export async function getPools(coinA: string, coinB: string) {
  try {
    let pools: Pool[] = [];
    const tokenInfo = await cetusClmmSDK.Pool.getPoolsWithPage();
    console.log(coinA, coinB);
    tokenInfo.forEach((pool) => {
      if (
        (pool.coinTypeA.split("::")[2] == coinA &&
          pool.coinTypeB.split("::")[2] == coinB) ||
        (pool.coinTypeA.split("::")[2] == coinB &&
          pool.coinTypeB.split("::")[2] == coinA)
      )
        pools.push(pool);
    });
    console.log("-----");
    pools.sort((a, b) => {
      return b.liquidity - a.liquidity;
    });
    console.log("-----");
    if (pools.length === 0)
      return { code: 400, data: "Pool not found", status: false };
    const resPool = pools[0];
    console.log("-----");

    return {
      code: 200,
      data: {
        poolAddress: resPool.poolAddress,
        coinTypeA: resPool.coinTypeA,
        coinTypeB: resPool.coinTypeB,
        coinAmountA: resPool.coinAmountA,
        coinAmountB: resPool.coinAmountB,
        liquidity: resPool.liquidity,
      },
      status: true,
    };
  } catch (error) {
    console.log("error", error);
    return { code: 400, data: "Error fetching token info", status: false };
  }
}

export async function createClmmPool(params: ICreatePool) {
  const signer = createSigner(params.privateKey);
  if (!signer)
    return { code: 400, data: "Private key is invalid", status: false };
  try {
    // initialize sqrt_price
    const initialize_sqrt_price = TickMath.priceToSqrtPriceX64(
      d(1.2),
      6,
      6
    ).toString();
    const tick_spacing = 2;
    const current_tick_index = TickMath.sqrtPriceX64ToTickIndex(
      new BN(initialize_sqrt_price)
    );
    // build tick range
    const tick_lower = TickMath.getPrevInitializableTickIndex(
      new BN(current_tick_index).toNumber(),
      new BN(tick_spacing).toNumber()
    );
    const tick_upper = TickMath.getNextInitializableTickIndex(
      new BN(current_tick_index).toNumber(),
      new BN(tick_spacing).toNumber()
    );
    // input token amount
    const fix_coin_amount = new BN(200);
    // input token amount is token a
    const fix_amount_a = true;
    // slippage value 0.05 means 5%
    const slippage = 0.05;
    const cur_sqrt_price = new BN(initialize_sqrt_price);
    // Estimate liquidity and token amount from one amounts
    const liquidityInput = ClmmPoolUtil.estLiquidityAndcoinAmountFromOneAmounts(
      tick_lower,
      tick_upper,
      fix_coin_amount,
      fix_amount_a,
      true,
      slippage,
      cur_sqrt_price
    );
    console.log("liquidityInput: ", liquidityInput);
    // Estimate  token a and token b amount
    const amount_a = fix_amount_a
      ? fix_coin_amount.toNumber()
      : liquidityInput.tokenMaxA.toNumber();
    const amount_b = fix_amount_a
      ? liquidityInput.tokenMaxB.toNumber()
      : fix_coin_amount.toNumber();

    //valiudate cointtype
    try {
      const coinAMetadata = await client.getCoinMetadata({
        coinType: params.coinTypeA,
      });
      const coinBMetadata = await client.getCoinMetadata({
        coinType: params.coinTypeB,
      });
      if (!coinAMetadata || !coinBMetadata) {
        return { code: 400, data: "Token type is not valid", status: false };
      }
    } catch (e) {
      return { code: 400, data: "Token type is not valid", status: false };
    }
    const coinMetadataA = await client.getCoinMetadata({
      coinType: params.coinTypeA,
    });
    const coinMetadataB = await client.getCoinMetadata({
      coinType: params.coinTypeB,
    });
    cetusClmmSDK.senderAddress = signer.toSuiAddress();

    const coinMetadataAID = coinMetadataA?.id;
    const coinMetadataBID = coinMetadataB?.id;
    const creatPoolPayload =
      await cetusClmmSDK.Pool.createPoolTransactionPayload({
        coinTypeA: params.coinTypeA,
        coinTypeB: params.coinTypeB,
        tick_spacing: tick_spacing,
        initialize_sqrt_price: initialize_sqrt_price,
        uri: params.poolUri,
        amount_a,
        slippage,
        amount_b,
        fix_amount_a,
        tick_lower,
        tick_upper,
        metadata_a: coinMetadataAID || "",
        metadata_b: coinMetadataBID || "",
      });
    const res = await cetusClmmSDK.fullClient.sendTransaction(
      signer,
      creatPoolPayload
    );
    if (!res) {
      return { code: 400, data: "Error creating pool", status: false };
    }
    return {
      code: 200,
      data: {
        digest: res?.digest,
        poolInfo: res?.events ? res?.events[0]?.parsedJson : {},
      },
      status: true,
    };
  } catch (e) {
    return { code: 400, data: e, status: false };
  }
}

export async function getPoolInfo(poolId: string) {
  try {
    const pool = await cetusClmmSDK.Pool.getPool(poolId);
    return {
      code: 200,
      data: {
        poolAddress: pool.poolAddress,
        coinTypeA: pool.coinTypeA,
        coinTypeB: pool.coinTypeB,
        coinAmountA: pool.coinAmountA,
        coinAmountB: pool.coinAmountB,
        liquidity: pool.liquidity,
      },
      status: true,
    };
  } catch (error) {
    return { code: 400, data: "Error fetching pool info", status: false };
  }
}

export async function addLiquidity(poolId: string, privateKey: string) {
  const pool = await cetusClmmSDK.Pool.getPool(poolId);
  if (!pool) return { code: 400, data: "Pool not found", status: false };
  const curSqrtPrice = new BN(pool.current_sqrt_price);
  const tickLower =
    Math.floor(
      pool.current_tick_index / parseInt(pool.tickSpacing.toString())
    ) *
      parseInt(pool.tickSpacing.toString()) -
    10;
  const tickUpper =
    Math.floor(
      pool.current_tick_index / parseInt(pool.tickSpacing.toString())
    ) *
      parseInt(pool.tickSpacing.toString()) +
    10;
  const slippageTolerance = new Percentage(new BN(5), new BN(100));

  const totalAmount = "2";
  //simulate token price
  const tokenPriceA = "1.1";
  const tokenPriceB = "1";

  try {
    const coinAmounts = ClmmPoolUtil.estCoinAmountsFromTotalAmount(
      tickLower,
      tickUpper,
      curSqrtPrice,
      totalAmount,
      tokenPriceA,
      tokenPriceB
    );
    const coinADecimals =
      pool.coinTypeA == SOL_ADDRESS
        ? 9
        : (await getTokenInfo(pool.coinTypeA))?.decimals || 6;
    const coinBDecimals =
      pool.coinTypeB == SOL_ADDRESS
        ? 9
        : (await getTokenInfo(pool.coinTypeA))?.decimals || 6;
    const amountA = parseInt(
      coinAmounts.amountA.mul(10 ** coinADecimals).toString()
    );
    const amountB = parseInt(
      coinAmounts.amountB.mul(10 ** coinBDecimals).toString()
    );

    const tokenAmounts = {
      coinA: new BN(amountA.toString()),
      coinB: new BN(amountB.toString()),
    };
    const liquidity = ClmmPoolUtil.estimateLiquidityFromcoinAmounts(
      curSqrtPrice,
      tickLower,
      tickUpper,
      tokenAmounts
    );

    const { tokenMaxA, tokenMaxB } = adjustForCoinSlippage(
      tokenAmounts,
      slippageTolerance,
      true
    );
    const addLiquidityPayloadParams: AddLiquidityParams = {
      coinTypeA: pool.coinTypeA,
      coinTypeB: pool.coinTypeB,
      pool_id: pool.poolAddress,
      tick_lower: tickLower.toString(),
      tick_upper: tickUpper.toString(),
      delta_liquidity: liquidity.toString(),
      max_amount_a: tokenMaxA.toString(),
      max_amount_b: tokenMaxB.toString(),
      pos_id: "",
      rewarder_coin_types: [],
      collect_fee: false,
    };

    try {
      const signer = createSigner(privateKey);
      if (!signer) {
        return { code: 400, data: "Private key is invalid", status: false };
      }
      const balance = await getTokenBalance(
        signer.toSuiAddress(),
        pool.coinTypeA
      );

      const balance2 = await getTokenBalance(
        signer.toSuiAddress(),
        pool.coinTypeB
      );
      console.log("balance", balance, balance2, amountA, amountB);

      cetusClmmSDK.senderAddress = signer.toSuiAddress();
      const payload = await cetusClmmSDK.Position.createAddLiquidityPayload(
        addLiquidityPayloadParams
      );
      // console.log("trx");
      // await printTransaction(payload);

      const transferTxn = await cetusClmmSDK.fullClient.sendTransaction(
        signer,
        payload
      );

      console.log("createAddLiquidityPayload: ", transferTxn);

      return { code: 200, data: transferTxn || "undefined", status: true };
    } catch (e) {
      console.log(e);
      return { code: 400, data: "Failed to sign transaction", status: false };
    }
  } catch (e) {
    console.log(e);
    return e;
  }
}
