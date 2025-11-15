export default function Header({ walletAddress, networkName, accounts, selectedAccount, setSelectedAccount, onConnect }) {
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-violet-500 shadow-glow" />
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              <span className="bg-gradient-to-r from-white via-cyan-200 to-violet-200 bg-clip-text text-transparent">
                Polkadot Stream
              </span>
            </h1>
            <p className="-mt-0.5 text-xs text-white/60" aria-live="polite">
              Real-time money streaming on {networkName || 'Polkadot'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {walletAddress ? (
            <>
              <span className="chip">{networkName}</span>
              {accounts.length > 1 ? (
                <select
                  value={selectedAccount?.address || ''}
                  onChange={(e) => {
                    const account = accounts.find(a => a.address === e.target.value);
                    setSelectedAccount(account);
                  }}
                  className="chip cursor-pointer bg-white/10 hover:bg-white/20"
                >
                  {accounts.map((account) => (
                    <option key={account.address} value={account.address} className="bg-[#0b0f1a]">
                      {account.meta.name} ({formatAddress(account.address)})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="chip">{formatAddress(walletAddress)}</span>
              )}
            </>
          ) : (
            <button className="btn-primary" onClick={onConnect}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}