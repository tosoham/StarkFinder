export const NOSTRA_TOKENS = {
    'strk': {
      token: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
      iToken: '0x026c5994c2462770bbf940552c5824fb0e0920e2a8a5ce1180042da1b3e489db'
    },
    'eth': {
      token: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      iToken: '0x076bb5a142fa1e6b6a44d055b3cd6e31401ebbc76b6873b9f8a3f180f5b4870e'
    }
  } as const;
  
  export const STARKNET_RPC_URL = process.env.STARKNET_RPC_URL || "https://starknet-mainnet.public.blastapi.io";
  