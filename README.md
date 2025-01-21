# StarkFinder: Your AI-Powered Starknet Navigator

![image](https://github.com/user-attachments/assets/22bf72f4-0edd-4af6-a3c2-1397e85ca0f8)


## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Using StarkFinder](#using-starkfinder)
  - [Available Agents](#available-agents)
    - [Trade Agent](#trade-agent)
    - [Investment Agent](#investment-agent)
    - [Exploration Agent](#exploration-agent)
    - [Research Agent](#research-agent)
- [Future Plans](#future-plans)
- [Contributing](#contributing)
- [License](#license)

## Introduction
StarkFinder is an innovative AI-powered application that helps users navigate the Starknet ecosystem with ease. Developed for the EthGlobal AI Web3 Hackathon, StarkFinder leverages the power of multi-agent AI to automate various tasks, making the Starknet experience more efficient and streamlined for users.

## Features
- **Multi-Agent Architecture**: StarkFinder supports a diverse set of specialized agents, each with its own capabilities, such as trading, investing, exploring, and researching Starknet protocols.
- **Starknet Integration**: The agents seamlessly interact with the Starknet Layer 2 network, allowing users to leverage the benefits of this high-performance blockchain.
- **Conversational Interface**: Users can communicate with the agents through an intuitive chat-like interface, making the experience natural and user-friendly.
- **Automation and Task Delegation**: Users can delegate tasks to the agents, which will then execute them on their behalf, saving time and effort.
- **Comprehensive Starknet Insights**: The application provides users with in-depth information about Starknet, including DeFi platforms, trading opportunities, and research insights.

## Architecture
StarkFinder is built using the following technologies:

- **Next.js**: A React framework for building server-rendered and static websites.
- **Prisma**: A type-safe ORM for interacting with the database.
- **PostgreSQL**: The relational database used for storing user data and agent configurations.
- **TypeScript**: A superset of JavaScript that adds optional static typing.
- **Cairo**: A domain-specific language used for writing Starknet smart contracts.

The application's architecture follows a multi-agent design, where each agent specializes in a specific task or domain. The agents communicate with the Starknet network through a set of APIs and integrate with various Starknet-based protocols and services.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- PostgreSQL (version 12 or higher)
- Create `.env` file both in `client` and `tg_bot` directories with different `DATABASE_URL`. For BrianAI API key go to their [app](https://www.brianknows.org/app) connect wallet and get your key.

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/username/StarkFinder.git
   ```
2. Navigate to the project directory:
   ```
   cd StarkFinder
   ```
3. Install the dependencies:
   ```
   cd client
   npm install
   cd ..
   cd tg_bot
   npm install
   ```
4. Set up the database (both into `client` and `tg_bot` directories):
   ```
   npx prisma generate
   npx prisma migrate dev
   ```
5. Start the development server:
   ```
   npm run dev
   ```
### Setting up Telegram Test Environment
- Please go through this [doc](https://docs.ton.org/v3/guidelines/dapps/tma/guidelines/testing-apps) to setup the telegram mini app test environment
## Using StarkFinder

### Available Agents

#### Trade Agent
The Trade Agent is responsible for executing trades on the Starknet network based on user-defined conditions. Users can interact with this agent using the `/trade` command.

#### Investment Agent
The Investment Agent researches and automatically invests in Starknet-based decentralized finance (DeFi) platforms on the user's behalf. Users can interact with this agent using the `/invest` command.

#### Exploration Agent
The Exploration Agent helps users discover new Starknet-based projects, protocols, and services. Users can interact with this agent using the `/explore` command.

#### Research Agent
The Research Agent provides in-depth analysis and insights about the Starknet ecosystem. Users can interact with this agent using the `/research` command.

## Future Plans
In the future, the StarkFinder team plans to expand the application's capabilities by integrating with more Starknet-based protocols and services. Additionally, the team aims to explore the integration of XMTP (Cross-Message Transport Protocol) to enhance the decentralized and secure communication between the agents and users.

## Contributing
Contributions to the StarkFinder project are welcome. If you'd like to contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them.
4. Push your changes to your forked repository.
5. Submit a pull request to the original repository.

## License
This project is licensed under the [MIT License](LICENSE).
