import { useEffect, useState, useCallback } from 'react';
import { createClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider/web';
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat';
import { getInjectedExtensions, connectInjectedExtension } from 'polkadot-api/pjs-signer';
import { createReviveSdk } from '@polkadot-api/sdk-ink';
import { Binary } from 'polkadot-api';
import { u8aToHex } from '@polkadot/util';
import { addressToEvm } from '@polkadot/util-crypto'; // <--- The function lives here!

// Import generated descriptors - USE CAMELCASE NAME!
import { passetHub, contracts } from '@polkadot-api/descriptors';

// Extract the contract descriptor
const polkadot_stream = contracts.polkadot_stream;

// Contract configuration
const CONTRACT_ADDRESS = '0x123fca99c04fc6f1621d8bfa04be983150677f41';
const RPC_URL = 'wss://passet-hub-paseo.ibp.network';
const NETWORK_NAME = 'Passet Hub';
const TOKEN_SYMBOL = 'PAS';

function formatAddress(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatToken(amount) {
  try {
    const value = typeof amount === 'bigint' ? Number(amount) : parseFloat(String(amount).replace(/,/g, ''));
    return (value / 1e12).toLocaleString(undefined, { maximumFractionDigits: 6 });
  } catch {
    return '0';
  }
}

// Helper to convert U256 from array to BigInt
function u256ToBigInt(u256) {
  if (!u256 || !Array.isArray(u256)) return 0n;
  return BigInt(u256[0]) + (BigInt(u256[1]) << 64n) + (BigInt(u256[2]) << 128n) + (BigInt(u256[3]) << 192n);
}

// Helper to convert H160 hex string to Binary
function h160ToBinary(hexAddress) {
  const cleaned = hexAddress.toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]{40}$/.test(cleaned)) {
    throw new Error('Invalid H160 address format');
  }
  const bytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16);
  }
  return Binary.fromBytes(bytes);
}

// Helper to normalize addresses for comparison
function normalizeAddress(addr) {
  if (!addr) return '';
  // Handle Binary objects
  if (addr.asHex) return addr.asHex().toLowerCase();
  // Handle hex strings
  if (typeof addr === 'string') return addr.toLowerCase();
  // Handle Uint8Array or array of bytes
  if (addr instanceof Uint8Array || Array.isArray(addr)) {
    return '0x' + Array.from(addr).map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
  }
  return String(addr).toLowerCase();
}

