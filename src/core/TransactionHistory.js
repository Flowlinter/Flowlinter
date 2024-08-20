const { ethers } = require('ethers');
const { Connection, PublicKey } = require('@solana/web3.js');

class TransactionHistory {
    constructor(apiKey, ethRpcUrl, solanaRpcUrl) {
        this.apiKey = apiKey;
        this.ethProvider = new ethers.providers.JsonRpcProvider(ethRpcUrl);
        this.solanaConnection = new Connection(solanaRpcUrl, 'confirmed');
    }

    async getEthTransactionHistory(address) {
        return this.ethProvider.getHistory(address);
    }

    async getSolanaTransactionHistory(address) {
        const publicKey = new PublicKey(address);
        return this.solanaConnection.getConfirmedSignaturesForAddress2(publicKey);
    }
}

module.exports = TransactionHistory;
