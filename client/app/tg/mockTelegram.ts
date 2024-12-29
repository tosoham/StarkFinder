/* eslint-disable @typescript-eslint/no-unused-vars */
// Create a new file: app/tg/mockTelegram.ts
export const mockTelegramWebApp = {
    ready: () => console.log('Mock WebApp Ready'),
    backgroundColor: '#1f1f1f',
    textColor: '#ffffff',
    buttonColor: '#3390ec',
    buttonTextColor: '#ffffff',
    MainButton: {
      text: '',
      color: '#3390ec',
      textColor: '#ffffff',
      isVisible: false,
      isActive: true,
      isProgressVisible: false,
      setText: function(text: string) {
        this.text = text;
        console.log('MainButton text set:', text);
      },
      show: function() {
        this.isVisible = true;
        console.log('MainButton shown');
      },
      hide: function() {
        this.isVisible = false;
        console.log('MainButton hidden');
      },
      onClick: (callback: () => void) => {
        console.log('MainButton click handler set');
      }
    },
    initData: "mock_init_data",
    initDataUnsafe: {
      user: {
        id: 12345,
        first_name: "Test",
        last_name: "User",
        username: "testuser",
        language_code: "en"
      },
      query_id: "mock_query_id"
    },
    enableClosingConfirmation: () => console.log('Closing confirmation enabled'),
    onEvent: (eventType: string, callback: () => void) => {
      console.log(`Event handler set for: ${eventType}`);
    }
  };