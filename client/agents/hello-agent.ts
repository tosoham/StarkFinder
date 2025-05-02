import { Agent } from '@elizaos/core';

// Create a new StarkFinder agent that sends a simple greeting message
const agent = new Agent({
  name: 'starkfinder-hello-agent',
  description: 'A simple hello world agent for StarkFinder',
  
  // Define the respond handler that will be triggered when the agent receives a message
  respond: async (message: any) => {
    console.log('Received message:', message);
    
    // Send our hello message
    return {
      content: 'Hello from StarkFinder!',
    };
  },
});

// Export the agent
export default agent;