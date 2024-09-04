import { MultiChainSupport, ChainType } from 'chainflow-sdk';

const multiChainSupport = new MultiChainSupport(
    process.env.REACT_APP_FLOWLINTER_API_KEY as string, // Flowlinter API key
    process.env.REACT_APP_ETH_RPC_URL as string,
    process.env.REACT_APP_SOLANA_RPC_URL as string,
    { /* other RPC URLs */ }
);

export const fetchBalance = async (chain: ChainType, address: string): Promise<number> => {
    try {
        const balance = await multiChainSupport.getBalance(chain, address);
        return balance;
    } catch (error) {
        console.error(`Error fetching balance for ${chain}:`, error);
        throw error;
    }
};
