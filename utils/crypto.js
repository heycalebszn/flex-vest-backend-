const Web3 = require('web3');
const { ethers } = require('ethers');

// ABI for ERC20 tokens (USDT/USDC)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

// Initialize Web3 with provider
const web3 = new Web3(process.env.WEB3_PROVIDER_URL);

// Initialize ethers provider
const provider = new ethers.providers.JsonRpcProvider(process.env.WEB3_PROVIDER_URL);

// Token addresses (replace with actual addresses)
const TOKEN_ADDRESSES = {
  USDT: process.env.USDT_CONTRACT_ADDRESS,
  USDC: process.env.USDC_CONTRACT_ADDRESS
};

/**
 * Generate a new Ethereum wallet
 * @returns {Object} - Wallet details
 */
function generateWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase
  };
}

/**
 * Get token balance for an address
 * @param {string} address - Wallet address
 * @param {string} token - Token symbol (USDT/USDC)
 * @returns {string} - Balance in token's smallest unit
 */
async function getTokenBalance(address, token) {
  try {
    const tokenContract = new ethers.Contract(
      TOKEN_ADDRESSES[token],
      ERC20_ABI,
      provider
    );
    
    const balance = await tokenContract.balanceOf(address);
    return balance.toString();
  } catch (error) {
    console.error(`Error getting ${token} balance:`, error);
    throw error;
  }
}

/**
 * Transfer tokens from platform wallet to user
 * @param {string} toAddress - Recipient address
 * @param {string} amount - Amount in token's smallest unit
 * @param {string} token - Token symbol (USDT/USDC)
 * @returns {Object} - Transaction details
 */
async function transferTokens(toAddress, amount, token) {
  try {
    const adminWallet = new ethers.Wallet(
      process.env.ADMIN_PRIVATE_KEY,
      provider
    );

    const tokenContract = new ethers.Contract(
      TOKEN_ADDRESSES[token],
      ERC20_ABI,
      adminWallet
    );

    const tx = await tokenContract.transfer(toAddress, amount);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1 ? 'success' : 'failed'
    };
  } catch (error) {
    console.error(`Error transferring ${token}:`, error);
    throw error;
  }
}

/**
 * Validate transaction receipt
 * @param {string} txHash - Transaction hash
 * @returns {Object} - Transaction status
 */
async function validateTransaction(txHash) {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return { status: 'pending' };
    }

    return {
      status: receipt.status === 1 ? 'success' : 'failed',
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice.toString()
    };
  } catch (error) {
    console.error('Error validating transaction:', error);
    throw error;
  }
}

/**
 * Estimate gas for token transfer
 * @param {string} toAddress - Recipient address
 * @param {string} amount - Amount in token's smallest unit
 * @param {string} token - Token symbol (USDT/USDC)
 * @returns {string} - Estimated gas
 */
async function estimateGas(toAddress, amount, token) {
  try {
    const tokenContract = new ethers.Contract(
      TOKEN_ADDRESSES[token],
      ERC20_ABI,
      provider
    );

    const gasEstimate = await tokenContract.estimateGas.transfer(toAddress, amount);
    return gasEstimate.toString();
  } catch (error) {
    console.error('Error estimating gas:', error);
    throw error;
  }
}

/**
 * Get current gas price
 * @returns {Object} - Gas price details
 */
async function getGasPrice() {
  try {
    const gasPrice = await provider.getGasPrice();
    return {
      wei: gasPrice.toString(),
      gwei: ethers.utils.formatUnits(gasPrice, 'gwei'),
      ether: ethers.utils.formatEther(gasPrice)
    };
  } catch (error) {
    console.error('Error getting gas price:', error);
    throw error;
  }
}

module.exports = {
  generateWallet,
  getTokenBalance,
  transferTokens,
  validateTransaction,
  estimateGas,
  getGasPrice,
  TOKEN_ADDRESSES
}; 