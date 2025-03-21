// import { ArgentTMA } from "@argent/tma-wallet";
import { ArgentWebWallet } from "@argent/invisible-sdk";

let argentTMA: ArgentWebWallet | null = null;

export const getArgentTMA = () => {
  if (typeof window === "undefined") return null;

  if (!argentTMA) {
    argentTMA = ArgentWebWallet.init({
      environment: "sepolia",
      appName: "StarkFinder",
      sessionParams: {
        allowedMethods: [
          {
            contract: "*",
            selector: "*",
          },
        ],
        validityDays: 90,
      },
      paymasterParams: {
        apiKey: "avnu paymaster api key",
      },
    });
  }
  return argentTMA;
};
