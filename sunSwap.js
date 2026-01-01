// // sunSwapV2.js
// const { TronWeb } = require("tronweb");

// // ============ RPC / TronWeb Setup ============
// const tronWeb = new TronWeb({
//   fullHost: "https://api.trongrid.io",
//   headers: { "TRON-PRO-API-KEY": "dee98b11-05ba-4bef-a7a4-64d26ec38c77" }
// });

// // MUST set a default address for call() and triggerSmartContract
// tronWeb.setAddress("T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb"); // default, replace if needed

// // ============ ADDRESSES ============
// const V2_ROUTER = "TQAvWQpT9H916GckwWDJNhYZvQMkuRL7PN"; // SunSwap V2 Router
// const WTRX = "TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR";
// const USDT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

// // ============ ABIs ============
// const TRC20_ABI = [
//   { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "type": "function" },
//   { "constant": true, "inputs": [{ "name": "who", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" }
// ];

// const V2_ROUTER_ABI = [
//   { "name": "getAmountsOut", "type": "function", "stateMutability": "view",
//     "inputs": [{ "name": "amountIn", "type": "uint256" }, { "name": "path", "type": "address[]" }],
//     "outputs": [{ "name": "amounts", "type": "uint256[]" }]
//   },
//   { "name": "swapExactTokensForTokens", "type": "function",
//     "inputs": [
//       { "name": "amountIn", "type": "uint256" },
//       { "name": "amountOutMin", "type": "uint256" },
//       { "name": "path", "type": "address[]" },
//       { "name": "to", "type": "address" },
//       { "name": "deadline", "type": "uint256" }
//     ]
//   },
//   { "name": "swapExactTRXForTokens", "type": "function",
//     "inputs": [
//       { "name": "amountOutMin", "type": "uint256" },
//       { "name": "path", "type": "address[]" },
//       { "name": "to", "type": "address" },
//       { "name": "deadline", "type": "uint256" }
//     ]
//   },
//   { "name": "swapExactTokensForTRX", "type": "function",
//     "inputs": [
//       { "name": "amountIn", "type": "uint256" },
//       { "name": "amountOutMin", "type": "uint256" },
//       { "name": "path", "type": "address[]" },
//       { "name": "to", "type": "address" },
//       { "name": "deadline", "type": "uint256" }
//     ]
//   }
// ];

// // ============ QUOTE FUNCTION ============
// async function getQuoteV2({ tokenIn, tokenOut, amount }) {
//   console.log("\n📩 Quote Payload:", { tokenIn, tokenOut, amount });

//   if (tokenIn.toUpperCase() === "TRX") tokenIn = WTRX;
//   if (tokenOut.toUpperCase() === "TRX") tokenOut = WTRX;

//   const router = await tronWeb.contract(V2_ROUTER_ABI, V2_ROUTER);
//   const tokenInContract = await tronWeb.contract(TRC20_ABI, tokenIn);
//   const tokenOutContract = await tronWeb.contract(TRC20_ABI, tokenOut);

//   const decimalsIn = Number(await tokenInContract.decimals().call());
//   const decimalsOut = Number(await tokenOutContract.decimals().call());

//   const amountInSun = BigInt(Math.floor(amount * 10 ** decimalsIn));

//   // Multi-hop WTRX intermediate
//   const path = tokenIn === WTRX || tokenOut === WTRX ? [tokenIn, tokenOut] : [tokenIn, WTRX, tokenOut];

//   let amounts = await router.getAmountsOut(amountInSun.toString(), path).call({
//     from: tronWeb.defaultAddress.hex
//   });

//   // Fix commas returned by TronGrid
//   amounts = amounts.map(a => BigInt(a.toString().replace(/,/g, "")));

//   const amountOut = Number(amounts[amounts.length - 1]) / 10 ** decimalsOut;

//   console.log("📤 Quote Response:", {
//     amountIn: amount,
//     amountOut
//   });

//   return amountOut;
// }

// // ============ RAW SWAP TX BUILDER ============
// async function buildSwapTxV2({ from, tokenIn, tokenOut, amount, slippage = 0.01 }) {
//   console.log("\n📩 Swap Payload:", { from, tokenIn, tokenOut, amount });

//   if (tokenIn.toUpperCase() === "TRX") tokenIn = WTRX;
//   if (tokenOut.toUpperCase() === "TRX") tokenOut = WTRX;

//   const router = await tronWeb.contract(V2_ROUTER_ABI, V2_ROUTER);
//   const tokenInContract = await tronWeb.contract(TRC20_ABI, tokenIn);

