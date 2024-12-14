import { ArgentTMA } from '@argent/tma-wallet';

let argentTMA: ArgentTMA | null = null;

export const getArgentTMA = () => {
  if (typeof window === 'undefined') return null;
  
  if (!argentTMA) {
    argentTMA = ArgentTMA.init({
      environment: "sepolia",
      appName: "StarkFinder",
      appTelegramUrl: "https://t.me/starkfinder_bot/strk00",
      sessionParams: {
        allowedMethods: [
          {
            contract: "*",
            selector: "*",
          }
        ],
        validityDays: 90
      },
    });
  }

  return argentTMA;
};
