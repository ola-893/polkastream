# Polkadot Stream - Real-Time Money Streaming

Stream payments per-second on Polkadot using ink! smart contracts. Built for the Polkadot Cloud hackathon.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with ink!](https://img.shields.io/badge/Built%20with-ink!-blue)](https://use.ink/)

## 🌊 Why This Can Only Be Built on Polkadot

Traditional blockchains face an impossible tradeoff when attempting real-time payment streaming: **either pay exorbitant gas fees for frequent micro-transactions, or sacrifice the real-time nature of streaming itself**. This is where Polkadot's unique architecture becomes not just beneficial, but **essential**.

### The Polkadot Advantage: Sub-Second Finality Meets Economic Viability

#### 1. Lightning-Fast Block Times (6 seconds)
Polkadot's parachain architecture delivers consistent 6-second block finality, enabling truly granular payment streams. While other chains might require 12-15 seconds or more per transaction, Polkadot ensures your withdrawals are confirmed nearly instantly—critical for a real-time streaming application.

#### 2. Predictable, Negligible Transaction Costs
Unlike Layer 1 chains where gas fees can spike unpredictably, Polkadot's shared security model and optimized resource allocation means micro-transactions remain economically viable. On Ethereum mainnet, streaming a $100 salary could cost $50+ in gas fees for the necessary withdrawal transactions. **On Polkadot, those same operations cost fractions of a cent.**

#### 3. Rust-Powered Smart Contracts with ink!
Polkadot Stream leverages **ink!**, Polkadot's Rust-based smart contract language, which offers:
- **Memory safety without garbage collection** - crucial for financial applications
- **Deterministic execution** - no surprise gas costs
- **Built-in overflow protection** - safeguarding user funds through Rust's type system
- **Smaller contract sizes** - lower deployment and execution costs
- **Native U256 support** - precise financial calculations without rounding errors

#### 4. Polkadot Cloud Architecture: Built for Scale
The Polkadot relay chain's shared security model means our contract inherits enterprise-grade security without the overhead. As adoption grows, Polkadot's horizontal scalability through parachains ensures performance never degrades—something impossible on monolithic chains.

### Why Not Ethereum L2s?
While L2 solutions offer lower fees, they introduce:
- **Bridging delays** when moving funds between layers
- **Fragmented liquidity** across multiple L2s
- **Dependency on L1 for final settlement**, introducing latency
- **Smart contract languages (Solidity)** less suited for financial precision than Rust

Polkadot provides L2-like performance **at the base layer**, with native cross-chain communication through XCM—no bridges required.

### Why Not Other L1s?
- **Solana**: Fast but frequent network instability makes it unreliable for continuous streams
- **Avalanche**: Higher base transaction costs make micro-transactions uneconomical
- **Cardano**: Slower block times (20s) break the real-time streaming experience
- **BNB Chain**: Centralization concerns for trust-critical financial applications

**Polkadot uniquely combines speed, cost-efficiency, stability, and decentralization—the exact quartet required for real-time money streaming.**

---

## 🎯 What is Polkadot Stream?

Polkadot Stream transforms static payments into **continuous, real-time flows of value**. Built on Polkadot's ink! smart contract platform, it enables true per-second money streaming—a financial primitive that was economically impossible until now.

### Real-World Use Cases

**💼 Payroll Revolution**  
Break the paycheck-to-paycheck cycle. Employees access their salary as they earn it—per second, per minute, per hour. No more waiting two weeks for money you've already worked for.

**📺 True Pay-As-You-Go Subscriptions**  
Stream payment while you use a service. Stop the subscription, payment stops immediately. Only pay for what you actually consume—down to the second.

**👨‍💻 Trustless Freelancing**  
Eliminate invoices, payment delays, and trust issues. As you deliver work, payment flows automatically in real-time. Complete transparency, zero friction.

**🎮 Gaming & Creator Economy**  
Stream rewards to players in real-time based on in-game activity. Enable new economic models for play-to-earn and creator compensation.

**🏥 Service Billing**  
Pay for consulting, legal services, or any time-based service as it happens. No more hourly rate disputes or billing surprises.

---

## 🚀 Quick Start

### Prerequisites
- Rust and Cargo installed ([rustup.rs](https://rustup.rs/))
- `cargo-contract` CLI tool
- Node.js and npm (for frontend)
- Polkadot.js browser extension

### 1. Build the Smart Contract

```bash
# Install cargo-contract if you haven't
cargo install cargo-contract --force

# Build the contract
cargo contract build --release

# The compiled contract will be in target/ink/
# You'll get: polkadot_stream.contract, polkadot_stream.wasm, polkadot_stream.json
```

### 2. Deploy to Testnet

#### Option A: Using cargo-contract CLI
```bash
# Deploy to Contracts on Rococo (testnet)
cargo contract instantiate \
  --constructor new \
  --suri //Alice \
  --url wss://rococo-contracts-rpc.polkadot.io

# Note the contract address from the output
```

#### Option B: Using Contracts UI (Recommended)
1. Visit [Contracts UI](https://contracts-ui.substrate.io/)
2. Connect to "Contracts on Rococo"
3. Click "Upload a new contract"
4. Upload `target/ink/polkadot_stream.contract`
5. Instantiate with constructor `new`
6. Copy the deployed contract address

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Update CONTRACT_ADDRESS in src/App.jsx with your deployed contract address
# Update the contract metadata path to point to ../target/ink/polkadot_stream.json

# Start dev server
npm run dev
```

### 4. Get Testnet Tokens

1. Install [Polkadot.js Extension](https://polkadot.js.org/extension/)
2. Create or import an account
3. Get ROC testnet tokens from the [Rococo Faucet](https://faucet.polkadot.io/)
4. Connect your wallet to the dApp

---

## 📝 Smart Contract API

### Core Functions

#### `create_stream(recipient, duration)`
Create a new payment stream

**Parameters:**
- `recipient`: H160 - Address to receive the stream
- `duration`: u64 - Stream duration in seconds

**Payable:** Yes - the transferred value becomes the stream amount

**Returns:** `Result<u64>` - Stream ID on success

**Example:**
```rust
// Create a 1-hour stream with 1000 units
contract.create_stream(recipient_address, 3600)
  .value(1000)
  .call()
```

#### `withdraw_from_stream(stream_id)`
Recipient withdraws accumulated funds from a stream

**Parameters:**
- `stream_id`: u64 - ID of the stream

**Returns:** `Result<()>`

**Access:** Only the stream recipient

**Example:**
```rust
contract.withdraw_from_stream(1).call()
```

#### `cancel_stream(stream_id)`
Cancel a stream and refund both parties fairly

**Parameters:**
- `stream_id`: u64 - ID of the stream

**Returns:** `Result<()>`

**Access:** Stream sender or recipient

**How it works:**
- Calculates recipient's earned amount up to cancellation time
- Transfers earned amount to recipient
- Refunds remaining amount to sender
- Marks stream as inactive

#### `get_claimable_balance(stream_id)`
View how much can be withdrawn from a stream

**Parameters:**
- `stream_id`: u64 - ID of the stream

**Returns:** `Result<U256>` - Claimable amount

**View only:** Does not modify state

#### `get_stream(stream_id)`
Get full details of a stream

**Parameters:**
- `stream_id`: u64 - ID of the stream

**Returns:** `Option<Stream>` - Stream details or None

**Stream Structure:**
```rust
pub struct Stream {
    sender: H160,
    recipient: H160,
    total_amount: U256,
    flow_rate: U256,        // Tokens per millisecond
    start_time: Timestamp,
    stop_time: Timestamp,
    amount_withdrawn: U256,
    is_active: bool,
}
```

#### `get_stream_count()`
Get total number of streams created

**Returns:** `u64` - Total stream count

---

## ✨ Features

- ✅ **Real-time per-second payment streaming** powered by Polkadot's 6-second finality
- ✅ **Millisecond-precision calculations** using Polkadot's block timestamps
- ✅ **Create streams with custom duration** - flexible from seconds to years
- ✅ **Withdraw accumulated funds anytime** - access earned value on-demand
- ✅ **Cancel streams and get automatic fair refunds** - trustless settlement
- ✅ **Beautiful React UI with Tailwind CSS** - intuitive, modern interface
- ✅ **Polkadot.js wallet integration** - seamless account management
- ✅ **Production-ready ink! contract** - memory-safe Rust with overflow protection
- ✅ **Comprehensive event emissions** - track all stream lifecycle events
- ✅ **H160 address support** - compatible with Ethereum-style addresses

---

## 🛡️ Security Features

Built with Rust and ink!, Polkadot Stream inherits powerful safety guarantees:

- ✅ **Saturating arithmetic** - impossible overflow/underflow attacks
- ✅ **Checked division operations** - safe mathematical operations with zero checks
- ✅ **Strict access control** - only authorized parties can perform actions
- ✅ **Safe transfer patterns** - protected against reentrancy
- ✅ **Zero address validation** - prevents accidental burns
- ✅ **Comprehensive event logging** - full audit trail
- ✅ **Type-safe U256 operations** - precise financial calculations
- ✅ **No floating point math** - eliminates rounding errors

### Security Validations

The contract performs rigorous validation:
- Zero amount transfers are rejected
- Zero address recipients are rejected  
- Zero duration streams are rejected
- Zero flow rates are rejected (prevents division issues)
- Non-recipients cannot withdraw
- Inactive streams cannot be used
- Stream ID existence is always checked

---

## 💡 How It Works

1. **Create Stream**: Sender deposits tokens and specifies recipient + duration
2. **Flow Rate Calculation**: Contract computes precise tokens/millisecond rate
   ```
   flow_rate = total_amount / (duration_seconds * 1000)
   ```
3. **Continuous Streaming**: Balance accrues in real-time using block timestamps
   ```
   streamed_amount = time_elapsed_ms * flow_rate
   claimable = streamed_amount - amount_withdrawn
   ```
4. **Millisecond Precision**: Leverages Polkadot's timestamp accuracy for fairness
5. **Flexible Withdrawal**: Recipient can withdraw any time, multiple times
6. **Fair Cancellation**: Either party can cancel with automatic balance splitting

---

## 🧪 Testing

### Run Unit Tests

```bash
# Run all tests
cargo test

# Run with detailed output
cargo test -- --nocapture

# Run specific test
cargo test create_stream_works
```

### Test Coverage

The contract includes tests for:
- ✅ Stream creation
- ✅ Claimable balance calculation
- ✅ Withdrawals
- ✅ Access control
- ✅ Edge cases

### Manual Testing on Testnet

1. Deploy contract to Rococo testnet
2. Create a test stream with short duration (60 seconds)
3. Wait 30 seconds and check claimable balance
4. Withdraw as recipient
5. Verify balances update correctly
6. Test cancellation functionality

---

## 🏗️ Project Structure

```
polkadot_stream/
├── lib.rs                  # ink! smart contract (Rust)
│   ├── Stream struct
│   ├── Events (StreamCreated, Withdrawn, StreamCancelled)
│   ├── Error types
│   └── Contract logic
├── Cargo.toml             # Rust dependencies
├── frontend/              # React frontend
│   ├── src/
│   │   ├── App.jsx       # Main React component
│   │   ├── main.jsx      # Entry point
│   │   └── index.css     # Tailwind styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

---

## 🔧 Configuration

### Contract Configuration

The contract uses these key parameters:
- **U256** for all monetary values (prevents overflow)
- **H160** for addresses (20-byte Ethereum-compatible)
- **Timestamp** for time tracking (millisecond precision)
- **Mapping** for efficient stream storage

### Frontend Configuration (`src/App.jsx`)

Update these constants:
```javascript
const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS_HERE';
const WS_PROVIDER = 'wss://rococo-contracts-rpc.polkadot.io';
```

### Supported Networks

- **Rococo Contracts Parachain** (testnet): `wss://rococo-contracts-rpc.polkadot.io`
- **Local Development Node**: `ws://127.0.0.1:9944`
- **Custom Parachain**: Configure your own endpoint

To run a local development node:
```bash
# Using substrate-contracts-node
substrate-contracts-node --dev --tmp
```

---

## 🎨 Frontend Stack

- **React 18** - Modern UI framework with hooks
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first styling framework
- **@polkadot/api** - Polkadot blockchain interaction library
- **@polkadot/api-contract** - Contract-specific APIs
- **@polkadot/extension-dapp** - Browser wallet integration
- **Lucide React** - Beautiful, consistent icon library

### Frontend Features

- 🔐 Wallet connection with Polkadot.js extension
- 📊 Real-time stream status and balance updates
- 💸 Create streams with intuitive form
- 🔄 Withdraw funds with one click
- ❌ Cancel streams with confirmation
- 📱 Responsive design for mobile and desktop
- ⚡ Fast, optimistic UI updates

---

## 📦 Contract Metadata

After building, you'll find these files in `target/ink/`:

- **polkadot_stream.contract** - Complete deployable bundle
- **polkadot_stream.wasm** - WebAssembly bytecode
- **polkadot_stream.json** - Contract ABI/metadata

The metadata JSON includes:
- Contract specification
- Constructor and message definitions
- Event definitions
- Type information

This metadata is imported by the frontend to interact with the contract's ABI.

---

## 🚧 Future Enhancements

### Phase 1: Enhanced UX
- [ ] Visual stream progress bars with real-time countup
- [ ] Stream history dashboard with filtering
- [ ] Notification system for milestones (50%, 100%, etc.)
- [ ] Mobile-optimized interface

### Phase 2: Advanced Features
- [ ] Multi-token support (DOT, USDT, custom tokens)
- [ ] Recurring streams (monthly salary automation)
- [ ] Stream templates (salary, subscription, vesting)
- [ ] Batch stream creation
- [ ] Stream transfer/delegation

### Phase 3: Enterprise & Cross-Chain
- [ ] DAO treasury integration
- [ ] Cross-chain streaming via XCM (Polkadot's native interoperability)
- [ ] Analytics dashboard for businesses
- [ ] API for third-party integrations
- [ ] Escrow and milestone-based releases

### Phase 4: Ecosystem Integration
- [ ] Integration with Polkadot DEXs for auto-conversion
- [ ] NFT-gated streams
- [ ] Reputation system for reliable payers
- [ ] Mobile app (iOS/Android)

---

## 📚 Resources

### Polkadot Ecosystem
- [ink! Documentation](https://use.ink/) - Smart contract language guide
- [Polkadot.js API Docs](https://polkadot.js.org/docs/api) - JavaScript API reference
- [Substrate Contracts Node](https://github.com/paritytech/substrate-contracts-node) - Local development
- [Polkadot Wiki](https://wiki.polkadot.network/) - Comprehensive ecosystem guide

### Tools & Infrastructure
- [Contracts UI](https://contracts-ui.substrate.io/) - Deploy and interact with contracts
- [Polkadot.js Extension](https://polkadot.js.org/extension/) - Browser wallet
- [Rococo Faucet](https://faucet.polkadot.io/) - Get testnet tokens

### Learning Resources
- [ink! Examples](https://github.com/paritytech/ink-examples)
- [Substrate Docs](https://docs.substrate.io/)
- [Web3 Foundation Grants](https://grants.web3.foundation/)

---

## 🐛 Troubleshooting

### Common Issues

**Contract build fails:**
```bash
# Update Rust toolchain
rustup update stable
rustup target add wasm32-unknown-unknown

# Clear build cache
cargo clean
cargo contract build --release
```

**"Contract not found" error:**
- Verify contract address in frontend configuration
- Ensure you're connected to the correct network
- Check that contract is deployed on the selected network

**Transaction fails:**
- Ensure sufficient balance for gas fees
- Check that stream duration > 0
- Verify recipient address is valid
- Confirm you're sending value with create_stream

**Frontend can't connect to wallet:**
- Install Polkadot.js extension
- Authorize the site in extension settings
- Refresh the page after granting permissions

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🤝 Contributing

Contributions welcome! This is a hackathon project building the future of real-time finance on Polkadot.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/polkadot-stream.git
cd polkadot-stream

# Build contract
cargo contract build

# Run tests
cargo test

# Setup frontend
cd frontend && npm install

# Start development
npm run dev
```

---

## 🏆 Built for Polkadot Cloud Hackathon

**Theme**: User-centric Apps  
**Category**: Real-time Finance Primitive  
**Hackathon**: Build Resilient Apps with Polkadot Cloud

*Radically open, radically useful.*

---

## 🌟 Why It Matters

**Polkadot Stream exists because Polkadot makes it possible.** 

No other blockchain offers the combination of:
- ⚡ **Speed** - 6-second finality for near-instant withdrawals
- 💰 **Cost-efficiency** - Fraction-of-a-cent transactions make streaming viable
- 🦀 **Developer experience** - Rust's safety guarantees protect user funds
- 🔗 **Interoperability** - Native cross-chain via XCM (future-ready)

This isn't just an improvement on existing solutions—**it's a financial primitive that couldn't exist anywhere else.**

Traditional finance locks value in time. Polkadot Stream unlocks it.

---

## 📧 Contact

For questions, feedback, or collaboration:
- **Devpost**: [Your Devpost Profile]
- **GitHub**: [Your GitHub]
- **Twitter/X**: [@YourHandle]

Built with ❤️ on Polkadot