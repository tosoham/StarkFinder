// // lib/telegram/starknet-connector.ts
// import { connect, disconnect } from 'starknetkit';
// import type { 
//   ConnectOptions, 
//   StarknetWindowObject,
//   ModalResult
// } from 'starknetkit';

// export interface WalletConnection {
//   address: string | null;
//   error?: string;
// }

// export class StarknetConnector {
//   async connectWallet(): Promise<WalletConnection> {
//     try {
//       const connectConfig: ConnectOptions = {
//         modalMode: "alwaysAsk",
//         dappName: "StarkFinder Bot",
//         modalTheme: {
//           primaryColor: "#4F46E5", // Customize this
//           radius: "medium",
//           mode: "dark"
//         },
//         webWalletUrl: "https://web.argent.xyz",
//         argentMobileOptions: {
//           dappName: "StarkFinder Bot",
//           projectId: process.env.WALLETCONNECT_PROJECT_ID || '',
//           chainId: 'SN_MAIN'
//         }
//       };

//       const connection: ModalResult = await connect(connectConfig);
      
//       // Check if we have a successful connection
//       if (connection && connection.wallet) {
//         const starknetObject = connection.wallet as StarknetWindowObject;
        
//         if (starknetObject.isConnected && starknetObject.account) {
//           return {
//             address: starknetObject.account.address
//           };
//         }
//       }

//       return {
//         address: null,
//         error: 'Failed to connect wallet'
//       };

//     } catch (error) {
//       console.error('Error connecting wallet:', error);
//       return {
//         address: null,
//         error: error instanceof Error ? error.message : 'Unknown error connecting wallet'
//       };
//     }
//   }

//   async disconnectWallet(): Promise<void> {
//     try {
//       await disconnect({
//         clearLastWallet: true
//       });
//     } catch (error) {
//       console.error('Error disconnecting wallet:', error);
//       throw error;
//     }
//   }
// }