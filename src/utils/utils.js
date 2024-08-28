class Utils {
    
    static logInfo(message) {
        console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
    }

    static logError(message, error) {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error || '');
    }

    static isValidEthereumAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    static isValidBase58(address) {
        const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
        return base58Regex.test(address);
    }

    static validateParams({ tokenAddress, amount, recipientAddress }, direction, env) {
        if (!tokenAddress || !amount || !recipientAddress) {
            Utils.logError('Invalid parameters: tokenAddress, amount, and recipientAddress are required.');
            throw new Error('Invalid parameters: tokenAddress, amount, and recipientAddress are required.');
        }
    
        if (typeof amount !== 'bigint' || amount <= 0n) {
            Utils.logError('Amount must be a positive integer.');
            throw new Error('Amount must be a positive integer.');
        }
    
        if (direction === 'solanaToEth') {
            if (!Utils.isValidBase58(tokenAddress)) {
                Utils.logError('Invalid Solana token address.');
                throw new Error('Invalid Solana token address.');
            }
            if (!Utils.isValidEthereumAddress(recipientAddress)) {
                Utils.logError('Invalid Ethereum recipient address.');
                throw new Error('Invalid Ethereum recipient address.');
            }
        } else if (direction === 'ethToSolana') {
            if (!Utils.isValidEthereumAddress(tokenAddress)) {
                Utils.logError('Invalid Ethereum token address.');
                throw new Error('Invalid Ethereum token address.');
            }
            if (!Utils.isValidBase58(recipientAddress)) {
                Utils.logError('Invalid Solana recipient address.');
                throw new Error('Invalid Solana recipient address.');
            }
        } else {
            Utils.logError('Invalid transfer direction.');
            throw new Error('Invalid transfer direction.');
        }
    
        if (!env.SOL_TOKEN_BRIDGE_ADDRESS || !env.ETH_TOKEN_BRIDGE_ADDRESS) {
            Utils.logError('Environment variables for bridge addresses are not set.');
            throw new Error('Environment variables for bridge addresses are not set.');
        }
    
        if (!env.WORMHOLE_RPC_HOST || !env.SOL_BRIDGE_ADDRESS || !env.ETH_BRIDGE_ADDRESS) {
            Utils.logError('Environment variables for Wormhole RPC and bridge addresses are not set.');
            throw new Error('Environment variables for Wormhole RPC and bridge addresses are not set.');
        }
    }
}

module.exports = Utils;
