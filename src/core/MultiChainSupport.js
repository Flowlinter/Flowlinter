const { ethers } = require('ethers');
const { Connection, PublicKey } = require('@solana/web3.js');

class MultiChainSupport {
    constructor(apiKey, ethRpcUrl, solanaRpcUrl, otherRpcUrls) {
        this.apiKey = apiKey;
        this.ethProvider = new ethers.providers.JsonRpcProvider(ethRpcUrl);
        this.solanaConnection = new Connection(solanaRpcUrl, 'confirmed');
        this.otherProviders = otherRpcUrls; // Map or other structure for additional providers
    }

    async getBalance(chain, address) {
        if (chain === 'ethereum') {
            return this.ethProvider.getBalance(address);
        } else if (chain === 'solana') {
            const publicKey = new PublicKey(address);
            return this.solanaConnection.getBalance(publicKey);
        } else {
            throw new Error('Chain not supported');
        }
    }
}

module.exports = MultiChainSupport;
