#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod polkadot_stream {
    use ink::storage::Mapping;
    use ink::primitives::{U256, H160};

    /// Structure to hold all data for a single stream
    #[derive(Debug, Clone)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct Stream {
        sender: H160,
        recipient: H160,
        total_amount: U256,
        flow_rate: U256,
        start_time: Timestamp,
        stop_time: Timestamp,
        amount_withdrawn: U256,
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
        sender: H160,
        #[ink(topic)]
        recipient: H160,
        total_amount: U256,
        start_time: Timestamp,
        stop_time: Timestamp,
    }

    #[ink(event)]
    pub struct Withdrawn {
        #[ink(topic)]
        stream_id: u64,
        #[ink(topic)]
        recipient: H160,
        amount: U256,
    }

    #[ink(event)]
    pub struct StreamCancelled {
        #[ink(topic)]
        stream_id: u64,
        sender: H160,
        recipient: H160,
        sender_balance: U256,
        recipient_balance: U256,
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
            recipient: H160,
            duration: u64,
        ) -> Result<u64> {
            let transferred_value = self.env().transferred_value();
            
            // Validations
            if transferred_value == U256::zero() {
                return Err(Error::InvalidAmount);
            }
            
            // Check if recipient is zero address
            let zero_address = H160::from([0x0; 20]);
            if recipient == zero_address {
                return Err(Error::InvalidRecipient);
            }
            
            if duration == 0 {
                return Err(Error::InvalidDuration);
            }

            let stream_id = self.next_stream_id;
            self.next_stream_id = self.next_stream_id.saturating_add(1);

            let start_time = self.env().block_timestamp();
            let stop_time = start_time.saturating_add(duration.saturating_mul(1000));
            
            // Calculate flow rate per millisecond
            let duration_ms = U256::from(duration).saturating_mul(U256::from(1000));
            if duration_ms == U256::zero() {
                return Err(Error::InvalidDuration);
            }
            
            let flow_rate = transferred_value.checked_div(duration_ms)
                .ok_or(Error::InvalidDuration)?;
            
            if flow_rate == U256::zero() {
                return Err(Error::ZeroFlowRate);
            }

            let stream = Stream {
                sender: self.env().caller(),
                recipient,
                total_amount: transferred_value,
                flow_rate,
                start_time,
                stop_time,
                amount_withdrawn: U256::zero(),
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
        pub fn get_claimable_balance(&self, stream_id: u64) -> Result<U256> {
            let stream = self.streams.get(stream_id).ok_or(Error::StreamNotFound)?;

            if !stream.is_active {
                return Err(Error::StreamNotActive);
            }

            let current_time = self.env().block_timestamp();

            // If current time is before start time
            if current_time < stream.start_time {
                return Ok(U256::zero());
            }

            // If current time is after stop time, full remaining amount is claimable
            if current_time >= stream.stop_time {
                return Ok(stream.total_amount.saturating_sub(stream.amount_withdrawn));
            }

            // Calculate streamed amount based on time elapsed
            let time_elapsed = current_time.saturating_sub(stream.start_time);
            let streamed_amount = U256::from(time_elapsed).saturating_mul(stream.flow_rate);
            
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
            if claimable_amount == U256::zero() {
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
            if recipient_balance > U256::zero()
                && self.env().transfer(stream.recipient, recipient_balance).is_err()
            {
                return Err(Error::TransferFailed);
            }

            // Refund sender if they have balance
            if sender_balance > U256::zero()
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
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(U256::from(1000));

            let result = contract.create_stream(accounts.bob, 100);
            assert!(result.is_ok());
            assert_eq!(result.unwrap(), 1);
        }

        #[ink::test]
        fn get_claimable_balance_works() {
            let mut contract = PolkadotStream::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(U256::from(100000));

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
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(U256::from(100000));

            let stream_id = contract.create_stream(accounts.bob, 100).unwrap();
            
            ink::env::test::advance_block::<ink::env::DefaultEnvironment>();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            
            let result = contract.withdraw_from_stream(stream_id);
            assert!(result.is_ok());
        }
    }
}