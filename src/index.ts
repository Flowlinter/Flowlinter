const CrossChainTransfer = require('./core/CrossChainTransfer');
const TransactionHistory = require('./core/TransactionHistory');
const TokenManagement = require('./core/TokenManagement');
const MultiChainSupport = require('./core/MultiChainSupport');
const dotenv = require('dotenv');

dotenv.config();

const Flowlinter = new CrossChainTransfer(
    process.env.Flowlinter_API_KEY,
    process.env.ETH_RPC_URL,
    process.env.SOLANA_RPC_URL
);

const transactionHistory = new TransactionHistory(
    process.env.Flowlinter_API_KEY,
    process.env.ETH_RPC_URL,
    process.env.SOLANA_RPC_URL
);

const tokenManagement = new TokenManagement(
    process.env.Flowlinter_API_KEY,
    process.env.ETH_RPC_URL,
    process.env.SOLANA_RPC_URL
);

const multiChainSupport = new MultiChainSupport(
    process.env.Flowlinter_API_KEY,
    process.env.ETH_RPC_URL,
    process.env.SOLANA_RPC_URL,
    { /* other RPC URLs */ }
);

module.exports = { Flowlinter, transactionHistory, tokenManagement, multiChainSupport };
