const { ethers } = require("ethers");

const RPC_URL = "https://1rpc.io/matic";
const PRIVATE_KEY = "5380cbc8483125488c0ff7d7dc0dd7e81208244ea615130dd4d5d3d68612f5b3";

const RUBIC_ROUTER = "0x3335733c454805df6a77f825f266e136FB4a3333";

const callData =
  "0xe1fcde8e0000000000000000000000000000000000000000000000000000000000000060..."; // unchanged

async function main() {
  // ✅ v6 Provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // ✅ Wallet
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("Sender:", wallet.address);

  // ✅ Build tx
  const tx = {
    to: RUBIC_ROUTER,
    data: callData,
    value: 0n, // native MATIC = 0
    gasLimit: 8_000_000n // safer gas limit
  };

  // ✅ Send
  const sentTx = await wallet.sendTransaction(tx);
  console.log("Tx hash:", sentTx.hash);

  // ✅ Wait for confirmation
  const receipt = await sentTx.wait();
  console.log("Confirmed in block:", receipt.blockNumber);
}

main().catch(console.error);
