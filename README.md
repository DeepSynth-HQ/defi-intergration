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

## POST /cetusSwap

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
