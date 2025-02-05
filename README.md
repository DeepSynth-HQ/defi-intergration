# 🚀Swap API

This project using [Cetus API](https://cetus-1.gitbook.io/cetus-docs) to implement Sui network token swapping
Current network: Testnet

## GET /balance

- Description: Get balance of a token
- Request Params:
  - address (string): user wallet address,
  - coinType (string): coin type, ex: 0xafcfe86c638c4d94e0765fc76ae849194da9ddddbb64af8b8908d49108c9bf7b::kty::KTY, 0x2::sui::SUI.
- Ex: get SUI balance in 0x76d033c1a779f9a7984825a08ba632e97eba6954b1242cd7d87a4c0e261b1f25 wallet
  ```
    http://localhost:3000/balance?address=0x76d033c1a779f9a7984825a08ba632e97eba6954b1242cd7d87a4c0e261b1f25&coinType=0x2::sui::SUI
  ```
  ![image](https://github.com/user-attachments/assets/0a2ee9ae-d4df-4877-bc2c-3711518c5bda)

  
- Error:

  - Invalid token type:

  ```json
  { "code": 400, "data": "Error fetching coin info", "status": false }
  ```

  - Invalid wallet address:

  ```json
    { "code": 400, "data": "Error fetching balance", "status": false };

  ```

## GET /allTokens
- Description: Get all balance of tokens by giving wallet address.
- Request Params:
  - address (string): user wallet address,
- Ex: get balance in 0x76d033c1a779f9a7984825a08ba632e97eba6954b1242cd7d87a4c0e261b1f25 wallet
  ```
    http://localhost:3000/allTokens?address=0x76d033c1a779f9a7984825a08ba632e97eba6954b1242cd7d87a4c0e261b1f25
  ```
- Sample response:
  ```json
    {
    "code": 200,
    "status": true,
    "data": [
        {
            "symbol": "SUI",
            "coinType": "0x2::sui::SUI",
            "coinObjectId": "0x14a3e1c348e3496e8b0cd3b26b53072b80708ef02c76d9fb60bba51fb9554e78",
            "version": "359688066",
            "digest": "5kKjvWrvYw9XsK9pCrynvtfYQj74mMLvgDHkMGhbz37d",
            "balance": 0.094953625,
            "previousTransaction": "C8LCZywDQYbLFHX5Rhz6BxgqzLzGjiyMZjVL5bKnoJtc"
        },
        {
            "symbol": "KTY",
            "coinType": "0xafcfe86c638c4d94e0765fc76ae849194da9ddddbb64af8b8908d49108c9bf7b::kty::KTY",
            "coinObjectId": "0x9b350b663fdb26398df4334c78ae0dac021fe491896f298207caaeda7ed22341",
            "version": "341149980",
            "digest": "7jN1yHkWWNj4zXdbW1SwZwaeQneQLSyqFRVg2NZ5fJXH",
            "balance": 10,
            "previousTransaction": "6bT1LEE7bKeXRxhA4wfifWxpe8GsYR1UFfQDcVej8vPh"
        },
        {
            "symbol": "DEFAI",
            "coinType": "0xca148fddf326b09b1ef3e5fe8e81c2c8568f9e72c0083d651f1652528263a82f::defai::DEFAI",
            "coinObjectId": "0x4f1cca80d92b98af1d2e219c647b6e2b9a2d382a767b07b3ef85e04d6310da02",
            "version": "307127543",
            "digest": "3E9FmwHqxGUrd6U5fJMdyhUVfTjqASg38Wmq2xANppQh",
            "balance": 10000,
            "previousTransaction": "DbtHmRGstoVPSfHZPjyGXSMF5Nak6KpmH5JQeeRgAxDg"
        }
    ]
  }
  ```
- Error:
  - Invalid address:
  ```json
    {
    "code": 401,
    "status": false,
    "data": "Error fetching balance"
  }
  ```

## POST /swap

- Description: Perform a token swap.
- Body Parameters:
  - privateKey(string): User's private key.
  - poolId: The address of pair-token-pool id.
  - inputAmount(number): The address of the output token.
  - aToB (boolean): A pool contain a pair of token: token A and token B, by **True** the transaction will swap coin A -> B, **False** the transaction will swap coin B -> A
- Ex: swap .001SUI -> KITTY

  ```json
  {
    "poolId": "0xac0f21905ef111da92f7d0e1efc12d14ba17a9798dc6f4e86be9901144b8c84e",
    "inputAmount": 0.01,
    "privateKey": "suiprivkey1qp2wz6plr997wyqpd3el4kknt3jq2q096jtcvr4f5h62g9yrztgpsf3vhk0",
    "aToB": false
  }
  ```
  ![image](https://github.com/user-attachments/assets/465f4f84-ae16-42b3-9bf7-7215e7337855)

 

- Error:

  - Pool id is not valid

    ```json
    { "code": 400, "message": "Error fetching coin info", "status": false }
    ```

    ```json
    {
      "code": 401,
      "message": "Pool not found",
      "status": false
    }
    ```

  - Do not have enough balance
    ```json
    { "code": 400, "message": "Insufficient balance", "status": false }
    ```
  - Wrong user wallet address:
    ```json
    { "code": 400, "message": "Error fetching coin info", "status": false };
    ```

## 📂 Project Structure

- `src/sui/init.ts` : Init the wallet and keypair by giving private key
- `src/sui/cetos.ts` : Cetos Swap implementation
- `src/sui/type.ts` : Types
- `src/index.ts`
