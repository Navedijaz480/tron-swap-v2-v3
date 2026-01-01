TRON SunSwap V2 & V3 Swap Scripts
Overview

This project provides Node.js scripts to interact with the TRON blockchain using TronWeb, supporting:

Checking TRC20 token balances (e.g., USDT).

Swapping TRX → USDT using SunSwap V2 and V3 Routers.

Handling swaps with proper slippage, deadline, and router approval.

This project is for testing and development purposes only. Users should handle private keys securely.

Table of Contents

Prerequisites

Installation

V2 Swap & Balance Script

V3 Swap Script

Usage

Known Issues & Fixes

Example

Prerequisites

Node.js ≥ v18

npm or yarn

TronWeb npm package

TronGrid API Key (for node access)

TRON wallet with TRX and/or TRC20 tokens

Installation
# Clone the project or create a new folder
cd swap-scripts
npm init -y

# Install TronWeb
npm install tronweb


Create a .env file (optional) to store sensitive info:

TRON_API_KEY=your_trongrid_api_key
PRIVATE_KEY=your_wallet_private_key

V2 Swap & Balance Script

File: sunSwapV2.js

Features:

Check TRC20 balance for a given address.

Quote token swap (TRX ↔ USDT or any TRC20).

Build raw swap transaction for V2 router.

Sign and send swap transaction.

Key Addresses:

const V2_ROUTER = "TQAvWQpT9H916GckwWDJNhYZvQMkuRL7PN";
const WTRX = "TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR";
const USDT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";


Functions:

getTRC20Balance(address, tokenAddress)

getQuoteV2({ tokenIn, tokenOut, amount })

buildSwapTxV2({ from, tokenIn, tokenOut, amount, slippage })

sendSwapTx(privateKey, swapTx)

V3 Swap Script

File: sunSwapV3_test.js

Features:

Swap TRX → USDT using SunSwap V3.

Uses exactInputSingle() method.

Allows slippage, deadline, and amountOutMin.

Logs USDT balance before and after swap.

Works directly with test address (no derivation from private key).

Key Addresses:

const V3_ROUTER = "TQAvWQpT9H916GckwWDJNhYZvQMkuRL7PN";
const WTRX = "TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR";
const USDT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const TEST_ADDRESS = "TBeZXAdrmjFFANbd92zZLRpZmXVPRHqXY3";


Functions:

getUSDTBalance(address) → checks USDT balance.

swapTRXtoUSDT(privateKey, trxAmount, slippage) → performs TRX → USDT swap.

Usage

Check USDT balance:

node sunSwapV3_test.js


Perform TRX → USDT swap:

Paste your private key in PRIVATE_KEY variable.

Set swap amount (TRX) in swapTRXtoUSDT call.

Run:

node sunSwapV3_test.js

Known Issues & Fixes
Issue	Cause	Fix
invalid param type	Tuple incorrectly passed to triggerSmartContract	Flattened tuple into individual types {type, value} array
owner_address isn't set	TriggerSmartContract requires owner	Provided TEST_ADDRESS as last argument
usdt.decimals is not a function	Wrong contract object	Used tronWeb.contract(TRC20_ABI, USDT)
Example Output (V3 Swap)
💰 USDT Before: 0
🔁 Swapping TRX → USDT (V3)...
✅ Swap TX HASH: 31c013445a9257e16b2977d481d2a4759bbbfbd9fef509eada61da08af5ed9f4
💰 USDT After: 0.0098

Notes

The scripts are non-custodial: private keys are required for signing but not stored.

V3 swap assumes direct TRX → USDT. Multi-hop swaps are not included.

Always test with small amounts first.

Delay is recommended before checking balances to allow TronGrid indexer updates.
