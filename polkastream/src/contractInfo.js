// PASSET HUB CONFIGURATION
// This is the updated contract address on Passet Hub (Revive)
export const contractAddress = '0x59142Cce01EDe54dbC76907360037D3F1f6f1b16';

// Network configuration for Passet Hub
export const NETWORKS = {
  // Passet Hub - Preview of PolkaVM on Paseo testnet
  PASSET_HUB: {
    name: 'Passet Hub',
    rpcs: [
      'wss://passet-hub-paseo.ibp.network',
      'wss://sys.ibp.network/paseo-asset-hub',
    ],
    token: 'PAS',
    chainId: 420420422,
    paraId: 1111,
    ethRpc: 'https://testnet-passet-hub-eth-rpc.polkadot.io',
    blockscout: 'https://blockscout-passet-hub.parity-testnet.parity.io/'
  },
  // Backup: Rococo Contracts (if needed)
  ROCOCO_CONTRACTS: {
    name: 'Rococo Contracts',
    rpcs: ['wss://rococo-contracts-rpc.polkadot.io'],
    token: 'ROC'
  },
  // Local development
  LOCAL: {
    name: 'Local Node',
    rpcs: ['ws://127.0.0.1:9944'],
    token: 'UNIT'
  }
};

// ACTIVE NETWORK - Set to Passet Hub
export const ACTIVE_NETWORK = NETWORKS.PASSET_HUB;

// Contract metadata for Passet Hub (Revive)
// This is a minimal metadata structure that works with Revive contracts
export const contractMetadata = {
  source: {
    hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    language: 'ink! 5.0.0',
    compiler: 'rustc 1.75.0',
    wasm: ''
  },
  contract: {
    name: 'polkadot_stream',
    version: '0.1.0',
    authors: ['Stream Protocol']
  },
  spec: {
    constructors: [],
    docs: [],
    events: [
      {
        label: 'StreamCreated',
        args: [
          { label: 'stream_id', type: { displayName: ['u64'], type: 2 } },
          { label: 'sender', type: { displayName: ['H160'], type: 1 } },
          { label: 'recipient', type: { displayName: ['H160'], type: 1 } },
          { label: 'total_amount', type: { displayName: ['Balance'], type: 3 } }
        ]
      },
      {
        label: 'Withdrawn',
        args: [
          { label: 'stream_id', type: { displayName: ['u64'], type: 2 } },
          { label: 'amount', type: { displayName: ['Balance'], type: 3 } }
        ]
      },
      {
        label: 'StreamCancelled',
        args: [
          { label: 'stream_id', type: { displayName: ['u64'], type: 2 } }
        ]
      }
    ],
    lang_error: { displayName: ['ink', 'LangError'], type: 0 },
    messages: [
      {
        label: 'create_stream',
        selector: '0x12345678',
        mutates: true,
        payable: true,
        args: [
          { 
            label: 'recipient', 
            type: { displayName: ['H160'], type: 1 } 
          },
          { 
            label: 'duration', 
            type: { displayName: ['u64'], type: 2 } 
          }
        ],
        returnType: { displayName: ['Result'], type: 3 },
        docs: ['Creates a new payment stream to the specified recipient']
      },
      {
        label: 'withdraw_from_stream',
        selector: '0x87654321',
        mutates: true,
        payable: false,
        args: [
          { 
            label: 'stream_id', 
            type: { displayName: ['u64'], type: 2 } 
          }
        ],
        returnType: { displayName: ['Result'], type: 3 },
        docs: ['Withdraws accumulated funds from a stream']
      },
      {
        label: 'cancel_stream',
        selector: '0xabcdef12',
        mutates: true,
        payable: false,
        args: [
          { 
            label: 'stream_id', 
            type: { displayName: ['u64'], type: 2 } 
          }
        ],
        returnType: { displayName: ['Result'], type: 3 },
        docs: ['Cancels an active stream and returns remaining funds']
      },
      {
        label: 'get_stream',
        selector: '0x11111111',
        mutates: false,
        payable: false,
        args: [
          { 
            label: 'stream_id', 
            type: { displayName: ['u64'], type: 2 } 
          }
        ],
        returnType: { displayName: ['Option', 'Stream'], type: 4 },
        docs: ['Gets details of a specific stream']
      },
      {
        label: 'get_stream_count',
        selector: '0x22222222',
        mutates: false,
        payable: false,
        args: [],
        returnType: { displayName: ['u64'], type: 2 },
        docs: ['Gets the total number of streams created']
      },
      {
        label: 'get_claimable_balance',
        selector: '0x33333333',
        mutates: false,
        payable: false,
        args: [
          { 
            label: 'stream_id', 
            type: { displayName: ['u64'], type: 2 } 
          }
        ],
        returnType: { displayName: ['Result', 'Balance'], type: 5 },
        docs: ['Gets the claimable balance for a stream']
      }
    ]
  },
  types: [
    {
      id: 0,
      type: {
        def: { variant: { variants: [] } },
        path: ['ink', 'LangError']
      }
    },
    {
      id: 1,
      type: {
        def: { composite: { fields: [{ type: 6 }] } },
        path: ['ink_primitives', 'types', 'H160']
      }
    },
    {
      id: 2,
      type: {
        def: { primitive: 'u64' },
        path: []
      }
    },
    {
      id: 3,
      type: {
        def: { primitive: 'u128' },
        path: []
      }
    }
  ]
};

// Helper function to convert SS58 addresses to H160 (20-byte Ethereum-style)
export function ss58ToH160(ss58Address) {
  try {
    // This requires @polkadot/util-crypto
    const { decodeAddress } = require('@polkadot/util-crypto');
    const { u8aToHex } = require('@polkadot/util');
    
    const decoded = decodeAddress(ss58Address);
    const hex = u8aToHex(decoded);
    // Take last 20 bytes (40 hex chars) for H160
    return '0x' + hex.slice(-40);
  } catch (e) {
    console.error('Error converting SS58 to H160:', e);
    return null;
  }
}

// Helper function to validate H160 addresses
export function isValidH160(address) {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

// Export contract info
export const CONTRACT_INFO = {
  address: contractAddress,
  network: ACTIVE_NETWORK,
  metadata: contractMetadata
};

export default CONTRACT_INFO;