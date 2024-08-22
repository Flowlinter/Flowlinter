const { ethers } = require('ethers');
const { Connection, PublicKey } = require('@solana/web3.js');

class WalletIntegration {
    constructor() {
        this.ethProvider = null;
        this.solanaConnection = null;
        this.walletType = null;
    }

    // Connect to an Ethereum wallet (e.g., MetaMask)
    async connectEthereumWallet() {
        if (window.ethereum) {
            this.ethProvider = new ethers.providers.Web3Provider(window.ethereum);

            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.walletType = 'ethereum';
                return this.ethProvider.getSigner().getAddress();
            } catch (error) {
                throw new Error('Failed to connect to Ethereum wallet: ' + error.message);
            }
        } else {
            throw new Error('No Ethereum wallet detected');
        }
    }

    // Connect to a Solana wallet (e.g., Phantom)
    async connectSolanaWallet() {
        if (window.solana && window.solana.isPhantom) {
            try {
                const response = await window.solana.connect();
                this.walletType = 'solana';
                this.solanaConnection = new Connection('https://api.mainnet-beta.solana.com');
                return response.publicKey.toString();
            } catch (error) {
                throw new Error('Failed to connect to Solana wallet: ' + error.message);
            }
        } else {
            throw new Error('No Solana wallet detected');
        }
    }

    // Disconnect the wallet
    disconnectWallet() {
        this.ethProvider = null;
        this.solanaConnection = null;
        this.walletType = null;
    }

    // Get the current wallet address
    async getWalletAddress() {
        if (this.walletType === 'ethereum') {
            return await this.ethProvider.getSigner().getAddress();
        } else if (this.walletType === 'solana') {
            return await window.solana.publicKey.toString();
        } else {
            throw new Error('No wallet connected');
        }
    }

    // Sign a transaction with the connected wallet
    async signTransaction(transaction) {
        if (this.walletType === 'ethereum') {
            const signer = this.ethProvider.getSigner();
            return await signer.signTransaction(transaction);
        } else if (this.walletType === 'solana') {
            return await window.solana.signTransaction(transaction);
        } else {
            throw new Error('No wallet connected');
        }
    }

    // Example of interacting with the wallet (e.g., send ETH)
    async sendEthereumTransaction(to, value) {
        if (this.walletType !== 'ethereum') {
            throw new Error('Ethereum wallet not connected');
        }

        const signer = this.ethProvider.getSigner();
        const tx = await signer.sendTransaction({
            to,
            value: ethers.utils.parseEther(value),
        });

        return tx.hash;
    }
}

module.exports = WalletIntegration;
