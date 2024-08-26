const { ethers } = require('ethers');
const { Connection, PublicKey } = require('@solana/web3.js');
const ERC20_ABI = require('./ERC20_ABI.json'); // Path: src/core/ERC20_ABI.json

class TokenManagement {
    
    constructor(apiKey, ethRpcUrl, solanaRpcUrl) {
        this.apiKey = apiKey;
        this.ethProvider = new ethers.providers.JsonRpcProvider(ethRpcUrl);
        this.solanaConnection = new Connection(solanaRpcUrl, 'confirmed');
    }

    async getEthTokenBalance(tokenAddress, walletAddress) {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.ethProvider);
        const balance = await tokenContract.balanceOf(walletAddress);
        return ethers.utils.formatUnits(balance, await tokenContract.decimals());
    }

    async getSolanaTokenBalance(tokenMintAddress, walletAddress) {
        const publicKey = new PublicKey(walletAddress);
        const tokenAccounts = await this.solanaConnection.getTokenAccountsByOwner(publicKey, {
            mint: new PublicKey(tokenMintAddress),
        });
        return tokenAccounts.value.reduce((total, account) => total + account.account.data.parsed.info.tokenAmount.uiAmount, 0); // Assuming tokenAmount is a number field in the token account data structure 
    }
}

module.exports = TokenManagement;
