# 🚀Swap API

This project using [Cetus API](https://cetus-1.gitbook.io/cetus-docs) to implement Sui network token swapping
Current network: Testnet

***🗒️Note:***
A pool contain a pair of token: token A and token B, by default the transaction will swap coin B -> A


## POST /cetusSwap

- Description: Perform a token swap.
- Body Parameters:
  - privateKey(string): User's private key.
  - poolId: The address of pair-token-pool id.
  - inputAmount(number): The address of the output token.
- Ex: swap .001SUI -> KITTY
  ```json
  {
    "poolId": "0xac0f21905ef111da92f7d0e1efc12d14ba17a9798dc6f4e86be9901144b8c84e",
    "inputAmount": 0.001,
    "privateKey": "suiprivkey1qp2wz6plr997wyqpd3el4kknt3jq2q096jtcvr4f5h62g9yrztgpsf3vhk0"
  }
  ```
  ![image](https://github.com/user-attachments/assets/5a9a448f-28f0-43de-a5b2-2e88b5efade0)

- Error:
  - Pool id is not valid
    ```json
      { "code": 400, "message": "Error fetching coin info", "status": false }
    ```
    ```json
    {
        "code": 401, "message": "Pool not found", "status": false,
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
