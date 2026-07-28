export const SEPOLIA_CHAIN_ID = 11155111;

export const CONTRACTS = {
  mockUsdc: '0x8c54d36d022BA2c9684c2c77e48d3D961B6ef507',
  vault: '0xb9dC5Aebe33f7b1F74971C0F87164eD018f69C66',
  stream: '0xd4AC9ef480a60215b0aDe26c85716A0B5A87Ecf1',
  noxCompute: '0x24Ef36Ec5b626D7DCD09a98F3083c2758F0F77bF',
} as const;

export const MOCK_ERC20_ABI = [
  { type: 'function', name: 'approve', stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const;

export const VAULT_ABI = [
  { type: 'function', name: 'wrap', stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ type: '', type: 'bytes32' }] },
  { type: 'function', name: 'setOperator', stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'until', type: 'uint48' }],
    outputs: [] },
  { type: 'function', name: 'isOperator', stateMutability: 'view',
    inputs: [{ name: 'holder', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'confidentialBalanceOf', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'bytes32' }] },
] as const;

export const STREAM_ABI = [
  {
    type: 'function',
    name: 'createStream',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'encryptedTotalAmount', type: 'bytes32' },
      { name: 'inputProof', type: 'bytes' },
      { name: 'startTime', type: 'uint40' },
      { name: 'duration', type: 'uint40' },
    ],
    outputs: [{ name: 'streamId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'streamId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'discloseToAuditor',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'streamId', type: 'uint256' },
      { name: 'auditor', type: 'address' },
    ],
    outputs: [{ name: 'snapshotHandle', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'getStreamTotalAmount',
    stateMutability: 'view',
    inputs: [{ name: 'streamId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'nextStreamId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'streams',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'asset', type: 'address' },
      { name: 'totalAmount', type: 'bytes32' },
      { name: 'withdrawnAmount', type: 'bytes32' },
      { name: 'startTime', type: 'uint40' },
      { name: 'duration', type: 'uint40' },
    ],
  },
] as const;
