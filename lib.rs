#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod polkadot_stream {
    use ink::storage::Mapping;

    /// Structure to hold all data for a single stream
    #[derive(Debug, Clone)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct Stream {
        sender: AccountId,
        recipient: AccountId,
        total_amount: Balance,
        flow_rate: Balance,
        start_time: Timestamp,
        stop_time: Timestamp,
        amount_withdrawn: Balance,
        is_active: bool,
    }

    #[ink(storage)]
    pub struct PolkadotStream {
        streams: Mapping<u64, Stream>,
        next_stream_id: u64,
    }

    /// Events
    #[ink(event)]
    pub struct StreamCreated {
        #[ink(topic)]
        stream_id: u64,
        #[ink(topic)]
        sender: AccountId,
        #[ink(topic)]
        recipient: AccountId,
        total_amount: Balance,
        start_time: Timestamp,
        stop_time: Timestamp,
    }

    #[ink(event)]
    pub struct Withdrawn {
        #[ink(topic)]
        stream_id: u64,
        #[ink(topic)]
        recipient: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct StreamCancelled {
        #[ink(topic)]
        stream_id: u64,
        sender: AccountId,
        recipient: AccountId,
        sender_balance: Balance,
        recipient_balance: Balance,
    }

    /// Errors
    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        StreamNotActive,
        NotRecipient,
        NotAuthorized,
        NoFundsToWithdraw,
        TransferFailed,
        InvalidRecipient,
        InvalidDuration,
        InvalidAmount,
        ZeroFlowRate,
        StreamNotFound,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl Default for PolkadotStream {
        fn default() -> Self {
            Self::new()
        }
    }

    impl PolkadotStream {
        /// Constructor
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                streams: Mapping::new(),
                next_stream_id: 1,
            }
        }

        /// Creates a new money stream
        #[ink(message, payable)]
        pub fn create_stream(
            &mut self,
            recipient: AccountId,
            duration: u64,
        ) -> Result<u64> {
            let transferred_value = self.env().transferred_value();
            
            // Validations
            if transferred_value == 0 {
                return Err(Error::InvalidAmount);
            }
            if recipient == AccountId::from([0x0; 32]) {
                return Err(Error::InvalidRecipient);
            }
            if duration == 0 {
                return Err(Error::InvalidDuration);
            }

            let stream_id = self.next_stream_id;
            self.next_stream_id = self.next_stream_id.saturating_add(1);

            let start_time = self.env().block_timestamp();
            let stop_time = start_time.saturating_add(duration.saturating_mul(1000));
            
            // Calculate flow rate per millisecond - convert duration to u128 for division
            let duration_ms = u128::from(duration).saturating_mul(1000);
            let flow_rate = if duration_ms == 0 {
                return Err(Error::InvalidDuration);
            } else {
                transferred_value.saturating_div(duration_ms)
            };
            if flow_rate == 0 {
                return Err(Error::ZeroFlowRate);
            }

            let stream = Stream {
                sender: self.env().caller(),
                recipient,
                total_amount: transferred_value,
                flow_rate,
                start_time,
                stop_time,
                amount_withdrawn: 0,
                is_active: true,
            };

            self.streams.insert(stream_id, &stream);

            self.env().emit_event(StreamCreated {
                stream_id,
                sender: stream.sender,
                recipient: stream.recipient,
                total_amount: transferred_value,
                start_time,
                stop_time,
            });

            Ok(stream_id)
        }

        /// Calculates the claimable balance for a stream
        #[ink(message)]
        pub fn get_claimable_balance(&self, stream_id: u64) -> Result<Balance> {
            let stream = self.streams.get(stream_id).ok_or(Error::StreamNotFound)?;

            if !stream.is_active {
                return Err(Error::StreamNotActive);
            }

            let current_time = self.env().block_timestamp();

            // If current time is before start time
            if current_time < stream.start_time {
                return Ok(0);
            }

            // If current time is after stop time, full remaining amount is claimable
            if current_time >= stream.stop_time {
                return Ok(stream.total_amount.saturating_sub(stream.amount_withdrawn));
            }

            // Calculate streamed amount based on time elapsed
            let time_elapsed = current_time.saturating_sub(stream.start_time);
            let streamed_amount = (time_elapsed as u128).saturating_mul(stream.flow_rate);
            
            Ok(streamed_amount.saturating_sub(stream.amount_withdrawn))
        }

        /// Allows recipient to withdraw accrued funds
        #[ink(message)]
        pub fn withdraw_from_stream(&mut self, stream_id: u64) -> Result<()> {
            let mut stream = self.streams.get(stream_id).ok_or(Error::StreamNotFound)?;

            if !stream.is_active {
                return Err(Error::StreamNotActive);
            }

            let caller = self.env().caller();
            if caller != stream.recipient {
                return Err(Error::NotRecipient);
            }

            let claimable_amount = self.get_claimable_balance(stream_id)?;
            if claimable_amount == 0 {
                return Err(Error::NoFundsToWithdraw);
            }

            stream.amount_withdrawn = stream.amount_withdrawn.saturating_add(claimable_amount);
            self.streams.insert(stream_id, &stream);

            // Transfer funds to recipient
            if self.env().transfer(stream.recipient, claimable_amount).is_err() {
                return Err(Error::TransferFailed);
            }

            self.env().emit_event(Withdrawn {
                stream_id,
                recipient: stream.recipient,
                amount: claimable_amount,
            });

            Ok(())
        }

        /// Cancels a stream and refunds both parties
        #[ink(message)]
        pub fn cancel_stream(&mut self, stream_id: u64) -> Result<()> {
            let mut stream = self.streams.get(stream_id).ok_or(Error::StreamNotFound)?;

            if !stream.is_active {
                return Err(Error::StreamNotActive);
            }

            let caller = self.env().caller();
            if caller != stream.sender && caller != stream.recipient {
                return Err(Error::NotAuthorized);
            }

            let recipient_balance = self.get_claimable_balance(stream_id)?;
            let total_remaining = stream.total_amount.saturating_sub(stream.amount_withdrawn);
            let sender_balance = total_remaining.saturating_sub(recipient_balance);

            stream.is_active = false;
            self.streams.insert(stream_id, &stream);

            // Transfer to recipient if they have balance
            if recipient_balance > 0
                && self.env().transfer(stream.recipient, recipient_balance).is_err()
            {
                return Err(Error::TransferFailed);
            }

            // Refund sender if they have balance
            if sender_balance > 0
                && self.env().transfer(stream.sender, sender_balance).is_err()
            {
                return Err(Error::TransferFailed);
            }

            self.env().emit_event(StreamCancelled {
                stream_id,
                sender: stream.sender,
                recipient: stream.recipient,
                sender_balance,
                recipient_balance,
            });

            Ok(())
        }

        /// Get stream details
        #[ink(message)]
        pub fn get_stream(&self, stream_id: u64) -> Option<Stream> {
            self.streams.get(stream_id)
        }

        /// Get total number of streams created
        #[ink(message)]
        pub fn get_stream_count(&self) -> u64 {
            self.next_stream_id.saturating_sub(1)
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn create_stream_works() {
            let mut contract = PolkadotStream::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);

            let result = contract.create_stream(accounts.bob, 100);
            assert!(result.is_ok());
            assert_eq!(result.unwrap(), 1);
        }

        #[ink::test]
        fn get_claimable_balance_works() {
            let mut contract = PolkadotStream::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(100000);

            let stream_id = contract.create_stream(accounts.bob, 100).unwrap();
            
            ink::env::test::advance_block::<ink::env::DefaultEnvironment>();
            
            let balance = contract.get_claimable_balance(stream_id);
            assert!(balance.is_ok());
        }

        #[ink::test]
        fn withdraw_works() {
            let mut contract = PolkadotStream::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(100000);

            let stream_id = contract.create_stream(accounts.bob, 100).unwrap();
            
            ink::env::test::advance_block::<ink::env::DefaultEnvironment>();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            
            let result = contract.withdraw_from_stream(stream_id);
            assert!(result.is_ok());
        }
    }
}