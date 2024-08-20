const CrossChainTransfer = require('./core/CrossChainTransfer');
const dotenv = require('dotenv');

dotenv.config();

const chainFlow = new CrossChainTransfer(
    process.env.FLOWLINTER_API_KEY,
    process.env.ETH_RPC_URL,
    process.env.SOLANA_RPC_URL
);

module.exports = chainFlow;
