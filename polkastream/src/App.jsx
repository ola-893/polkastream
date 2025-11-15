import { useEffect, useState } from 'react';

// Mock components since we can't import the actual ones
const Header = ({ walletAddress, networkName, accounts, selectedAccount, setSelectedAccount, onConnect }) => {
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Polkadot Stream</h1>
              <p className="text-xs text-slate-400">Real-time payments</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {walletAddress ? (
              <>
                <span className="rounded-full bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-300">
                  {networkName}
                </span>
                {accounts?.length > 1 ? (
                  <select
                    value={selectedAccount?.address || ''}
                    onChange={(e) => {
                      const account = accounts.find(a => a.address === e.target.value);
                      setSelectedAccount(account);
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm text-white"
                  >
                    {accounts.map((account) => (
                      <option key={account.address} value={account.address}>
                        {account.meta?.name} ({formatAddress(account.address)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="rounded-full bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-300">
                    {formatAddress(walletAddress)}
                  </span>
                )}
              </>
            ) : (
              <button
                onClick={onConnect}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const Hero = ({ networkName }) => (
  <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-8">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
        Live on {networkName}
      </div>
      <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
        Stream payments in real-time
      </h2>
      <p className="mt-3 max-w-2xl text-slate-400">
        Create programmable token flows with per-second streaming. Send payments continuously with sub-second finality on Polkadot.
      </p>
    </div>
  </div>
);

const CreateStreamForm = ({
  recipient,
  setRecipient,
  amountToken,
  setAmountToken,
  durationSeconds,
  setDurationSeconds,
  onSubmit,
  tokenSymbol = 'PAS'
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-slate-300">
        Recipient Address
      </label>
      <input
        type="text"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        required
      />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-slate-300">
          Amount ({tokenSymbol})
        </label>
        <input
          type="text"
          value={amountToken}
          onChange={(e) => setAmountToken(e.target.value)}
          placeholder="10.0"
          className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300">
          Duration (seconds)
        </label>
        <input
          type="number"
          value={durationSeconds}
          onChange={(e) => setDurationSeconds(e.target.value)}
          placeholder="3600"
          min="1"
          className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          required
        />
      </div>
    </div>
    <button
      type="submit"
      className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-cyan-700"
    >
      Create Stream
    </button>
  </form>
);

const StreamCard = ({ stream, variant, formatToken, onWithdraw, onCancel, tokenSymbol = 'PAS' }) => {
  const nowSec = Math.floor(Date.now() / 1000);
  const startTime = parseInt(String(stream.startTime).replace(/,/g, ''));
  const stopTime = parseInt(String(stream.stopTime).replace(/,/g, ''));
  const elapsed = Math.max(0, Math.min(nowSec, stopTime) - startTime);
  const duration = Math.max(1, stopTime - startTime);
  const progressPct = Math.min(100, (elapsed / duration) * 100);

  return (
    <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-500">Stream #{stream.id}</div>
          <div className="text-sm text-slate-400">
            {variant === 'incoming' ? 'From' : 'To'}{' '}
            <span className="font-mono">{stream[variant === 'incoming' ? 'sender' : 'recipient'].slice(0, 6)}...{stream[variant === 'incoming' ? 'sender' : 'recipient'].slice(-4)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-white">
            {formatToken(stream.totalAmount)} {tokenSymbol}
          </div>
          <div className="text-xs text-slate-400">
            {formatToken(stream.flowRate)} {tokenSymbol}/s
          </div>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {variant === 'incoming' && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
          <span className="text-sm text-slate-400">Claimable</span>
          <span className="font-mono text-sm font-medium text-cyan-400">
            {formatToken(stream.claimableInitial)} {tokenSymbol}
          </span>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {variant === 'incoming' && (
          <button
            onClick={() => onWithdraw?.(stream.id)}
            disabled={!stream.isActive}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            Withdraw
          </button>
        )}
        <button
          onClick={() => onCancel?.(stream.id)}
          disabled={!stream.isActive}
          className="flex-1 rounded-lg border border-red-900/50 bg-red-950/50 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-950 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const StreamList = ({ title, emptyText, isLoading, streams, variant, formatToken, tokenSymbol, onWithdraw, onCancel }) => (
  <div>
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {isLoading && <div className="text-sm text-slate-400">Loading...</div>}
    </div>
    {!isLoading && streams.length === 0 ? (
      <div className="rounded-xl border border-slate-800/50 bg-slate-900/30 p-8 text-center">
        <div className="text-4xl opacity-50">💧</div>
        <p className="mt-2 text-sm text-slate-400">{emptyText}</p>
      </div>
    ) : (
      <div className="space-y-3">
        {streams.map((s) => (
          <StreamCard
            key={`${variant}-${s.id}`}
            stream={s}
            variant={variant}
            formatToken={formatToken}
            tokenSymbol={tokenSymbol}
            onWithdraw={onWithdraw}
            onCancel={onCancel}
          />
        ))}
      </div>
    )}
  </div>
);

// Demo App
export default function App() {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [amountToken, setAmountToken] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [manualStreamId, setManualStreamId] = useState('');
  const [claimableBalance, setClaimableBalance] = useState('0');
  const [status, setStatus] = useState('Not Connected');
  const [isProcessing, setIsProcessing] = useState(false);

  const mockAccount = {
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    meta: { name: 'Demo Account' }
  };

  const mockStreams = [
    {
      id: 1,
      sender: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      recipient: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      totalAmount: '1000000000000000',
      flowRate: '100000000000',
      startTime: Math.floor(Date.now() / 1000) - 3600,
      stopTime: Math.floor(Date.now() / 1000) + 3600,
      isActive: true,
      claimableInitial: '500000000000000'
    }
  ];

  const formatToken = (amount) => {
    try {
      const cleaned = String(amount).replace(/,/g, '');
      return (parseFloat(cleaned) / 1e12).toLocaleString(undefined, { maximumFractionDigits: 6 });
    } catch {
      return '0';
    }
  };

  const handleConnect = () => {
    setSelectedAccount(mockAccount);
    setStatus('Connected');
  };

  const handleCreateStream = (e) => {
    e.preventDefault();
    setStatus('Stream created successfully!');
    setTimeout(() => setStatus('Connected'), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header
        walletAddress={selectedAccount?.address}
        networkName="Paseo Asset Hub"
        accounts={selectedAccount ? [mockAccount] : []}
        selectedAccount={selectedAccount}
        setSelectedAccount={setSelectedAccount}
        onConnect={handleConnect}
      />

      <Hero networkName="Paseo Asset Hub" />

      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Create Stream</h2>
              <p className="mt-1 text-sm text-slate-400">
                Start streaming tokens continuously to a recipient
              </p>
            </div>
            <CreateStreamForm
              recipient={recipient}
              setRecipient={setRecipient}
              amountToken={amountToken}
              setAmountToken={setAmountToken}
              durationSeconds={durationSeconds}
              setDurationSeconds={setDurationSeconds}
              onSubmit={handleCreateStream}
            />
          </div>

          <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Withdraw Funds</h2>
              <p className="mt-1 text-sm text-slate-400">
                Claim accumulated tokens from any stream
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Stream ID</label>
                <input
                  type="number"
                  value={manualStreamId}
                  onChange={(e) => setManualStreamId(e.target.value)}
                  placeholder="Enter stream number"
                  min="1"
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div className="flex gap-3">
                <button className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 font-medium text-white transition-colors hover:bg-slate-800">
                  Check Balance
                </button>
                <button className="flex-1 rounded-lg bg-cyan-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-cyan-700">
                  Withdraw
                </button>
              </div>
              <div className="rounded-lg border border-slate-800/50 bg-slate-800/30 p-4">
                <div className="text-sm text-slate-400">Available Balance</div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {Number(claimableBalance).toLocaleString()} PAS
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <StreamList
            title="Incoming Streams"
            emptyText="No incoming streams yet"
            isLoading={false}
            streams={mockStreams}
            variant="incoming"
            formatToken={formatToken}
            tokenSymbol="PAS"
            onWithdraw={(id) => console.log('Withdraw', id)}
            onCancel={(id) => console.log('Cancel', id)}
          />

          <StreamList
            title="Outgoing Streams"
            emptyText="No outgoing streams. Create one to get started."
            isLoading={false}
            streams={[]}
            variant="outgoing"
            formatToken={formatToken}
            tokenSymbol="PAS"
            onCancel={(id) => console.log('Cancel', id)}
          />
        </div>
      </main>

      <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
        <div className="flex items-center gap-3 rounded-lg border border-slate-800/50 bg-slate-900/95 px-4 py-3 backdrop-blur-sm">
          <div className={`h-2 w-2 rounded-full ${isProcessing ? 'animate-pulse bg-cyan-400' : 'bg-green-500'}`} />
          <div className="flex-1 truncate text-sm text-slate-300">{status}</div>
        </div>
      </div>
    </div>
  );
}