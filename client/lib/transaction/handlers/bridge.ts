/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrianTransactionData, TransactionStep } from '../types';
import { BaseTransactionHandler } from './base';
import { LayerswapClient } from '../../layerswap/client';

// const NETWORK_MAPPING = {
//   'starknet': 'STARKNET_MAINNET',
//   'base': 'BASE_MAINNET',
//   'ethereum': 'ETHEREUM_MAINNET',
//   'arbitrum': 'ARBITRUM_MAINNET',
//   'optimism': 'OPTIMISM_MAINNET'
// } as const;

export class BridgeHandler extends BaseTransactionHandler {
  private layerswapClient: LayerswapClient;

  constructor(apiKey: string) {
    super();
    this.layerswapClient = new LayerswapClient(apiKey);
  }

  async processSteps(data: BrianTransactionData, params?: any): Promise<TransactionStep[]> {
    try {
      // Extract addresses from parameters
      const sourceAddress = data.bridge?.sourceAddress || params.address;
      const destinationAddress = data.bridge?.destinationAddress || params.address;

      // Create layerswap request
      const request = {
        sourceNetwork: this.formatNetwork(params.chain || 'starknet'),
        destinationNetwork: this.formatNetwork(params.dest_chain || 'base'),
        sourceToken: params.token1.toUpperCase(),
        destinationToken: params.token2.toUpperCase(),
        amount: parseFloat(params.amount),
        sourceAddress,
        destinationAddress
      };

      console.log('Layerswap Request:', JSON.stringify(request, null, 2));

      try {
        const response = await this.layerswapClient.createSwap(request);
        console.log('Layerswap Response:', JSON.stringify(response, null, 2));

        // Extract and return deposit actions
        if (response.data?.deposit_actions?.[0]?.call_data) {
          const depositActions = JSON.parse(response.data.deposit_actions[0].call_data) as TransactionStep[];
          return depositActions;
        }

        throw new Error('No deposit actions in Layerswap response');
      } catch (error) {
        console.error('Layerswap API error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Bridge processing error:', error);
      throw error;
    }
  }

  private formatNetwork(network: string): string {
    const normalized = network.toLowerCase();
    switch (normalized) {
      case 'starknet':
        return 'STARKNET_MAINNET';
      case 'base':
        return 'BASE_MAINNET';
      case 'ethereum':
        return 'ETHEREUM_MAINNET';
      case 'arbitrum':
        return 'ARBITRUM_MAINNET';
      case 'optimism':
        return 'OPTIMISM_MAINNET';
      default:
        return network.toUpperCase();
    }
  }
}
