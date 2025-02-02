import BN from "bn.js";
import {
  adjustForSlippage,
  CalculateRatesResult,
  d,
  Percentage,
  Pool,
} from "@cetusprotocol/cetus-sui-clmm-sdk";
import { createSigner, init } from "./init.js";
import { ICetusSwap } from "./type.js";

// global config

const { client, cetusClmmSDK, a2b, byAmountIn } = init();

export async function preswap(
  pool: Pool,
  inputAmount: number,
  coinADecimals: number,
  coinBDecimals: number
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
    const coinADecimals = await getTokenInfo(pool.coinTypeA);
    const coinBDecimals = await getTokenInfo(pool.coinTypeB);
    if (!coinADecimals || !coinBDecimals) {
      return { code: 400, data: "Error fetching coin info", status: false };
    }

    const scaleInputAmount = param.inputAmount * 10 ** coinBDecimals;
    // check user balance
    const balanceCheckResult = await balanceCheck(
      signer.toSuiAddress(),
      pool.coinTypeB,
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
      coinBDecimals
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
        a2b: a2b,
        by_amount_in: byAmountIn,
        amount: res.amount.toString(),
        amount_limit: amountLimit.toString(),
      });

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
    return -2;
  }
  return 1;
}

async function getTokenInfo(coinType: string) {
  try {
    const metadata = await client.getCoinMetadata({ coinType });
    return metadata?.decimals;
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

// 0xac0f21905ef111da92f7d0e1efc12d14ba17a9798dc6f4e86be9901144b8c84e
// "poolAddress": "0xac0f21905ef111da92f7d0e1efc12d14ba17a9798dc6f4e86be9901144b8c84e",
// "poolType": "0x0c7ae833c220aa73a3643a0d508afa4ac5d50d97312ea4584e35f9eb21b9df12::pool::Pool<0xafcfe86c638c4d94e0765fc76ae849194da9ddddbb64af8b8908d49108c9bf7b::kty::KTY, 0x2::sui::SUI>",
// "coinTypeA": "0xafcfe86c638c4d94e0765fc76ae849194da9ddddbb64af8b8908d49108c9bf7b::kty::KTY",
// "coinTypeB": "0x2::sui::SUI",
// "coinAmountA": "37531202737746483",
// "coinAmountB": "19800000000",

// "poolAddress": "0x876f3e598ee04bd36ce782503b2600c0de19d97d9ebaf8ce97a6b80827bee132",
// "poolType": "0x0c7ae833c220aa73a3643a0d508afa4ac5d50d97312ea4584e35f9eb21b9df12::pool::Pool<0xb753a8ce0013418f366b20100a2befcfbcb3114a649899549282fdd9b7e7f908::earth::EARTH, 0x2::sui::SUI>",
// "coinTypeA": "0xb753a8ce0013418f366b20100a2befcfbcb3114a649899549282fdd9b7e7f908::earth::EARTH",
// "coinTypeB": "0x2::sui::SUI",
// "coinAmountA": "1818181828181770",
// "coinAmountB": "1644182",