//   const decimals = Number(await tokenInContract.decimals().call());
//   const amountIn = BigInt(Math.floor(amount * 10 ** decimals));

//   const path = tokenIn === WTRX || tokenOut === WTRX ? [tokenIn, tokenOut] : [tokenIn, WTRX, tokenOut];

//   let amounts = await router.getAmountsOut(amountIn.toString(), path).call({
//     from: tronWeb.defaultAddress.hex
//   });

//   if (!amounts || amounts.length === 0) throw new Error("Invalid router response or missing liquidity");

//   // Safe BigInt parsing
//   const rawAmountOut = amounts[amounts.length - 1].toString().replace(/,/g, "");
//   const amountOut = BigInt(rawAmountOut);
//   const slippageFactor = BigInt(Math.floor((1 - slippage) * 1_000_000)); // scale factor
//   const amountOutMin = (amountOut * slippageFactor) / 1_000_000n;

//   const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);

//   let tx;
//   if (tokenIn === WTRX) {
//     tx = await tronWeb.transactionBuilder.triggerSmartContract(
//       V2_ROUTER,
//       "swapExactTRXForTokens(uint256,address[],address,uint256)",
//       { callValue: amountIn.toString(), feeLimit: 150_000_000 },
//       [
//         { type: "uint256", value: amountOutMin.toString() },
//         { type: "address[]", value: path },
//         { type: "address", value: from },
//         { type: "uint256", value: deadline.toString() }
//       ],
//       from
//     );
//   } else if (tokenOut === WTRX) {
//     tx = await tronWeb.transactionBuilder.triggerSmartContract(
//       V2_ROUTER,
//       "swapExactTokensForTRX(uint256,uint256,address[],address,uint256)",
//       { feeLimit: 150_000_000 },
//       [
//         { type: "uint256", value: amountIn.toString() },
//         { type: "uint256", value: amountOutMin.toString() },
//         { type: "address[]", value: path },
//         { type: "address", value: from },
//         { type: "uint256", value: deadline.toString() }
//       ],
//       from
//     );
//   } else {
//     tx = await tronWeb.transactionBuilder.triggerSmartContract(
//       V2_ROUTER,
//       "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
//       { feeLimit: 150_000_000 },
//       [
//         { type: "uint256", value: amountIn.toString() },
//         { type: "uint256", value: amountOutMin.toString() },
//         { type: "address[]", value: path },
//         { type: "address", value: from },
//         { type: "uint256", value: deadline.toString() }
//       ],
//       from
//     );
//   }

//   console.log("📤 RAW TX BUILT:", { txID: tx.transaction.txID, path });
//   return tx.transaction;
// }
// // ============ CHECK TRC20 BALANCE ============
// async function getTRC20Balance(address, tokenAddress) {
//   try {
//     const tokenContract = await tronWeb.contract(TRC20_ABI, tokenAddress);
//     const decimals = Number(await tokenContract.decimals().call());
//     const balance = await tokenContract.balanceOf(address).call();

//     // Convert from "Sun" to readable amount
//     const amount = Number(balance.toString().replace(/,/g, "")) / 10 ** decimals;
//     console.log(`💰 Balance of ${address}: ${amount} tokens`);
//     return amount;
//   } catch (err) {
//     console.error("❌ Error fetching TRC20 balance:", err);
//   }
// }

// // ============ DEMO BALANCE CHECK ============
// async function checkBalanceDemo() {
//   const myAddress = "TBeZXAdrmjFFANbd92zZLRpZmXVPRHqXY3"; // your wallet
//   await getTRC20Balance(myAddress, USDT);
// }

// // Run balance check demo
// checkBalanceDemo();

// // ============ SIGN & SEND TX ============
// async function sendSwapTx(privateKey, swapTx) {
//   try {
//     const tron = new TronWeb({
//       fullHost: "https://api.trongrid.io",
//       privateKey,
//       headers: { "TRON-PRO-API-KEY": "dee98b11-05ba-4bef-a7a4-64d26ec38c77" }
//     });

//     const signedTx = await tron.trx.sign(swapTx);
//     console.log("📤 Transaction signed successfully");

//     const receipt = await tron.trx.sendRawTransaction(signedTx);
//     console.log("✅ Transaction sent:", receipt.txid || receipt.transaction.txID);

//     return receipt;
//   } catch (err) {
//     console.error("❌ Send Swap TX Error:", err);
//   }
// }

// // ============ DEMO ============
// async function demo() {
//   const USER_ADDRESS = "TBeZXAdrmjFFANbd92zZLRpZmXVPRHqXY3"; // your wallet
//   const PRIVATE_KEY = "YOUR_PRIVATE_KEY_HERE"; // paste your private key

