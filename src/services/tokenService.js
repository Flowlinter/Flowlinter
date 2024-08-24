import { TokenManagement } from 'flowlinter';

const tokenManagement = new TokenManagement(
    process.env.REACT_APP_CHAINFLOW_API_KEY,
    process.env.REACT_APP_ETH_RPC_URL,
    process.env.REACT_APP_SOLANA_RPC_URL
);

export const fetchEthTokenBalance = async (tokenAddress, walletAddress) => {
    try {
        const balance = await tokenManagement.getEthTokenBalance(tokenAddress, walletAddress);
        return balance;
    } catch (error) {
        console.error("Error fetching Ethereum token balance:", error);
        throw error;
    }
};

export const fetchSolanaTokenBalance = async (tokenMintAddress, walletAddress) => {
    try {
        const balance = await tokenManagement.getSolanaTokenBalance(tokenMintAddress, walletAddress);
        return balance;
    } catch (error) {
        console.error("Error fetching Solana token balance:", error);
        throw error;
    }
};

