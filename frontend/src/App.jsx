import { useState, useEffect } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { Droplets, Wallet, ArrowRight, Clock, DollarSign, Play, X } from 'lucide-react';
import contractMetadata from '../target/ink/polkadot_stream.json';

const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS_HERE'; // Update after deployment
const WS_PROVIDER = 'wss://rococo-contracts-rpc.polkadot.io'; // Contracts testnet

function App() {
  const [api, setApi] = useState(null);
  const [contract, setContract] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'streams'

  // Initialize API and load accounts
  useEffect(() => {
    initializeApi();
  }, []);

  const initializeApi = async () => {
    try {
      setLoading(true);
      
      // Connect to Polkadot
      const wsProvider = new WsProvider(WS_PROVIDER);
      const api = await ApiPromise.create({ provider: wsProvider });
      setApi(api);
      
      // Initialize contract
      const contract = new ContractPromise(api, contractMetadata, CONTRACT_ADDRESS);
      setContract(contract);
      
      // Load wallet accounts
      const extensions = await web3Enable('Polkadot Stream');
      if (extensions.length === 0) {
        alert('Please install Polkadot.js extension');
        return;
      }
      
      const accounts = await web3Accounts();
      setAccounts(accounts);
      if (accounts.length > 0) {
        setSelectedAccount(accounts[0]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize:', error);
      setLoading(false);
    }
  };

  const createStream = async () => {
    if (!contract || !selectedAccount) return;
    
    try {
      setLoading(true);
      
      const injector = await web3FromAddress(selectedAccount.address);
      const amountInPlanck = BigInt(parseFloat(amount) * 1e12); // Convert to Planck (DOT smallest unit)
      
      const gasLimit = api.registry.createType('WeightV2', {
        refTime: 3000000000n,
        proofSize: 1000000n,
      });
      
      await contract.tx
        .createStream(
          { gasLimit, storageDepositLimit: null, value: amountInPlanck },
          recipient,
          parseInt(duration)
        )
        .signAndSend(selectedAccount.address, { signer: injector.signer }, (result) => {
          if (result.status.isInBlock) {
            console.log('Stream created in block:', result.status.asInBlock.toHex());
            alert('Stream created successfully!');
            setRecipient('');
            setAmount('');
            setDuration('');
            loadStreams();
          }
        });
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to create stream:', error);
      alert('Failed to create stream: ' + error.message);
      setLoading(false);
    }
  };

  const loadStreams = async () => {
    if (!contract || !selectedAccount) return;
    
    try {
      // Get total stream count
      const { output } = await contract.query.getStreamCount(
        selectedAccount.address,
        { gasLimit: -1 }
      );
      
      const count = output.toNumber();
      const loadedStreams = [];
      
      // Load each stream
      for (let i = 1; i <= count; i++) {
        const { output: streamOutput } = await contract.query.getStream(
          selectedAccount.address,
          { gasLimit: -1 },
          i
        );
        
        if (streamOutput) {
          const stream = streamOutput.toHuman();
          if (stream && stream.Some) {
            loadedStreams.push({ id: i, ...stream.Some });
          }
        }
      }
      
      setStreams(loadedStreams);
    } catch (error) {
      console.error('Failed to load streams:', error);
    }
  };

  const withdrawFromStream = async (streamId) => {
    if (!contract || !selectedAccount) return;
    
    try {
      setLoading(true);
      
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
            alert('Withdrawal successful!');
            loadStreams();
          }
        });
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to withdraw:', error);
      alert('Failed to withdraw: ' + error.message);
      setLoading(false);
    }
  };

  const cancelStream = async (streamId) => {
    if (!contract || !selectedAccount) return;
    
    try {
      setLoading(true);
      
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
            alert('Stream cancelled!');
            loadStreams();
          }
        });
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to cancel:', error);
      alert('Failed to cancel stream: ' + error.message);
      setLoading(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatAmount = (amount) => {
    if (!amount) return '0';
    // Remove commas and convert from Planck to DOT
    const cleaned = amount.replace(/,/g, '');
    return (parseFloat(cleaned) / 1e12).toFixed(4);
  };

  useEffect(() => {
    if (contract && selectedAccount && activeTab === 'streams') {
      loadStreams();
    }
  }, [contract, selectedAccount, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Header */}
      <div className="border-b border-purple-700/50 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Polkadot Stream</h1>
                <p className="text-sm text-purple-300">Real-time money streaming on Polkadot</p>
              </div>
            </div>
            
            {selectedAccount && (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <Wallet className="w-5 h-5 text-purple-300" />
                <select
                  value={selectedAccount.address}
                  onChange={(e) => {
                    const account = accounts.find(a => a.address === e.target.value);
                    setSelectedAccount(account);
                  }}
                  className="bg-transparent text-white border-none outline-none cursor-pointer"
                >
                  {accounts.map((account) => (
                    <option key={account.address} value={account.address} className="bg-purple-900">
                      {account.meta.name} ({formatAddress(account.address)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading && !api ? (
          <div className="text-center text-white py-20">
            <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Connecting to Polkadot...</p>
          </div>
        ) : !selectedAccount ? (
          <div className="text-center text-white py-20">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-purple-400" />
            <h2 className="text-2xl font-bold mb-2">No Wallet Connected</h2>
            <p className="text-purple-300">Please install Polkadot.js extension and create an account</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'create'
                    ? 'bg-white text-purple-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Create Stream
              </button>
              <button
                onClick={() => setActiveTab('streams')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'streams'
                    ? 'bg-white text-purple-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                My Streams
              </button>
            </div>

            {activeTab === 'create' ? (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">Create New Stream</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-purple-200 mb-2">Recipient Address</label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-purple-200 mb-2">Amount (DOT)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-purple-400" />
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="10.0"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-purple-200 mb-2">Duration (seconds)</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3.5 w-5 h-5 text-purple-400" />
                        <input
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          placeholder="3600"
                          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {amount && duration && (
                    <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
                      <p className="text-purple-200 text-sm mb-1">Flow Rate</p>
                      <p className="text-white text-xl font-bold">
                        {(parseFloat(amount) / parseFloat(duration)).toFixed(8)} DOT/second
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={createStream}
                    disabled={loading || !recipient || !amount || !duration}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Create Stream
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">Active Streams</h2>
                  <button
                    onClick={loadStreams}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                  >
                    Refresh
                  </button>
                </div>
                
                {streams.length === 0 ? (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
                    <Droplets className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                    <p className="text-white text-lg">No streams found</p>
                    <p className="text-purple-300 mt-2">Create your first stream to get started</p>
                  </div>
                ) : (
                  streams.map((stream) => (
                    <div
                      key={stream.id}
                      className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-purple-300 text-sm mb-1">Stream #{stream.id}</p>
                          <p className="text-white font-semibold">
                            {formatAmount(stream.totalAmount)} DOT
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm ${
                          stream.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {stream.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-purple-300 text-sm">Sender</p>
                          <p className="text-white">{formatAddress(stream.sender)}</p>
                        </div>
                        <div>
                          <p className="text-purple-300 text-sm">Recipient</p>
                          <p className="text-white">{formatAddress(stream.recipient)}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {stream.recipient === selectedAccount.address && stream.isActive && (
                          <button
                            onClick={() => withdrawFromStream(stream.id)}
                            disabled={loading}
                            className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                          >
                            <ArrowRight className="w-4 h-4" />
                            Withdraw
                          </button>
                        )}
                        {(stream.sender === selectedAccount.address || stream.recipient === selectedAccount.address) && stream.isActive && (
                          <button
                            onClick={() => cancelStream(stream.id)}
                            disabled={loading}
                            className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;