/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/transaction/handlers/bridge.ts
import { BrianTransactionData, LayerswapRequest, TransactionStep } from '../types';
import { BaseTransactionHandler } from './base';
import { LayerswapClient } from '../../layerswap/client';

interface ParsedBridgeDetails {
  sourceNetwork: string;
  destinationNetwork: string;
  sourceToken: string;
  destinationToken: string;
  sourceAddress: string;
  destinationAddress: string;
  amount: number;
}

export class BridgeHandler extends BaseTransactionHandler {
  private layerswapClient: LayerswapClient;

  constructor(apiKey: string) {
    super();
    this.layerswapClient = new LayerswapClient(apiKey);
  }

  async processSteps(data: BrianTransactionData, params?: any): Promise<TransactionStep[]> {
    const swapId = await this.layerswapClient.createSwap({
      source: params.sourceNetwork,
      destination: params.destinationNetwork,
      amount: parseFloat(params.amount),
      source_asset: params.sourceToken,
      destination_asset: params.destinationToken,
      destination_address: params.destinationAddress,
      refuel: false
    });

    // Return transaction steps with swap ID
    return [{
      contractAddress: params.contractAddress || '',
      entrypoint: 'layerswap_bridge',
      calldata: [swapId]
    }];
  }
}