//   // Quote Example
//   await getQuoteV2({ tokenIn: WTRX, tokenOut: USDT, amount: 5 });

//   // Build RAW swap TX
//   const swapTx = await buildSwapTxV2({
//     from: USER_ADDRESS,
//     tokenIn: WTRX,
//     tokenOut: USDT,
//     amount: 0.01,
//     slippage: 0.01
//   });

//   console.log("\n✅ SunSwap V2 ready (Non-custodial)");

//   // Sign & send
//   await sendSwapTx("..........", swapTx);
// }


// demo().catch(console.error);
// ================== SunSwap V3 TRX → USDT ==================

// sunSwapV3_test.js
const { TronWeb } = require("tronweb");

// ================== RPC ==================
const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io",
  headers: { "TRON-PRO-API-KEY": "dee98b11-05ba-4bef-a7a4-64d26ec38c77" }
});

// ================== ADDRESSES ==================
const V3_ROUTER = "TQAvWQpT9H916GckwWDJNhYZvQMkuRL7PN";
const WTRX = "TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR";
const USDT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const TEST_ADDRESS = "TBeZXAdrmjFFANbd92zZLRpZmXVPRHqXY3"; // your address

// ================== ABIs ==================
const TRC20_ABI = [
  { constant: true, name: "decimals", outputs: [{ type: "uint8" }] },
  { constant: true, name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] }
];

const V3_ROUTER_ABI = [
  {
    name: "exactInputSingle",
    type: "function",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" }
        ]
      }
    ]
  }
];

// ================== BALANCE CHECK ==================
async function getUSDTBalance(address) {
  try {
    const usdt = await tronWeb.contract(TRC20_ABI, USDT);
    const decimals = Number(await usdt.decimals().call());
    const bal = await usdt.balanceOf(address).call();
    return Number(bal.toString()) / 10 ** decimals;
  } catch (err) {
    console.error("❌ Balance check error:", err);
    return 0;
  }
}

// ================== SWAP FUNCTION ==================
async function swapTRXtoUSDT(privateKey, trxAmount, slippage = 0.01) {
  const tron = new TronWeb({
    fullHost: "https://api.trongrid.io",
    privateKey
  });

  const router = await tron.contract(V3_ROUTER_ABI, V3_ROUTER);

  const amountIn = BigInt(Math.floor(trxAmount * 1e6)); // TRX → sun

  // Estimate minimal USDT out with slippage
  const estimatedUSDT = BigInt(Math.floor(trxAmount * 0.1 * 1e6));
  const amountOutMin = (estimatedUSDT * BigInt(100 - slippage * 100)) / 100n;

  const deadline = Math.floor(Date.now() / 1000) + 300;

  const paramsTuple = [
    WTRX,                     // tokenIn
    USDT,                     // tokenOut
    3000,                     // fee
    TEST_ADDRESS,             // recipient
    deadline,                 // deadline
    amountIn.toString(),      // amountIn
    amountOutMin.toString(),  // amountOutMinimum
    "0"                       // sqrtPriceLimitX96
  ];

  console.log("🔁 Swapping TRX → USDT (V3)...");

  const tx = await tron.transactionBuilder.triggerSmartContract(
    V3_ROUTER,
    "exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))",
    {
      callValue: amountIn.toString(),
      feeLimit: 500_000_000
    },
    [
      { type: "address", value: paramsTuple[0] },
      { type: "address", value: paramsTuple[1] },
      { type: "uint24", value: paramsTuple[2] },
      { type: "address", value: paramsTuple[3] },
      { type: "uint256", value: paramsTuple[4] },
      { type: "uint256", value: paramsTuple[5] },
      { type: "uint256", value: paramsTuple[6] },
      { type: "uint160", value: paramsTuple[7] }
    ],
    TEST_ADDRESS
  );

  const signed = await tron.trx.sign(tx.transaction);
  const receipt = await tron.trx.sendRawTransaction(signed);

  console.log("✅ Swap TX HASH:", receipt.txid);
  return receipt.txid;
}

// ================== DEMO ==================
(async () => {
  const PRIVATE_KEY = "0b3f52b75f85c840f05cca8e73c9d7c952ae3ee975be86eb0ac9a4bc71755688"; // for testing
  console.log("💰 USDT Before:", await getUSDTBalance(TEST_ADDRESS));

  await swapTRXtoUSDT(PRIVATE_KEY, 0.1); // swap 0.1 TRX

  // wait a bit for indexer
  setTimeout(async () => {
    console.log("💰 USDT After:", await getUSDTBalance(TEST_ADDRESS));
  }, 12000);
})();
