const { ethers } = require('ethers');
const {
  attestFromSolana,
  createWrappedOnEth,
  getSignedVAAWithRetry,
  parseSequenceFromLogSolana,
  transferFromSolana,
  redeemOnEth,
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  getEmitterAddressSolana,
  parseSequenceFromLogEth,
  transferFromEth,
  postVaaSolana,
  createWrappedOnSolana,
} = require('@certusone/wormhole-sdk');

const { Connection, PublicKey, Transaction } = require('@solana/web3.js');
const bs58 = require('bs58');
require('dotenv').config();

class CrossChainTransfer {

  constructor() {
    this.apiKey = process.env.API_KEY;
    this.ethRpcUrl = process.env.ETH_RPC_URL;
    this.solanaRpcUrl = process.env.SOLANA_RPC_URL;

    this.ethProvider = new ethers.providers.JsonRpcProvider(this.ethRpcUrl);
    this.solanaConnection = new Connection(this.solanaRpcUrl, 'confirmed');
  }

  async transferFromSolanaToEth({ tokenAddress, amount, recipientAddress }) {
    
    // Create transfer transaction on Solana
    const tx = await transferFromSolana(
      process.env.SOL_TOKEN_BRIDGE_ADDRESS,
      this.solProvider.connection,
      tokenAddress,
      amount,
      recipientAddress,
      CHAIN_ID_ETH
    );

    // Parse sequence number from transaction receipt
    const receipt = await this.solProvider.connection.confirmTransaction(tx);
    const sequence = parseSequenceFromLogSolana(receipt);

    // Get signed VAA from Wormhole network
    const signedVAA = await getSignedVAAWithRetry(
      [process.env.WORMHOLE_RPC_HOST],
      CHAIN_ID_SOLANA,
      process.env.SOL_BRIDGE_ADDRESS,
      sequence
    );

    // Redeem the VAA on Ethereum
    const redeemTx = await redeemOnEth(
      process.env.ETH_TOKEN_BRIDGE_ADDRESS,
      this.ethProvider.getSigner(),
      signedVAA
    );

    // Wait for the transaction to be mined
    await redeemTx.wait();
 }

  async transferFromEthToSolana({ tokenAddress, amount, recipientAddress }) {
    // Create transfer transaction on Ethereum

    const tx = await transferFromEth(
      process.env.ETH_TOKEN_BRIDGE_ADDRESS,
      this.ethProvider.getSigner(),
      tokenAddress,
      amount,
      recipientAddress,
      CHAIN_ID_SOLANA
    );

    // Parse sequence number from transaction receipt
    const receipt = await tx.wait();
    const sequence = parseSequenceFromLogEth(receipt, process.env.ETH_BRIDGE_ADDRESS);

    // Get signed VAA from Wormhole network
    const signedVAA = await getSignedVAAWithRetry(
      [process.env.WORMHOLE_RPC_HOST],
      CHAIN_ID_ETH,
      process.env.ETH_BRIDGE_ADDRESS,
      sequence
    );

    // Post VAA to Solana
    await postVaaSolana(this.solanaConnection, process.env.SOL_BRIDGE_ADDRESS, signedVAA);

    // Redeem on Solana
    const transaction = await createWrappedOnSolana(
      this.solanaConnection,
      process.env.SOL_BRIDGE_ADDRESS,
      process.env.SOL_TOKEN_BRIDGE_ADDRESS,
      signedVAA,
      recipientAddress
    );
    await this.signAndSendTransaction(transaction);
  }

  isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address); // Check if it has the basic requirements of an address
  }

  isValidSolanaAddress(address) {
    try {
      bs58.decode(address);
      return true;
    } catch (e) {
      return false;
    }
  }

  async signAndSendTransaction(transaction) {
    const signed = await this.solanaConnection.sendTransaction(transaction);
    const txid = await this.solanaConnection.confirmTransaction(signed, 'confirmedFinalized');
    return txid;
  }

  async postAndRedeemOnSolana(signedVAA, recipientAddress) {
    await postVaaSolana(this.solanaConnection, process.env.SOL_BRIDGE_ADDRESS, signedVAA);
    const transaction = await createWrappedOnSolana(
      this.solanaConnection,
      process.env.SOL_BRIDGE_ADDRESS,
      process.env.SOL_TOKEN_BRIDGE_ADDRESS,
      signedVAA,
      recipientAddress
    );
    await this.signAndSendTransaction(transaction);
  }

  async redeemOnEth(signedVAA) {
    await createWrappedOnEth(process.env.ETH_TOKEN_BRIDGE_ADDRESS, this.ethProvider.getSigner(), signedVAA);
  }

  

  isValidBase58(str) {
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    return base58Regex.test(str);
  }
}

module.exports = CrossChainTransfer;