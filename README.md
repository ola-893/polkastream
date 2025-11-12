# Polkadot Stream - Real-Time Money Streaming

Stream payments per-second on Polkadot using ink! smart contracts.

## 🏗️ Project Structure

```
polkadot_stream/
├── lib.rs                  # ink! smart contract
├── Cargo.toml             # Rust dependencies
├── frontend/              # React frontend
│   ├── src/
│   │   ├── App.jsx       # Main React component
│   │   └── main.jsx      # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🚀 Quick Start

### 1. Build the Smart Contract

```bash
# Install cargo-contract if you haven't
cargo install cargo-contract --force

# Build the contract
cargo contract build

# The compiled contract will be in target/ink/
```

### 2. Deploy to Testnet

```bash
# Deploy to Contracts on Rococo (testnet)
cargo contract instantiate \
  --constructor new \
  --suri //Alice \
  --url wss://rococo-contracts-rpc.polkadot.io

# Note the contract address from the output
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Update CONTRACT_ADDRESS in src/App.jsx with your deployed contract address

# Start dev server
npm run dev
```

### 4. Install Polkadot.js Extension

- Install from: https://polkadot.js.org/extension/
- Create or import an account
- Connect to Rococo testnet and get some test ROC tokens from the faucet

## 📝 Contract Functions

### `create_stream(recipient, duration)`
Create a new payment stream
- **recipient**: Address to receive the stream
- **duration**: Stream duration in seconds
- **value**: Amount to stream (sent with transaction)

### `withdraw_from_stream(stream_id)`
Recipient withdraws accumulated funds from a stream

### `cancel_stream(stream_id)`
Sender or recipient cancels a stream and refunds remaining balance

### `get_claimable_balance(stream_id)`
View how much can be withdrawn from a stream

### `get_stream(stream_id)`
Get full details of a stream

## 🎯 Features

- ✅ Real-time per-second payment streaming
- ✅ Create streams with custom duration
- ✅ Withdraw accumulated funds anytime
- ✅ Cancel streams and get refunds
- ✅ Beautiful React UI with Tailwind CSS
- ✅ Polkadot.js wallet integration
- ✅ Production-ready ink! contract with overflow protection

## 🧪 Testing

```bash
# Run contract tests
cargo test

# Run with output
cargo test -- --nocapture
```

## 📦 Contract Metadata

After building, the contract metadata JSON is located at:
```
target/ink/polkadot_stream.json
```

This file is imported by the frontend to interact with the contract.

## 🔧 Configuration

### Frontend Configuration (`src/App.jsx`)

Update these constants:
```javascript
const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS_HERE';
const WS_PROVIDER = 'wss://rococo-contracts-rpc.polkadot.io';
```

### Supported Networks

- **Rococo Contracts Parachain** (testnet): `wss://rococo-contracts-rpc.polkadot.io`
- **Local Development**: `ws://127.0.0.1:9944`

## 💡 How It Works

1. **Create Stream**: Sender deposits tokens and specifies recipient + duration
2. **Flow Rate**: Contract calculates tokens/second flow rate
3. **Streaming**: Recipient can withdraw accumulated tokens at any time
4. **Per-Second Precision**: Uses millisecond timestamps for accurate streaming
5. **Cancellation**: Either party can cancel and split remaining balance fairly

## 🛡️ Security Features

- ✅ Saturating arithmetic (no overflow/underflow)
- ✅ Checked division operations
- ✅ Proper access control (only recipient can withdraw)
- ✅ Safe transfer patterns
- ✅ Event emissions for transparency

## 📚 Resources

- [ink! Documentation](https://use.ink/)
- [Polkadot.js API](https://polkadot.js.org/docs/api)
- [Substrate Contracts Node](https://github.com/paritytech/substrate-contracts-node)

## 🎨 Frontend Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **@polkadot/api** - Polkadot blockchain interaction
- **@polkadot/extension-dapp** - Wallet integration
- **Lucide React** - Icons

## 🚧 Next Steps

1. Add stream visualization (progress bars, real-time updates)
2. Implement stream history and analytics
3. Add multi-token support
4. Create stream templates (salary, subscriptions, etc.)
5. Add notification system for stream events

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! This is a hackathon project for the Polkadot ecosystem.