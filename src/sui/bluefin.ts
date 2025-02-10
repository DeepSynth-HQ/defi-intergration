import axios from "axios";
import { ITVLPoolResponse } from "./type.js";

export async function getPoolByTVL(range: number) {
  const res = (
    await axios.get("https://swap.api.sui-prod.bluefin.io/api/v1/pools/info")
  ).data as ITVLPoolResponse[];
  const sortedPools = res.sort((a, b) => parseInt(b.tvl) - parseInt(a.tvl));
  const formatedPools = sortedPools.map((pool) => {
    return {
      ...pool,
      tvl: parseInt(pool.tvl),
    };
  });
  return formatedPools.slice(0, range);
}

export async function getAPRByToken(token: string) {
  console.log("find for token: ", token);
  const response = await axios.get(
    "https://swap.api.sui-prod.bluefin.io/api/v1/pools/info"
  );
  const data = (await response.data) as ITVLPoolResponse[];

  const pool = data.find(
    (p) =>
      p.tokenA.info.address.split("::")[2] == token.split("::")[2] ||
      p.tokenB.info.address.split("::")[2] == token.split("::")[2]
  );

  if (pool) {
    return {
      code: 200,
      status: true,
      data: {
        token: token,
        daily: `${pool.day.apr.total}%`,
        Weekly: `${pool.week.apr.total}%`,
        monthly: `${pool.month.apr.total}%`,
      },
    };
  } else {
    return {
      code: 404,
      status: false,
      message: "Token not found",
    };
  }
}