function App() {
  const [client, setClient] = useState(null);
  const [typedApi, setTypedApi] = useState(null);
  const [contractSdk, setContractSdk] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [status, setStatus] = useState('Not Connected');
  const [isMapped, setIsMapped] = useState(false);

  const [recipient, setRecipient] = useState('');
  const [amountToken, setAmountToken] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');

  const [incomingStreams, setIncomingStreams] = useState([]);
  const [outgoingStreams, setOutgoingStreams] = useState([]);
  const [isLoadingStreams, setIsLoadingStreams] = useState(false);

  const [manualStreamId, setManualStreamId] = useState('');
  const [claimableBalance, setClaimableBalance] = useState('0.0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userH160Address, setUserH160Address] = useState(null);

  const connectWallet = useCallback(async () => {
    try {
      setStatus('Connecting to Passet Hub...');
      
      const provider = getWsProvider(RPC_URL);
      const polkadotClient = createClient(withPolkadotSdkCompat(provider));
      setClient(polkadotClient);

      const api = polkadotClient.getTypedApi(passetHub);
      setTypedApi(api);

      const sdk = createReviveSdk(api, polkadot_stream);
      setContractSdk(sdk);

      setStatus('Connecting wallet extension...');
      
      const extensions = getInjectedExtensions();
      if (extensions.length === 0) {
        setStatus('❌ Please install Polkadot.js or Talisman extension');
        return;
      }

      const selectedExt = await connectInjectedExtension(extensions[0]);
      const walletAccounts = selectedExt.getAccounts();
      
      if (walletAccounts.length === 0) {
        setStatus('❌ No accounts found in wallet');
        return;
      }

      setAccounts(walletAccounts);
      setSelectedAccount(walletAccounts[0]);
      setSigner(walletAccounts[0].polkadotSigner);
      
      // --- H160 Address Derivation Logic (Updated) ---
      const account = walletAccounts[0];
      let h160Address = null;
      
      console.log('Account object:', account);
      console.log('Account SS58 address:', account.address);
      
      // We use the SS58 address string directly for standard EVM derivation.
      // This correctly applies the Keccak-256 hash and truncation.
      try {
          const evmAddressBytes = addressToEvm(account.address);
          h160Address = u8aToHex(evmAddressBytes);
          console.log('✅ Derived H160 address using standard utility (addressToEvm):', h160Address);
          setUserH160Address(h160Address);
      } catch (e) {
          console.warn('❌ Failed to derive H160 using addressToEvm:', e);
          // Fallback or specific chain logic (Only use this if 'addressToEvm' fails OR 
          // if Passet Hub explicitly requires the first 20 bytes).
          if (account.polkadotSigner?.publicKey) {
              const publicKeyBytes = account.polkadotSigner.publicKey;
              const h160Bytes = publicKeyBytes.slice(0, 20);
              h160Address = '0x' + Array.from(h160Bytes).map(b => b.toString(16).padStart(2, '0')).join('');
              
              console.warn('⚠️ FALLBACK/SPECIFIC-LOGIC: Derived H160 address by taking first 20 bytes:', h160Address);
              setUserH160Address(h160Address);
          } else {
              console.warn('❌ No publicKey found on account.polkadotSigner for fallback!');
          }
      }
      // --- End H160 Derivation Logic ---
      
      setSelectedAccount(walletAccounts[0]);
      setSigner(walletAccounts[0].polkadotSigner);
      
      setStatus('Checking account mapping...');
      try {
        if (sdk.addressIsMapped && typeof sdk.addressIsMapped === 'function') {
          const mapped = await sdk.addressIsMapped(walletAccounts[0].address);
          setIsMapped(true);
          
          if (!true) {
            setStatus('⚠️ Account needs mapping - Click "Map Account" button');
          } else {
            setStatus('✅ Connected to Passet Hub');
          }
        } else {
          setIsMapped(true);
          setStatus('⚠️ Please map your account using the "Map Account" button');
        }
      } catch (error) {
        console.warn('Could not check mapping status:', error);
        setIsMapped(true);
        setStatus('⚠️ Please map your account using the "Map Account" button');
      }
      
    } catch (error) {
      console.error('Connection failed:', error);
      setStatus(`❌ Connection failed: ${error.message}`);
    }
  }, []);


  // Helper to convert SS58 address to H160
function ss58ToH160(ss58Address) {
  try {
    // polkadot-api's getAccount includes the public key
    // We need to hash the public key to get the H160 address
    // For pallet-revive, the H160 is derived from the AccountId32
    
    // This is a simplified approach - extract the hex from the account
    // The actual mapping is done on-chain via map_account extrinsic
    // We need to query the chain for the mapped address
    return null; // We'll query the chain instead
  } catch (error) {
    console.error('SS58 conversion failed:', error);
    return null;
  }
}

// Helper to get the mapped H160 address for a Substrate account
// Helper to get the mapped H160 address for a Substrate account
async function getMappedH160Address(api, substrateAddress) {
  try {
    // Query the OriginalAccount storage (reverse mapping from H160 -> AccountId32)
    // We need to iterate or we can try the forward mapping
    
    // The AccountId32Mapper uses: first 20 bytes of AccountId32 as the H160
    // So we need to extract those bytes from the address
    
    // For polkadot-api, the address object should have methods to get raw bytes
    // Let's try to access the raw bytes directly
    
    console.log('Substrate address:', substrateAddress);
    console.log('Substrate address type:', typeof substrateAddress);
    
    // The address from the wallet account should have the raw public key
    // In polkadot-api, the account has a publicKey property
    return null; // We'll handle this differently below
  } catch (error) {
    console.warn('Failed to get mapped address:', error);
    return null;
  }
}

  const mapAccount = async () => {
    if (!typedApi || !selectedAccount || !signer) {
      setStatus('❌ Please connect wallet first');
      return;
    }

    try {
      setStatus('Mapping account...');
      setIsProcessing(true);

      const tx = typedApi.tx.Revive.map_account();
      const result = await tx.signAndSubmit(signer);

      if (result.ok) {
        setStatus('✅ Account mapped successfully!');
        setIsMapped(true);
      } else {
        const dispatchError = result.dispatchError;
        if (dispatchError?.type === 'Module' && 
            dispatchError?.value?.type === 'Revive' && 
            dispatchError?.value?.value?.type === 'AccountAlreadyMapped') {
          setStatus('✅ Account already mapped - ready to use!');
          setIsMapped(true);
        } else {
          console.error('Dispatch error:', dispatchError);
          const errorMsg = dispatchError ? JSON.stringify(dispatchError) : 'Unknown error';
          setStatus(`❌ Mapping failed: ${errorMsg}`);
        }
      }
      setIsProcessing(false);
    } catch (error) {
      console.error('Map account failed:', error);
      setStatus(`❌ Mapping failed: ${error.message}`);
      setIsProcessing(false);
    }
  };

 const refreshStreams = useCallback(async () => {
  console.log('refreshStreams called with:', {
    contractSdk: !!contractSdk,
    selectedAccount: !!selectedAccount,
    isMapped,
    userH160Address,
    userH160AddressExists: !!userH160Address
  });
  
  if (!contractSdk || !selectedAccount || !isMapped || !userH160Address) {
    console.log('❌ Cannot refresh - missing required data:', { 
      hasSDK: !!contractSdk, 
      hasAccount: !!selectedAccount, 
      isMapped,
      userH160Address: userH160Address,
      hasUserH160Address: !!userH160Address
    });
    return;
  }

  setIsLoadingStreams(true);
  try {
    setStatus('Loading streams...');
  
    console.log('Using user H160 address:', userH160Address);
    
    // Get the contract instance once
    const contract = contractSdk.getContract(CONTRACT_ADDRESS);
    
    // Get stream count
    const countResult = await contract.query('get_stream_count', {
      origin: selectedAccount.address,
      value: 0n,
    });
    
    if (!countResult.success) {
      console.error('Failed to get stream count:', countResult);
      throw new Error('Failed to get stream count');
    }

    const totalStreams = Number(countResult.value.response);
    console.log(`Total streams found: ${totalStreams}`);

    if (totalStreams === 0) {
      setIncomingStreams([]);
      setOutgoingStreams([]);
      setStatus('✅ No streams found');
      setIsLoadingStreams(false);
      return;
    }

    const incoming = [];
    const outgoing = [];

    // Fetch all streams
    for (let i = 1; i <= totalStreams; i++) {
      try {
        const streamResult = await contract.query('get_stream', {
          origin: selectedAccount.address,
          value: 0n,
          data: { stream_id: BigInt(i) }
        });
        
        console.log(`Stream ${i} raw result:`, streamResult);
        
        if (!streamResult.success) {
          console.warn(`Stream ${i} query failed`, streamResult);
          continue;
        }

        const optionResult = streamResult.value.response;
        
        console.log(`Stream ${i} option result:`, optionResult);
        
        // Handle different possible Option formats
        let streamData = null;
        
        if (optionResult && typeof optionResult === 'object') {
          if (optionResult.type === 'None') {
            console.warn(`Stream ${i} not found (None variant)`);
            continue;
          }
          
          if (optionResult.type === 'Some' && optionResult.value) {
            streamData = optionResult.value;
          }
          else if (optionResult.Some !== undefined) {
            streamData = optionResult.Some;
          }
          else if (optionResult.None !== undefined) {
            console.warn(`Stream ${i} not found (None property)`);
            continue;
          }
          else if (optionResult.sender && optionResult.recipient) {
            streamData = optionResult;
          }
        }
        
        if (!streamData) {
          console.warn(`Stream ${i} - could not extract stream data from:`, optionResult);
          continue;
        }
        
        console.log(`Stream ${i} extracted data:`, streamData);
        
        // Normalize addresses for comparison
        const senderHex = normalizeAddress(streamData.sender);
        const recipientHex = normalizeAddress(streamData.recipient);
        
        console.log(`Stream ${i} - Sender: ${senderHex}, Recipient: ${recipientHex}, User H160: ${userH160Address}`);
        
        const stream = {
          id: i,
          sender: senderHex,
          recipient: recipientHex,
          totalAmount: u256ToBigInt(streamData.total_amount),
          flowRate: u256ToBigInt(streamData.flow_rate),
          startTime: streamData.start_time,
          stopTime: streamData.stop_time,
          withdrawn: u256ToBigInt(streamData.amount_withdrawn),
          isActive: streamData.is_active
        };

        const isRecipient = recipientHex === userH160Address;
        const isSender = senderHex === userH160Address;

        console.log(`Stream ${i} - isRecipient: ${isRecipient}, isSender: ${isSender}`);

        if (isRecipient) {
          // Fetch claimable balance for incoming streams
          try {
            const balanceResult = await contract.query('get_claimable_balance', {
              origin: selectedAccount.address,
              value: 0n,
              data: { stream_id: BigInt(i) }
            });
            
            console.log(`Stream ${i} balance query result:`, balanceResult);
            
            if (balanceResult.success) {
              const resultValue = balanceResult.value.response;
              console.log(`Stream ${i} balance result value:`, resultValue);
              
              let balanceValue = null;
              
              if (resultValue && typeof resultValue === 'object') {
                if (resultValue.type === 'Ok' && resultValue.value !== undefined) {
                  balanceValue = resultValue.value;
                } else if (resultValue.Ok !== undefined) {
                  balanceValue = resultValue.Ok;
                } else if (Array.isArray(resultValue)) {
                  balanceValue = resultValue;
                }
              }
              
              if (balanceValue !== null) {
                stream.claimable = u256ToBigInt(balanceValue);
              } else {
                console.warn(`Stream ${i} - could not extract balance from:`, resultValue);
                stream.claimable = 0n;
              }
            } else {
              stream.claimable = 0n;
            }
          } catch (err) {
            console.warn(`Failed to get claimable balance for stream ${i}:`, err);
            stream.claimable = 0n;
          }
          incoming.push(stream);
        }
        
        if (isSender) {
          outgoing.push(stream);
        }
      } catch (err) {
        console.error(`Error processing stream ${i}:`, err);
      }
    }

    console.log(`Processed - Incoming: ${incoming.length}, Outgoing: ${outgoing.length}`);
    console.log('Incoming streams:', incoming);
    console.log('Outgoing streams:', outgoing);
    
    setIncomingStreams(incoming);
    setOutgoingStreams(outgoing);
    setStatus(`✅ Loaded ${incoming.length} incoming, ${outgoing.length} outgoing streams`);
    
  } catch (error) {
    console.error('Failed to load streams:', error);
    setStatus(`❌ Failed to load streams: ${error.message}`);
  }
  setIsLoadingStreams(false);
}, [contractSdk, selectedAccount, isMapped, userH160Address]);

  const handleCreateStream = async () => {
    if (!contractSdk || !selectedAccount || !signer || !isMapped) {
      setStatus('❌ Please connect wallet and map account first');
      return;
    }

    try {
      if (!/^0x[0-9a-fA-F]{40}$/.test(recipient)) {
        setStatus('❌ Invalid H160 address format (must be 0x + 40 hex chars)');
        return;
      }

      const amount = parseFloat(amountToken);
      const duration = parseInt(durationSeconds); // in miliseconds

      if (!amount || !duration || amount <= 0 || duration <= 0) {
        setStatus('❌ Enter valid amount and duration');
        return;
      }

      setStatus('Creating stream...');
      setIsProcessing(true);

      const amountInPlanck = BigInt(Math.floor(amount * 10000));
      const recipientBinary = h160ToBinary(recipient);
      const contract = contractSdk.getContract(CONTRACT_ADDRESS);
      
      console.log('Creating stream with:');
      console.log('- Amount (PAS):', amount);
      console.log('- Amount (Planck):', amountInPlanck.toString());
      console.log('- Duration (seconds):', duration);
      console.log('- Recipient:', recipient);
      
      const dryRunResult = await contract.query('create_stream', {
        origin: selectedAccount.address,
        value: amountInPlanck,
        data: {
          recipient: recipientBinary,
          duration: BigInt(duration)
        }
      });

      if (!dryRunResult.success) {
        console.error('Dry-run failed:', dryRunResult.value);
        const errorMsg = dryRunResult.value?.type === 'Module' 
          ? `Contract error: ${JSON.stringify(dryRunResult.value)}` 
          : 'Pre-flight check failed';
        setStatus(`❌ ${errorMsg}`);
        setIsProcessing(false);
        return;
      }

      console.log('Dry-run successful, sending transaction...');
      
      const result = await contract.send('create_stream', {
        origin: selectedAccount.address,
        value: amountInPlanck,
        data: {
          recipient: recipientBinary,
          duration: BigInt(duration)
        }
      }).signAndSubmit(signer);

      if (result.ok) {
        setStatus('✅ Stream created successfully!');
        setRecipient('');
        setAmountToken('');
        setDurationSeconds('');
        // Wait a bit for the chain to process
        setTimeout(() => refreshStreams(), 2000);
      } else {
        console.error('Transaction dispatch error:', result.dispatchError);
        const errorMsg = result.dispatchError?.type === 'Module'
          ? `Error: ${result.dispatchError.value?.type || 'Unknown'}`
          : 'Transaction failed';
        setStatus(`❌ Stream creation failed: ${errorMsg}`);
      }
      setIsProcessing(false);

    } catch (error) {
      console.error('Create stream failed:', error);
      setStatus(`❌ Failed: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const checkClaimableBalance = async () => {
    if (!contractSdk || !selectedAccount || !isMapped) {
      setStatus('❌ Please connect wallet and map account');
      return;
    }

    try {
      const id = parseInt(manualStreamId);
      if (!id || id <= 0) {
        setStatus('❌ Enter valid stream ID');
        return;
      }

      setStatus('Checking balance...');

      const contract = contractSdk.getContract(CONTRACT_ADDRESS);
      const result = await contract.query('get_claimable_balance', {
        origin: selectedAccount.address,
        value: 0n,
        data: { stream_id: BigInt(id) }
      });
      
      if (result.success) {
        const balance = formatToken(u256ToBigInt(result.value.response));
        setClaimableBalance(balance);
        setStatus('✅ Balance fetched');
      } else {
        setClaimableBalance('0.0');
        setStatus('❌ Failed to fetch balance');
      }
      
    } catch (error) {
      console.error('Check balance failed:', error);
      setClaimableBalance('0.0');
      setStatus(`❌ Failed: ${error.message}`);
    }
  };

  const handleWithdraw = async (streamId) => {
  if (!contractSdk || !selectedAccount || !signer || !isMapped) {
    setStatus('❌ Please connect wallet and map account');
    return;
  }

  try {
    const id = streamId || parseInt(manualStreamId);
    if (!id || id <= 0) {
      setStatus('❌ Invalid stream ID');
      return;
    }

    setStatus('Withdrawing...');
    setIsProcessing(true);

    const contract = contractSdk.getContract(CONTRACT_ADDRESS);
    
    // Add dry-run first
    console.log('Running dry-run for withdrawal of stream', id);
    const dryRunResult = await contract.query('withdraw_from_stream', {
      origin: selectedAccount.address,
      value: 0n,
      data: { stream_id: BigInt(id) }
    });
    
    console.log('Dry-run result:', dryRunResult);
    
    if (!dryRunResult.success) {
      console.error('Dry-run failed:', dryRunResult.value);
      setStatus(`❌ Withdrawal would fail: ${JSON.stringify(dryRunResult.value)}`);
      setIsProcessing(false);
      return;
    }
      
      const result = await contract.send('withdraw_from_stream', {
        origin: selectedAccount.address,
        value: 0n,
        data: { stream_id: BigInt(id) }
      }).signAndSubmit(signer);

      if (result.ok) {
        setStatus('✅ Withdrawal successful!');
        setTimeout(() => {
          refreshStreams();
          if (!streamId) checkClaimableBalance();
        }, 2000);
      } else {
        console.error('Withdrawal dispatch error:', result.dispatchError);
        console.error('Full error object:', JSON.stringify(result.dispatchError, null, 2));
        
        const errorMsg = result.dispatchError?.value?.value?.type || 
                        result.dispatchError?.value?.type || 
                        'Unknown error';
        setStatus(`❌ Withdrawal failed: ${errorMsg}`);
      }
      setIsProcessing(false);

    } catch (error) {
      console.error('Withdraw failed:', error);
      console.error('Error stack:', error.stack);
      setStatus(`❌ Failed: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handleCancel = async (streamId) => {
    if (!contractSdk || !selectedAccount || !signer || !isMapped) {
      setStatus('❌ Please connect wallet and map account');
      return;
    }

    try {
      setStatus('Cancelling stream...');
      setIsProcessing(true);

      const contract = contractSdk.getContract(CONTRACT_ADDRESS);
      
      const result = await contract.send('cancel_stream', {
        origin: selectedAccount.address,
        value: 0n,
        data: { stream_id: BigInt(streamId) }
      }).signAndSubmit(signer);

      if (result.ok) {
        setStatus('✅ Stream cancelled!');
        setTimeout(() => refreshStreams(), 2000);
      } else {
        console.error('Cancel error:', result.dispatchError);
        setStatus('❌ Cancellation failed');
      }
      setIsProcessing(false);

    } catch (error) {
      console.error('Cancel failed:', error);
      setStatus(`❌ Failed: ${error.message}`);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (contractSdk && selectedAccount && isMapped && userH160Address) {
      refreshStreams();
    }
  }, [contractSdk, selectedAccount, isMapped, userH160Address, refreshStreams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto p-6">
        <header className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">💧 Polkadot Stream</h1>
            <p className="text-purple-300">Real-time money streaming on {NETWORK_NAME}</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedAccount ? (
              <>
                <span className="px-4 py-2 bg-purple-600 rounded-lg text-white text-sm">
                  {NETWORK_NAME}
                </span>
                {accounts.length > 1 ? (
                  <select
                    value={selectedAccount?.address || ''}
                    onChange={(e) => {
                      const account = accounts.find(a => a.address === e.target.value);
                      setSelectedAccount(account);
                      setSigner(account?.polkadotSigner);
                    }}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg border border-purple-500"
                  >
                    {accounts.map((account) => (
                      <option key={account.address} value={account.address}>
                        {formatAddress(account.address)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="px-4 py-2 bg-slate-800 rounded-lg text-white text-sm">
                    {formatAddress(selectedAccount.address)}
                  </span>
                )}
                {!isMapped && (
                  <button
                    onClick={mapAccount}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed animate-pulse"
                  >
                    Map Account
                  </button>
                )}
                {isMapped && (
                  <button
                    onClick={refreshStreams}
                    disabled={isLoadingStreams}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition disabled:opacity-50"
                  >
                    {isLoadingStreams ? '🔄' : '🔄 Refresh'}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={connectWallet}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:scale-105 transition"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </header>

        {selectedAccount && !isMapped && (
          <div className="mb-6 p-4 bg-orange-500/20 border border-orange-500 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-orange-300 font-semibold mb-1">Account Mapping Required</h3>
                <p className="text-orange-200 text-sm">
                  Your account needs to be mapped to interact with contracts on Passet Hub (pallet-revive). 
                  Click the "Map Account" button above to proceed. This is a one-time operation.
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="relative mx-auto w-full max-w-6xl px-4 pt-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg sm:p-12">
        <div className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-hero opacity-20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-hero opacity-10 blur-2xl" />
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
          <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
          Live on Passet Hub
        </div>
        <div className="max-w-3xl">
          <h2 className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl md:text-5xl">
            Polkadot Stream
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
            Real-time money streaming on Polkadot. Create programmable flows of tokens per second with sub-second finality.
          </p>
        </div>
      </div>
    </section>
        <br />
        <br />
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">💧 Create Stream</h2>
            <p className="text-purple-300 text-sm mb-6">Start the flow. Funds stream per-second continuously.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-purple-300 text-sm mb-2">Recipient (H160 Address)</label>
                <input
                  type="text"
                  placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg border border-purple-500/50 focus:border-purple-500 focus:outline-none font-mono text-sm"
                  disabled={!isMapped}
                />
                <p className="text-xs text-purple-400 mt-1">Must be 0x + 40 hex characters (Ethereum-style address)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-purple-300 text-sm mb-2">Amount ({TOKEN_SYMBOL})</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="10.0"
                    value={amountToken}
                    onChange={(e) => setAmountToken(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg border border-purple-500/50 focus:border-purple-500 focus:outline-none"
                    disabled={!isMapped}
                  />
                </div>

                <div>
                  <label className="block text-purple-300 text-sm mb-2">Duration (seconds)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="3600"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg border border-purple-500/50 focus:border-purple-500 focus:outline-none"
                    disabled={!isMapped}
                  />
                </div>
              </div>

              <button
                onClick={handleCreateStream}
                disabled={isProcessing || !selectedAccount || !isMapped}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Start Streaming'}
              </button>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">💎 Withdraw Funds</h2>
            <p className="text-purple-300 text-sm mb-6">Claim your accumulated tokens from any stream.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-purple-300 text-sm mb-2">Stream ID</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter stream number"
                  value={manualStreamId}
                  onChange={(e) => setManualStreamId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg border border-purple-500/50 focus:border-purple-500 focus:outline-none"
                  disabled={!isMapped}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={checkClaimableBalance}
                  disabled={!selectedAccount || !isMapped}
                  className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition disabled:opacity-50"
                >
                  Check Balance
                </button>
                <button
                  onClick={() => handleWithdraw()}
                  disabled={!manualStreamId || isProcessing || !selectedAccount || !isMapped}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Withdraw
                </button>
              </div>

              <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                <p className="text-sm text-cyan-300 mb-1">Available Balance:</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {claimableBalance} {TOKEN_SYMBOL}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">💧 Incoming Streams</h3>
            {!isMapped ? (
              <p className="text-purple-300">Map your account to view streams.</p>
            ) : isLoadingStreams ? (
              <p className="text-purple-300">Loading streams...</p>
            ) : incomingStreams.length === 0 ? (
              <div className="bg-slate-800/30 rounded-lg p-6 text-center">
                <p className="text-purple-300">No incoming streams yet.</p>
                <p className="text-sm text-purple-400 mt-2">Streams where you're the recipient will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incomingStreams.map((stream) => {
                  const nowSec = Math.floor(Date.now() / 1000);
                  const startTime = Number(stream.startTime);
                  const stopTime = Number(stream.stopTime);
                  const elapsed = Math.max(0, Math.min(nowSec, stopTime) - startTime);
                  const duration = Math.max(1, stopTime - startTime);
                  const progressPct = Math.min(100, (elapsed / duration) * 100);

                  return (
                    <div
                      key={stream.id}
                      className={`bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-cyan-500/30 ${!stream.isActive ? 'opacity-50' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-xs text-purple-300">ID #{stream.id}</div>
                          <div className="text-sm text-cyan-300">from {formatAddress(stream.sender)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">{formatToken(stream.totalAmount)} {TOKEN_SYMBOL}</div>
                          <div className="text-xs text-purple-300">{formatToken(stream.flowRate)} {TOKEN_SYMBOL}/ms</div>
                        </div>
                      </div>

                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-purple-300">Claimable</span>
                        <span className="font-mono text-cyan-400">{formatToken(stream.claimable)} {TOKEN_SYMBOL}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleWithdraw(stream.id)}
                          disabled={!stream.isActive || isProcessing}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Withdraw
                        </button>
                        <button
                          onClick={() => handleCancel(stream.id)}
                          disabled={!stream.isActive || isProcessing}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-4">🌊 Outgoing Streams</h3>
            {!isMapped ? (
              <p className="text-purple-300">Map your account to view streams.</p>
            ) : isLoadingStreams ? (
              <p className="text-purple-300">Loading streams...</p>
            ) : outgoingStreams.length === 0 ? (
              <div className="bg-slate-800/30 rounded-lg p-6 text-center">
                <p className="text-purple-300">No outgoing streams.</p>
                <p className="text-sm text-purple-400 mt-2">Streams you create will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {outgoingStreams.map((stream) => {
                  const nowSec = Math.floor(Date.now() / 1000);
                  const startTime = Number(stream.startTime);
                  const stopTime = Number(stream.stopTime);
                  const elapsed = Math.max(0, Math.min(nowSec, stopTime) - startTime);
                  const duration = Math.max(1, stopTime - startTime);
                  const progressPct = Math.min(100, (elapsed / duration) * 100);

                  return (
                    <div
                      key={stream.id}
                      className={`bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-blue-500/30 ${!stream.isActive ? 'opacity-50' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-xs text-purple-300">ID #{stream.id}</div>
                          <div className="text-sm text-blue-300">to {formatAddress(stream.recipient)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">{formatToken(stream.totalAmount)} {TOKEN_SYMBOL}</div>
                          <div className="text-xs text-purple-300">{formatToken(stream.flowRate)} {TOKEN_SYMBOL}/ms</div>
                        </div>
                      </div>

                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <button
                        onClick={() => handleCancel(stream.id)}
                        disabled={!stream.isActive || isProcessing}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel Stream
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-4">
          <div className="bg-slate-800/90 backdrop-blur rounded-xl p-4 border border-purple-500/30 flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${isProcessing ? 'bg-cyan-400 animate-ping' : 'bg-green-400 animate-pulse'}`} />
            {isProcessing && (
              <svg className="h-4 w-4 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            <span className="text-white text-sm">{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;