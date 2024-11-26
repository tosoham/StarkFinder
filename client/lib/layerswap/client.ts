// lib/layerswap/client.ts
import type { LayerswapCreateSwapRequest, LayerswapCreateSwapResponse } from '@/lib/transaction/types';

export class LayerswapClient {
  private readonly API_URL = 'https://api.layerswap.io/api/swaps';
  private readonly API_KEY: string;

  constructor(apiKey: string) {
    this.API_KEY = apiKey;
  }

  async createSwap(request: LayerswapCreateSwapRequest): Promise<string> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'X-LS-APIKEY': this.API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      const data = await response.json() as LayerswapCreateSwapResponse;

      if (!response.ok || data.error) {
        throw new Error(data.error?.message || `Failed with status ${response.status}`);
      }

      return data.data.swap_id;
    } catch (error) {
      console.error('Layerswap create swap failed:', error);
      throw error;
    }
  }
}
