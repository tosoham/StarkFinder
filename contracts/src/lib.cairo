use starknet::{
    ContractAddress, get_caller_address, get_block_timestamp, get_contract_address,
    contract_address_const, ClassHash,
};
use core::serde::Serde;

#[derive(Drop, Copy, starknet::Store, Serde)]
pub struct User {
    pub username: felt252,
    pub joined: u64,
    pub has_membership: bool,
    pub membership_expiration: u64,
}

#[starknet::interface]
pub trait IStarkfinder<TContractState> {
    fn register(ref self: TContractState, account: ContractAddress, username: felt252);
    fn get_user(self: @TContractState, account: ContractAddress) -> User;
    fn send_transaction(ref self: TContractState, to: ContractAddress, amount: u128);
    fn set_admin_wallet(ref self: TContractState, new_admin_wallet: ContractAddress);
}

#[starknet::interface]
pub trait IERC20<TContractState> {
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256);
    fn transferFrom(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    );
}


#[starknet::contract]
mod starkfinder {
    use super::{User, IERC20, IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::{
        ContractAddress, get_block_timestamp, get_caller_address, get_contract_address,
        contract_address_const,
    };
    use core::starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, Map, StoragePathEntry,
    };
    use core::serde::Serde;

    const TRANSACTION_FEE_PERCENTAGE: u128 = 100;// 1%
    const FEE_BASIS_POINTS: u128 = 10000;

    #[storage]
    struct Storage {
        users: Map<ContractAddress, User>,
        admin_wallet: ContractAddress,
        token_address: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        TransactionExecuted: TransactionExecuted,
        UserRegistered: UserRegistered,
        AdminWalletChanged: AdminWalletChanged,
    }

    #[derive(Drop, starknet::Event)]
    struct TransactionExecuted {
        from: ContractAddress,
        to: ContractAddress,
        amount: u128,
        fee: u128,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct UserRegistered {
        user: ContractAddress,
        username: felt252,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct AdminWalletChanged {
        previous_admin: ContractAddress,
        new_admin: ContractAddress,
        timestamp: u64,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, admin_wallet: ContractAddress, token_address: ContractAddress
    ) {
        self.admin_wallet.write(admin_wallet);
        self.token_address.write(token_address);
    }

    #[abi(embed_v0)]
    impl IStarkfinderImpl of super::IStarkfinder<ContractState> {
        //register account of the user.
        fn register(ref self: ContractState, account: ContractAddress, username: felt252) {
            let caller_address = get_caller_address();
            assert(account == caller_address, 'Register your own acc');

            //create a new user
            let user = User {
                username: username,
                joined: get_block_timestamp(),
                has_membership: false,
                membership_expiration: 0,
            };
            self.users.entry(account).write(user);

            // Emit
            self
                .emit(
                    Event::UserRegistered(
                        UserRegistered {
                            user: account, username: username, timestamp: get_block_timestamp(),
                        }
                    )
                );
        }

        // Send txn
        fn send_transaction(ref self: ContractState, to: ContractAddress, amount: u128) {

            let caller_address = get_caller_address();

            //read the user data
            let user = self.users.entry(caller_address).read();
            //user is registered?
            assert(user.joined != 0_u64, 'Caller is not a registered user');

            let fee = (amount * TRANSACTION_FEE_PERCENTAGE) / FEE_BASIS_POINTS;
            let total_amount = amount + fee;

            let eth_contract = IERC20Dispatcher { contract_address: self.token_address.read() };

            //caller's balance
            let caller_balance = eth_contract.balance_of(caller_address);
            let total_amount_u256 = total_amount.into();
            assert(caller_balance >= total_amount_u256, 'Insufficient balance');

            //allowance
            let allowance = eth_contract.allowance(caller_address, get_contract_address());
            assert(allowance >= total_amount_u256, 'Insufficient allowance');

            // Execute transfers
            // Transfer main amount to recipient
            eth_contract.transferFrom(caller_address, to, amount.into());

            // Transfer fee to admin wallet
            eth_contract.transferFrom(caller_address, self.admin_wallet.read(), fee.into());

            // Emit transaction event
            self
                .emit(
                    Event::TransactionExecuted(
                        TransactionExecuted {
                            from: caller_address, to, amount, fee, timestamp: get_block_timestamp(),
                        }
                    )
                );

        }

        //user information
        fn get_user(self: @ContractState, account: ContractAddress) -> User {
            self.users.entry(account).read()
        }

        /// Updates the admin wallet address
        fn set_admin_wallet(ref self: ContractState, new_admin_wallet: ContractAddress) {
            let caller_address = get_caller_address();
            let current_admin_wallet = self.admin_wallet.read();
            assert(caller_address == current_admin_wallet, 'Only admin privilege');

            // Emit
            self
                .emit(
                    Event::AdminWalletChanged(
                        AdminWalletChanged {
                            previous_admin: current_admin_wallet,
                            new_admin: new_admin_wallet,
                            timestamp: get_block_timestamp(),
                        }
                    )
                );

            self.admin_wallet.write(new_admin_wallet);
        }
    }
}
