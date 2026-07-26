import * as dotenv from 'dotenv';
import hardhatToolboxViemPlugin from '@nomicfoundation/hardhat-toolbox-viem';
import { configVariable, defineConfig } from 'hardhat/config';
import noxPlugin from '@iexec-nox/nox-hardhat-plugin';
import hardhatVerify from '@nomicfoundation/hardhat-verify';

dotenv.config();

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin, noxPlugin, hardhatVerify],
  solidity: {
    version: '0.8.35',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    default: {
      type: 'edr-simulated',
      chainType: 'op',
    },
    sepolia: {
      type: 'http',
      url: process.env.SEPOLIA_RPC_URL || '',
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  verify: {
    etherscan: {
      apiKey: configVariable('ETHERSCAN_API_KEY'),
      enabled: true,
    },
    sourcify: {
      enabled: true,
    },
  },
});
