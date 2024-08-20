import { MultiChainSupport } from 'chainflow-sdk';

const multiChainSupport = new MultiChainSupport(
    process.env.REACT_APP_CHAINFLOW_API_KEY,
    process.env.REACT_APP_ETH_RPC_URL,
    process.env.REACT_APP_SOLANA_RPC_URL,
    { /* other RPC URLs */ }
);

export const fetchBalance = async (chain, address) => {
    try {
        const balance = await multiChainSupport.getBalance(chain, address);
        return balance;
    } catch (error) {
        console.error(`Error fetching balance for ${chain}:`, error);
        throw error;
    }
};
