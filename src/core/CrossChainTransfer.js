const { ethers } = require('ethers');
const { Connection, PublicKey, Transaction } = require('@solana/web3.js');
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
    constructor() {
        this.apiKey = process.env.API_KEY;
        this.ethRpcUrl = process.env.ETH_RPC_URL;
        this.solanaRpcUrl = process.env.SOLANA_RPC_URL;

        if (!this.apiKey || !this.ethRpcUrl || !this.solanaRpcUrl) {
            throw new Error('API_KEY, ETH_RPC_URL, and SOLANA_RPC_URL must be set in the environment variables.');
        }

        this.ethProvider = new ethers.providers.JsonRpcProvider(this.ethRpcUrl);
        this.solanaConnection = new Connection(this.solanaRpcUrl, 'confirmed');
    }

    async transferFromSolanaToEth({ tokenAddress, amount, recipientAddress }) {
        this._validateParams(tokenAddress, amount, recipientAddress, 'solanaToEth');

        try {
            const tx = await transferFromSolana(
                process.env.SOL_TOKEN_BRIDGE_ADDRESS,
                this.solanaConnection,
                tokenAddress,
                BigInt(amount),
                recipientAddress,
                CHAIN_ID_ETH
            );

            const { txid } = await this.solanaConnection.confirmTransaction(tx);
            const receipt = await this.solanaConnection.getTransaction(txid, { commitment: 'confirmed' });

            const sequence = parseSequenceFromLogSolana(receipt);

            const signedVAA = await getSignedVAAWithRetry(
                [process.env.WORMHOLE_RPC_HOST],
                CHAIN_ID_SOLANA,
                process.env.SOL_BRIDGE_ADDRESS,
                sequence
            );

            await this.redeemOnEth(signedVAA);
        } catch (error) {
            console.error('Error during Solana to Ethereum transfer:', error);
            throw new Error('Transfer from Solana to Ethereum failed.');
        }
    }

    async transferFromEthToSolana({ tokenAddress, amount, recipientAddress }) {
        this._validateParams(tokenAddress, amount, recipientAddress, 'ethToSolana');

        try {
            const tx = await transferFromEth(
                process.env.ETH_TOKEN_BRIDGE_ADDRESS,
                this.ethProvider.getSigner(),
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
        } catch (error) {
            console.error('Error during Ethereum to Solana transfer:', error);
            throw new Error('Transfer from Ethereum to Solana failed.');
        }
    }

    isValidEthereumAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    isValidBase58(str) {
        try {
            bs58.decode(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    async signAndSendTransaction(transaction) {
        try {
            const signed = await this.solanaConnection.sendTransaction(transaction);
            const txid = await this.solanaConnection.confirmTransaction(signed, 'confirmedFinalized');
            return txid;
        } catch (error) {
            console.error('Error during Solana transaction signing and sending:', error);
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
            console.error('Error during Solana VAA posting and redemption:', error);
            throw new Error('Failed to post and redeem on Solana.');
        }
    }

    async redeemOnEth(signedVAA) {
        try {
            await createWrappedOnEth(process.env.ETH_TOKEN_BRIDGE_ADDRESS, this.ethProvider.getSigner(), signedVAA);
        } catch (error) {
            console.error('Error during Ethereum VAA redemption:', error);
            throw new Error('Failed to redeem on Ethereum.');
        }
    }

    _validateParams(tokenAddress, amount, recipientAddress, direction) {
        if (!tokenAddress || !amount || !recipientAddress) {
            throw new Error('Invalid parameters: tokenAddress, amount, and recipientAddress are required.');
        }

        if (direction === 'solanaToEth') {
            if (!this.isValidBase58(tokenAddress)) {
                throw new Error('Invalid Solana token address.');
            }
            if (!this.isValidEthereumAddress(recipientAddress)) {
                throw new Error('Invalid Ethereum recipient address.');
            }
        } else if (direction === 'ethToSolana') {
            if (!this.isValidEthereumAddress(tokenAddress)) {
                throw new Error('Invalid Ethereum token address.');
            }
            if (!this.isValidBase58(recipientAddress)) {
                throw new Error('Invalid Solana recipient address.');
            }
        }

        if (!process.env.SOL_TOKEN_BRIDGE_ADDRESS || !process.env.ETH_TOKEN_BRIDGE_ADDRESS) {
            throw new Error('Environment variables for bridge addresses are not set.');
        }

        if (!process.env.WORMHOLE_RPC_HOST || !process.env.SOL_BRIDGE_ADDRESS || !process.env.ETH_BRIDGE_ADDRESS) {
            throw new Error('Environment variables for Wormhole RPC and bridge addresses are not set.');
        }
    }
}

module.exports = CrossChainTransfer;
