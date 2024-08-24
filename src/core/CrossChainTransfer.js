import { ethers } from 'ethers';
import {
  getEmitterAddressEth,
  parseSequenceFromLogEth,
  parseSequenceFromLogSolana,
  getSignedVAAWithRetry,
  transferFromEth,
  attestFromSolana,
  attestFromEth,
  transferFromSolana,
  postVaaSolana,
  createWrappedOnEth,
  createWrappedOnSolana
} from '@certusone/wormhole-sdk';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import dotenv from 'dotenv';
const bs58 = require('bs58');

dotenv.config();

class CrossChainTransfer {
  constructor() {
    this.apiKey = process.env.API_KEY;
    this.ethRpcUrl = process.env.ETH_RPC_URL;
    this.solanaRpcUrl = process.env.SOLANA_RPC_URL;

    this.ethProvider = new ethers.providers.JsonRpcProvider(this.ethRpcUrl);
    this.solanaConnection = new Connection(this.solanaRpcUrl, 'confirmed');
  }

  async attestSolanaToEthereum({ payerAddress, mintAddress }) {
    try {
      const transaction = await attestFromSolana(
        this.solanaConnection,
        process.env.SOL_BRIDGE_ADDRESS,
        process.env.SOL_TOKEN_BRIDGE_ADDRESS,
        payerAddress,
        mintAddress
      );
      const signed = await this.signAndSendTransaction(transaction);
      const sequence = parseSequenceFromLogSolana(signed);
      const emitterAddress = await getEmitterAddressSolana(process.env.SOL_TOKEN_BRIDGE_ADDRESS);
      const { signedVAA } = await getSignedVAAWithRetry(
        process.env.WORMHOLE_RPC_HOST,
        process.env.CHAIN_ID_SOLANA,
        emitterAddress,
        sequence
      );
      await createWrappedOnEth(process.env.ETH_TOKEN_BRIDGE_ADDRESS, this.ethProvider.getSigner(), signedVAA);
    } catch (error) {
      throw new Error(`Attestation failed: ${error.message}`);
    }
  }

  async attestEthereumToSolana({ tokenAddress }) {
    try {
      const receipt = await attestFromEth(process.env.ETH_TOKEN_BRIDGE_ADDRESS, this.ethProvider.getSigner(), tokenAddress);
      const sequence = parseSequenceFromLogEth(receipt, process.env.ETH_BRIDGE_ADDRESS);
      const emitterAddress = getEmitterAddressEth(process.env.ETH_TOKEN_BRIDGE_ADDRESS);
      const { signedVAA } = await getSignedVAAWithRetry(
        process.env.WORMHOLE_RPC_HOST,
        process.env.CHAIN_ID_ETH,
        emitterAddress,
        sequence
      );
      await postVaaSolana(
        this.solanaConnection,
        process.env.SOL_BRIDGE_ADDRESS,
        process.env.SOL_TOKEN_BRIDGE_ADDRESS,
        signedVAA
      );
      await createWrappedOnSolana(
        this.solanaConnection,
        process.env.SOL_BRIDGE_ADDRESS,
        process.env.SOL_TOKEN_BRIDGE_ADDRESS,
        signedVAA
      );
    } catch (error) {
      throw new Error(`Attestation failed: ${error.message}`);
    }
  }

  async transferFromSolanaToEth({ payerAddress, fromAddress, mintAddress, amount, targetAddress, originAddress, originChain }) {
    try {
      const transaction = await transferFromSolana(
        this.solanaConnection,
        process.env.SOL_BRIDGE_ADDRESS,
        process.env.SOL_TOKEN_BRIDGE_ADDRESS,
        payerAddress,
        fromAddress,
        mintAddress,
        amount,
        targetAddress,
        process.env.CHAIN_ID_ETH,
        originAddress,
        originChain
      );
      const signed = await this.signAndSendTransaction(transaction);
      const sequence = parseSequenceFromLogSolana(signed);
      const emitterAddress = await getEmitterAddressSolana(process.env.SOL_TOKEN_BRIDGE_ADDRESS);
      const { signedVAA } = await getSignedVAAWithRetry(
        process.env.WORMHOLE_RPC_HOST,
        process.env.CHAIN_ID_SOLANA,
        emitterAddress,
        sequence
      );
      await this.redeemOnEth(signedVAA);
    } catch (error) {
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  async transferFromEthToSolana({ tokenAddress, amount, recipientAddress }) {
    try {
      const receipt = await transferFromEth(
        process.env.ETH_TOKEN_BRIDGE_ADDRESS,
        this.ethProvider.getSigner(),
        tokenAddress,
        amount,
        process.env.CHAIN_ID_SOLANA,
        recipientAddress
      );
      const sequence = parseSequenceFromLogEth(receipt, process.env.ETH_BRIDGE_ADDRESS);
      const emitterAddress = getEmitterAddressEth(process.env.ETH_TOKEN_BRIDGE_ADDRESS);
      const { signedVAA } = await getSignedVAAWithRetry(
        process.env.WORMHOLE_RPC_HOST,
        process.env.CHAIN_ID_ETH,
        emitterAddress,
        sequence
      );
      await this.postAndRedeemOnSolana(signedVAA, recipientAddress);
    } catch (error) {
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
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
