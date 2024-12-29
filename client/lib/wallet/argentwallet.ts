import { ArgentTMA } from '@argent/tma-wallet';

let argentTMA: ArgentTMA | null = null;

export const getArgentTMA = () => {
  if (typeof window === 'undefined') return null;
  
  if (!argentTMA) {
    argentTMA = ArgentTMA.init({
      environment: "sepolia",
      appName: "strkfinder1511",
      appTelegramUrl: "https://t.me/strkfinder1511_bot/strk_1511",
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