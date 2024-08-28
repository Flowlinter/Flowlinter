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
        this._validateParams({ tokenAddress, amount, recipientAddress }, 'solanaToEth'); // Validate parameters
    
        this.logInfo(`Starting transfer of ${amount} ${tokenName} from Solana to Ethereum...`);
    
        try {
            // Perform the transfer on Solana
            const tx = await transferFromSolana(
                process.env.SOL_TOKEN_BRIDGE_ADDRESS,
                this.solanaConnection,
                tokenAddress,
                BigInt(amount),
                recipientAddress,
                CHAIN_ID_ETH
            );
    
            // Confirm the transaction on Solana
            const { txid } = await this.solanaConnection.confirmTransaction(tx, 'confirmed');
            const receipt = await this.solanaConnection.getTransaction(txid, { commitment: 'confirmed' });
    
            // Extract the sequence from the Solana transaction receipt
            const sequence = parseSequenceFromLogSolana(receipt);
    
            // Retrieve the signed VAA
            const signedVAA = await getSignedVAAWithRetry(
                [process.env.WORMHOLE_RPC_HOST],
                CHAIN_ID_SOLANA,
                process.env.SOL_BRIDGE_ADDRESS,
                sequence
            );
    
            // Redeem the token on Ethereum
            await this.redeemOnEth(signedVAA);
            
            this.logInfo(`${tokenName} transfer from Solana to Ethereum completed successfully.`);
        } catch (error) {
            this.logError(`Error during ${tokenName} transfer from Solana to Ethereum:`, error);
            throw new Error('Transfer from Solana to Ethereum failed.');
        }
    }

    async transferFromEthToSolana({ tokenAddress, amount, recipientAddress, tokenName = 'Unknown Token' }) {
        this._validateParams({ tokenAddress, amount, recipientAddress }, 'ethToSolana');

        this.logInfo(`Starting transfer of ${amount} ${tokenName} from Ethereum to Solana...`);

        try {
            const tx = await transferFromEth(
                process.env.ETH_TOKEN_BRIDGE_ADDRESS,
                this.ethSigner,
                tokenAddress,
                BigInt(amount),
                recipientAddress,
                CHAIN_ID_SOLANA
            );

            const receipt = await tx.wait();
            const sequence = parseSequenceFromLogEth(receipt, process.env.ETH_BRIDGE_ADDRESS);

            const signedVAA = await getSignedVAAWithRetry(
                [process.env.WORMHOLE_RPC_HOST],
                CHAIN_ID_ETH,
                process.env.ETH_BRIDGE_ADDRESS,
                sequence
            );

            await this.postAndRedeemOnSolana(signedVAA, recipientAddress);
            this.logInfo(`${tokenName} transfer from Ethereum to Solana completed successfully.`);
        } catch (error) {
            this.logError(`Error during ${tokenName} transfer from Ethereum to Solana:`, error);
            throw new Error('Transfer from Ethereum to Solana failed.');
        }
    }

    // Log helper methods
    logInfo(message) {
        console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
    }

    logError(message, error) {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error || '');
    }

    // Address validation methods
    isValidEthereumAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    isValidBase58(address) {
        const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
        return base58Regex.test(address);
    }

    // Transaction helper methods
    async signAndSendTransaction(transaction) {
        try {
            transaction.feePayer = this.solanaKeypair.publicKey;
            const signedTransaction = await this.solanaConnection.sendTransaction(transaction, [this.solanaKeypair]);
            const txid = await this.solanaConnection.confirmTransaction(signedTransaction, 'confirmed');
            return txid;
        } catch (error) {
            this.logError('Error during Solana transaction signing and sending:', error);
            throw new Error('Failed to sign and send Solana transaction.');
        }
    }

    async postAndRedeemOnSolana(signedVAA, recipientAddress) {
        try {
            await postVaaSolana(this.solanaConnection, process.env.SOL_BRIDGE_ADDRESS, signedVAA);
            const transaction = await createWrappedOnSolana(
                this.solanaConnection,
                process.env.SOL_BRIDGE_ADDRESS,
                process.env.SOL_TOKEN_BRIDGE_ADDRESS,
                signedVAA,
                recipientAddress
            );
            await this.signAndSendTransaction(transaction);
        } catch (error) {
            this.logError('Error during Solana VAA posting and redemption:', error);
            throw new Error('Failed to post and redeem on Solana.');
        }
    }

    async redeemOnEth(signedVAA) {
        try {
            await createWrappedOnEth(process.env.ETH_TOKEN_BRIDGE_ADDRESS, this.ethSigner, signedVAA);
        } catch (error) {
            this.logError('Error during Ethereum VAA redemption:', error);
            throw new Error('Failed to redeem on Ethereum.');
        }
    }

    // Private key management improvement suggestion
    _securePrivateKey() {
        // Consider using secure vaults or secret management tools for production.
        return this.privateKey;
    }

    // Parameter validation
    _validateParams({ tokenAddress, amount, recipientAddress }, direction) {
        if (!tokenAddress || !amount || !recipientAddress) {
            this.logError('Invalid parameters: tokenAddress, amount, and recipientAddress are required.');
            throw new Error('Invalid parameters: tokenAddress, amount, and recipientAddress are required.');
        }
    
        if (direction === 'solanaToEth') {
            if (!this.isValidBase58(tokenAddress)) {
                this.logError('Invalid Solana token address.');
                throw new Error('Invalid Solana token address.');
            }
            if (!this.isValidEthereumAddress(recipientAddress)) {
                this.logError('Invalid Ethereum recipient address.');
                throw new Error('Invalid Ethereum recipient address.');
            }
        } else if (direction === 'ethToSolana') {
            if (!this.isValidEthereumAddress(tokenAddress)) {
                this.logError('Invalid Ethereum token address.');
                throw new Error('Invalid Ethereum token address.');
            }
            if (!this.isValidBase58(recipientAddress)) {
                this.logError('Invalid Solana recipient address.');
                throw new Error('Invalid Solana recipient address.');
            }
        } else {
            this.logError('Invalid transfer direction.');
            throw new Error('Invalid transfer direction.');
        }
    
        if (!process.env.SOL_TOKEN_BRIDGE_ADDRESS || !process.env.ETH_TOKEN_BRIDGE_ADDRESS) {
            this.logError('Environment variables for bridge addresses are not set.');
            throw new Error('Environment variables for bridge addresses are not set.');
        }
    
        if (!process.env.WORMHOLE_RPC_HOST || !process.env.SOL_BRIDGE_ADDRESS || !process.env.ETH_BRIDGE_ADDRESS) {
            this.logError('Environment variables for Wormhole RPC and bridge addresses are not set.');
            throw new Error('Environment variables for Wormhole RPC and bridge addresses are not set.');
        }
    }
}

module.exports = CrossChainTransfer;