import { TransactionHistory } from 'flowlinter';

const transactionHistory = new TransactionHistory(
    process.env.REACT_APP_CHAINFLOW_API_KEY,
    process.env.REACT_APP_ETH_RPC_URL,
    process.env.REACT_APP_SOLANA_RPC_URL
);

export const fetchEthTransactionHistory = async (address) => {
    try {
        const history = await transactionHistory.getEthTransactionHistory(address);
        return history;
    } catch (error) {
        console.error("Error fetching Ethereum transaction history:", error);
        throw error;
    }
};

export const fetchSolanaTransactionHistory = async (address) => {
    try {
        const history = await transactionHistory.getSolanaTransactionHistory(address);
        return history;
    } catch (error) {
        console.error("Error fetching Solana transaction history:", error);
        throw error;
    }
};
