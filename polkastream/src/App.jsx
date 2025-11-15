import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { contractAddress, contractMetadata, ACTIVE_NETWORK } from './contractInfo.js';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import CreateStreamForm from './components/CreateStreamForm.jsx';
import StreamList from './components/StreamList.jsx';

// Try multiple RPC endpoints in case one is down
const RPC_ENDPOINTS = ACTIVE_NETWORK.rpcs;
const NETWORK_NAME = ACTIVE_NETWORK.name;
const TOKEN_SYMBOL = ACTIVE_NETWORK.token;

function App() {
  const [api, setApi] = useState(null);
  const [contract, setContract] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [status, setStatus] = useState('Not Connected');

  const [recipient, setRecipient] = useState('');
  const [amountToken, setAmountToken] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');

  const [incomingStreams, setIncomingStreams] = useState([]);
  const [outgoingStreams, setOutgoingStreams] = useState([]);
  const [isLoadingStreams, setIsLoadingStreams] = useState(false);

  const [manualStreamId, setManualStreamId] = useState('');
  const [claimableBalance, setClaimableBalance] = useState('0.0');
  const [isProcessing, setIsProcessing] = useState(false);

  const connectWallet = async () => {
    try {
      setStatus('Connecting...');
      
      const extensions = await web3Enable('Polkadot Stream');
      if (extensions.length === 0) {
        setStatus('Please install Polkadot.js extension');
        return;
      }

      // Try multiple RPC endpoints until one works
      let api = null;
      let successfulRpc = null;
      
      for (const rpcUrl of RPC_ENDPOINTS) {
        try {
          setStatus(`Trying ${rpcUrl}...`);
          console.log(`Attempting to connect to: ${rpcUrl}`);
          
          const wsProvider = new WsProvider(rpcUrl, 5000); // 5 second timeout
          api = await Promise.race([
            ApiPromise.create({ provider: wsProvider }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
          ]);
          
          successfulRpc = rpcUrl;
          console.log(`Successfully connected to: ${rpcUrl}`);
          break;
        } catch (err) {
          console.log(`Failed to connect to ${rpcUrl}:`, err.message);
          continue;
        }
      }

      if (!api) {
        setStatus('Could not connect to any RPC endpoint. Network may be down.');
        return;
      }

      setApi(api);
      setStatus(`Connected to ${NETWORK_NAME}`);

      const contract = new ContractPromise(api, contractMetadata, contractAddress);
      setContract(contract);

      const accounts = await web3Accounts();
      setAccounts(accounts);
      
      if (accounts.length > 0) {
        setSelectedAccount(accounts[0]);
        setStatus('Connected');
      } else {
        setStatus('No accounts found. Create one in Polkadot.js extension.');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setStatus('Connection failed. Check console for details.');
    }
  };

  const handleCreateStream = async (e) => {
    e.preventDefault();
    if (!contract || !selectedAccount) {
      setStatus('Please connect your wallet.');
      return;
    }

    try {
      const amountInSmallestUnit = BigInt(Math.floor(parseFloat(amountToken) * 1e12));
      const duration = parseInt(durationSeconds || '0', 10);

      if (amountInSmallestUnit <= 0n || !Number.isFinite(duration) || duration <= 0) {
        setStatus('Enter positive amount and duration.');
        return;
      }

      setStatus('Creating stream...');
      setIsProcessing(true);

      const injector = await web3FromAddress(selectedAccount.address);
      
      const gasLimit = api.registry.createType('WeightV2', {
        refTime: 3000000000n,
        proofSize: 1000000n,
      });

      await contract.tx
        .createStream(
          { gasLimit, storageDepositLimit: null, value: amountInSmallestUnit },
          recipient,
          duration
        )
        .signAndSend(selectedAccount.address, { signer: injector.signer }, (result) => {
          if (result.status.isInBlock) {
            setStatus('Stream created successfully!');
            setRecipient('');
            setAmountToken('');
            setDurationSeconds('');
            refreshStreams();
            setIsProcessing(false);
          }
        });

    } catch (error) {
      console.error('Stream creation failed:', error);
      setStatus(error?.message || 'Transaction failed.');
      setIsProcessing(false);
    }
  };

  const checkClaimableBalance = async () => {
    if (!contract || !selectedAccount) {
      setStatus('Please connect your wallet.');
      return;
    }

    try {
      const id = parseInt(manualStreamId || '0', 10);
      if (!Number.isFinite(id) || id <= 0) {
        setStatus('Enter a valid stream ID.');
        return;
      }

      setStatus('Checking claimable balance...');
      
      const gasLimit = api.registry.createType('WeightV2', {
        refTime: 3000000000n,
        proofSize: 1000000n,
      });

      const { result, output } = await contract.query.getClaimableBalance(
        selectedAccount.address,
        { gasLimit, storageDepositLimit: null },
        id
      );

      if (result.isOk && output) {
        const balance = output.toHuman();
        const formatted = (parseFloat(balance.Ok.replace(/,/g, '')) / 1e12).toFixed(6);
        setClaimableBalance(formatted);
        setStatus('Fetched claimable balance.');
      } else {
        setClaimableBalance('0.0');
        setStatus('Could not fetch balance.');
      }
    } catch (error) {
      console.error('Check claimable failed:', error);
      setClaimableBalance('0.0');
      setStatus(error?.message || 'Failed to fetch balance.');
    }
  };

  const handleWithdrawManual = async () => {
    if (!contract || !selectedAccount) {
      setStatus('Please connect your wallet.');
      return;
    }

    try {
      const id = parseInt(manualStreamId || '0', 10);
      if (!Number.isFinite(id) || id <= 0) {
        setStatus('Enter a valid stream ID.');
        return;
      }

      setStatus('Withdrawing...');
      setIsProcessing(true);

      const injector = await web3FromAddress(selectedAccount.address);
      
      const gasLimit = api.registry.createType('WeightV2', {
        refTime: 3000000000n,
        proofSize: 1000000n,
      });

      await contract.tx
        .withdrawFromStream(
          { gasLimit, storageDepositLimit: null },
          id
        )
        .signAndSend(selectedAccount.address, { signer: injector.signer }, (result) => {
          if (result.status.isInBlock) {
            setStatus('Withdraw successful.');
            refreshStreams();
            checkClaimableBalance();
            setIsProcessing(false);
          }
        });

    } catch (error) {
      console.error('Withdraw failed:', error);
      setStatus(error?.message || 'Withdraw failed.');
      setIsProcessing(false);
    }
  };

  const refreshStreams = async () => {
    if (!contract || !selectedAccount) return;

    setIsLoadingStreams(true);
    
    try {
      const gasLimit = api.registry.createType('WeightV2', {
        refTime: 3000000000n,
        proofSize: 1000000n,
      });

      const { result, output } = await contract.query.getStreamCount(
        selectedAccount.address,
        { gasLimit, storageDepositLimit: null }
      );

      if (result.isOk && output) {
        const count = output.toNumber();
        const incoming = [];
        const outgoing = [];

        for (let i = 1; i <= count; i++) {
          const { result: streamResult, output: streamOutput } = await contract.query.getStream(
            selectedAccount.address,
            { gasLimit, storageDepositLimit: null },
            i
          );

          if (streamResult.isOk && streamOutput) {
            const streamData = streamOutput.toHuman();
            if (streamData && streamData.Ok && streamData.Ok.Some) {
              const stream = {
                id: i,
                ...streamData.Ok.Some,
                claimableInitial: 0n
              };

              const senderMatch = stream.sender.toLowerCase() === selectedAccount.address.toLowerCase();
              const recipientMatch = stream.recipient.toLowerCase() === selectedAccount.address.toLowerCase();

              if (recipientMatch) {
                incoming.push(stream);
              }
              if (senderMatch) {
                outgoing.push(stream);
              }
            }
          }
        }

        setIncomingStreams(incoming);
        setOutgoingStreams(outgoing);
      }
    } catch (error) {
      console.error('Failed to load streams:', error);
    }
    
    setIsLoadingStreams(false);
  };

  const withdraw = async (streamId) => {
    if (!contract || !selectedAccount) return;

    try {
      setStatus('Withdrawing...');
      setIsProcessing(true);

      const injector = await web3FromAddress(selectedAccount.address);
      
      const gasLimit = api.registry.createType('WeightV2', {
        refTime: 3000000000n,
        proofSize: 1000000n,
      });

      await contract.tx
        .withdrawFromStream(
          { gasLimit, storageDepositLimit: null },
          streamId
        )
        .signAndSend(selectedAccount.address, { signer: injector.signer }, (result) => {
          if (result.status.isInBlock) {
            setStatus('Withdrawn.');
            refreshStreams();
            setIsProcessing(false);
          }
        });

    } catch (error) {
      console.error(error);
      setStatus(error?.message || 'Withdraw failed.');
      setIsProcessing(false);
    }
  };

  const cancel = async (streamId) => {
    if (!contract || !selectedAccount) return;

    try {
      setStatus('Cancelling stream...');
      setIsProcessing(true);

      const injector = await web3FromAddress(selectedAccount.address);
      
      const gasLimit = api.registry.createType('WeightV2', {
        refTime: 3000000000n,
        proofSize: 1000000n,
      });

      await contract.tx
        .cancelStream(
          { gasLimit, storageDepositLimit: null },
          streamId
        )
        .signAndSend(selectedAccount.address, { signer: injector.signer }, (result) => {
          if (result.status.isInBlock) {
            setStatus('Stream cancelled.');
            refreshStreams();
            setIsProcessing(false);
          }
        });

    } catch (error) {
      console.error(error);
      setStatus(error?.message || 'Cancel failed.');
      setIsProcessing(false);
    }
  };

  const formatToken = (amount) => {
    try {
      const cleaned = String(amount).replace(/,/g, '');
      return (parseFloat(cleaned) / 1e12).toLocaleString(undefined, { maximumFractionDigits: 6 });
    } catch {
      return '0';
    }
  };

  useEffect(() => {
    if (contract && selectedAccount) {
      refreshStreams();
    }
  }, [contract, selectedAccount]);

  const isWorking = isProcessing;

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Animated water particles */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="droplet absolute top-20 left-1/4 w-3 h-3 rounded-full bg-cyan-400/30" style={{ animationDelay: '0s' }} />
        <div className="droplet absolute top-40 right-1/3 w-2 h-2 rounded-full bg-blue-400/30" style={{ animationDelay: '1s' }} />
        <div className="droplet absolute top-60 left-1/2 w-4 h-4 rounded-full bg-cyan-300/30" style={{ animationDelay: '2s' }} />
      </div>

      <Header
        walletAddress={selectedAccount?.address}
        networkName={NETWORK_NAME}
        accounts={accounts}
        selectedAccount={selectedAccount}
        setSelectedAccount={setSelectedAccount}
        onConnect={connectWallet}
      />

      <Hero networkName={NETWORK_NAME} />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 relative z-10">
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="card-flow relative p-6 sm:p-8">
            <div className="absolute top-4 right-4 text-3xl droplet">💧</div>
            <h2 className="text-liquid text-2xl font-bold sm:text-3xl mb-2">
              Create Stream
            </h2>
            <p className="mt-1 text-sm text-cyan-300/70">
              Start the flow. Funds stream per-second continuously.
            </p>

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

          <aside className="card-flow relative p-6 sm:p-8">
            <div className="absolute top-4 right-4 text-3xl droplet" style={{ animationDelay: '1s' }}>💎</div>
            <h2 className="text-liquid text-2xl font-bold sm:text-3xl mb-2">
              Withdraw Funds
            </h2>
            <p className="mt-1 text-sm text-cyan-300/70">
              Claim your accumulated tokens from any stream.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5">
              <label>
                <span className="block text-sm text-cyan-300 mb-2 font-medium">Stream ID</span>
                <input
                  type="number"
                  min={1}
                  placeholder="Enter stream number"
                  value={manualStreamId}
                  onChange={(e) => setManualStreamId(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm transition-all focus:scale-[1.01]"
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="btn-secondary flex-1" onClick={checkClaimableBalance}>
                  Check Balance
                </button>
                <button
                  type="button"
                  className="btn-flow flex-1"
                  onClick={handleWithdrawManual}
                  disabled={!manualStreamId || parseFloat(claimableBalance || '0') <= 0}
                >
                  Withdraw
                </button>
              </div>

              <div className="p-4 bg-cyan-500/5 rounded-xl border border-cyan-500/20">
                <p className="text-sm text-cyan-300/80 mb-1">Available Balance:</p>
                <p className="text-2xl font-bold text-liquid">
                  {Number(claimableBalance || '0').toLocaleString(undefined, { maximumFractionDigits: 6 })} {TOKEN_SYMBOL}
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <StreamList
            title="💧 Incoming Streams"
            emptyText="No incoming streams yet. Waiting for the flow..."
            isLoading={isLoadingStreams}
            streams={incomingStreams}
            variant="incoming"
            formatToken={formatToken}
            tokenSymbol={TOKEN_SYMBOL}
            onWithdraw={withdraw}
            onCancel={cancel}
          />

          <StreamList
            title="🌊 Outgoing Streams"
            emptyText="No outgoing streams. Start the flow by creating a stream."
            isLoading={isLoadingStreams}
            streams={outgoingStreams}
            variant="outgoing"
            formatToken={formatToken}
            tokenSymbol={TOKEN_SYMBOL}
            onCancel={cancel}
          />
        </section>

        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-[92%] max-w-3xl -translate-x-1/2">
          <div className="pointer-events-auto card-flow flex items-center gap-3 px-5 py-3">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                isWorking ? 'bg-cyan-400 animate-ping' : 'bg-blue-400 animate-pulse'
              }`}
            />
            <div className="text-sm sm:text-base text-cyan-100 truncate flex items-center gap-2">
              {isWorking && (
                <svg className="h-4 w-4 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              )}
              <span className="truncate">{status}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;