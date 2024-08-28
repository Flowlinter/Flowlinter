const { ethers } = require('ethers');
const { Connection, PublicKey, Transaction, Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
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
const Utils = require('../utils/utils');
require('dotenv').config();

class CrossChainTransfer {
    constructor(privateKey) {
        this.apiKey = process.env.API_KEY;
        this.ethRpcUrl = process.env.ETH_RPC_URL;
        this.solanaRpcUrl = process.env.SOLANA_RPC_URL;
        this.privateKey = privateKey;

        if (!process.env.API_KEY || !process.env.ETH_RPC_URL || !process.env.SOLANA_RPC_URL) {
            throw new Error('API_KEY, ETH_RPC_URL, and SOLANA_RPC_URL must be set in the environment variables.');
        }

        // Initialize Ethereum provider and signer
        this.ethProvider = new ethers.providers.JsonRpcProvider(this.ethRpcUrl);
        this.ethSigner = new ethers.Wallet(this.privateKey, this.ethProvider);

        // Initialize Solana connection and Keypair
        this.solanaConnection = new Connection(this.solanaRpcUrl, 'confirmed');
        this.solanaKeypair = Keypair.fromSecretKey(bs58.decode(this.privateKey));
    }

    async transferFromSolanaToEth({ tokenAddress, amount, recipientAddress, tokenName = 'Unknown Token' }) {
        Utils.validateParams({ tokenAddress, amount: BigInt(amount), recipientAddress }, 'solanaToEth', process.env);
    
        Utils.logInfo(`Starting transfer of ${amount} ${tokenName} from Solana to Ethereum...`);
    
        try {
            const tx = await this._withRetry(() => transferFromSolana(
                process.env.SOL_TOKEN_BRIDGE_ADDRESS,
                this.solanaConnection,
                tokenAddress,
                BigInt(amount),
                recipientAddress,
                CHAIN_ID_ETH
            ));
    
            const { txid } = await this.solanaConnection.confirmTransaction(tx, 'confirmed');
            const receipt = await this.solanaConnection.getTransaction(txid, { commitment: 'confirmed' });
    
            const sequence = parseSequenceFromLogSolana(receipt);
    
            const signedVAA = await this._withRetry(() => getSignedVAAWithRetry(
                [process.env.WORMHOLE_RPC_HOST],
                CHAIN_ID_SOLANA,
                process.env.SOL_BRIDGE_ADDRESS,
                sequence
            ));
    
            await this.redeemOnEth(signedVAA);
            
            Utils.logInfo(`${tokenName} transfer from Solana to Ethereum completed successfully.`);
        } catch (error) {
            Utils.logError(`Error during ${tokenName} transfer from Solana to Ethereum:`, error);
            throw new Error('Transfer from Solana to Ethereum failed.');
        }
    }

    async transferFromEthToSolana({ tokenAddress, amount, recipientAddress, tokenName = 'Unknown Token' }) {
        Utils.validateParams({ tokenAddress, amount: BigInt(amount), recipientAddress }, 'ethToSolana', process.env);

        Utils.logInfo(`Starting transfer of ${amount} ${tokenName} from Ethereum to Solana...`);

        try {
            const tx = await this._withRetry(() => transferFromEth(
                process.env.ETH_TOKEN_BRIDGE_ADDRESS,
                this.ethSigner,
                tokenAddress,
                BigInt(amount),
                recipientAddress,
                CHAIN_ID_SOLANA
            ));

            const receipt = await tx.wait();
            const sequence = parseSequenceFromLogEth(receipt, process.env.ETH_BRIDGE_ADDRESS);

            const signedVAA = await this._withRetry(() => getSignedVAAWithRetry(
                [process.env.WORMHOLE_RPC_HOST],
                CHAIN_ID_ETH,
                process.env.ETH_BRIDGE_ADDRESS,
                sequence
            ));

            await this.postAndRedeemOnSolana(signedVAA, recipientAddress);
            Utils.logInfo(`${tokenName} transfer from Ethereum to Solana completed successfully.`);
        } catch (error) {
            Utils.logError(`Error during ${tokenName} transfer from Ethereum to Solana:`, error);
            throw new Error('Transfer from Ethereum to Solana failed.');
        }
    }

    async signAndSendTransaction(transaction) {
        try {
            transaction.feePayer = this.solanaKeypair.publicKey;
            const signedTransaction = await this.solanaConnection.sendTransaction(transaction, [this.solanaKeypair]);
            const txid = await this.solanaConnection.confirmTransaction(signedTransaction, 'confirmed');
            return txid;
        } catch (error) {
            Utils.logError('Error during Solana transaction signing and sending:', error);
            throw new Error('Failed to sign and send Solana transaction.');
        }
    }

    async postAndRedeemOnSolana(signedVAA, recipientAddress) {
        try {
            await this._withRetry(() => postVaaSolana(this.solanaConnection, process.env.SOL_BRIDGE_ADDRESS, signedVAA));
            const transaction = await createWrappedOnSolana(
                this.solanaConnection,
                process.env.SOL_BRIDGE_ADDRESS,
                process.env.SOL_TOKEN_BRIDGE_ADDRESS,
                signedVAA,
                recipientAddress
            );
            await this.signAndSendTransaction(transaction);
        } catch (error) {
            Utils.logError('Error during Solana VAA posting and redemption:', error);
            throw new Error('Failed to post and redeem on Solana.');
        }
    }

    async redeemOnEth(signedVAA) {
        try {
            await this._withRetry(() => createWrappedOnEth(process.env.ETH_TOKEN_BRIDGE_ADDRESS, this.ethSigner, signedVAA));
        } catch (error) {
            Utils.logError('Error during Ethereum VAA redemption:', error);
            throw new Error('Failed to redeem on Ethereum.');
        }
    }

    // Retry mechanism for network calls
    async _withRetry(fn, retries = 3, timeout = 5000) {
        let attempt = 0;
        while (attempt < retries) {
            try {
                const promise = fn();
                const result = await Promise.race([
                    promise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
                ]);
                return result;
            } catch (error) {
                attempt += 1;
                if (attempt >= retries) throw error;
                Utils.logInfo(`Retrying... (${attempt}/${retries})`);
            }
        }
    }

    _securePrivateKey() {
        // In production, integrate this with a secure vault
        return this.privateKey;
    }
}

module.exports = CrossChainTransfer;