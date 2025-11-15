export const contractAddress = '0x0cC11E094c8aBEA6D1Fa7F607363b1953611C864';

// Network configuration
export const NETWORKS = {
  // Paseo Asset Hub (where your contract is deployed)
  PASEO_ASSET_HUB: {
    name: 'Paseo Asset Hub',
    // Try multiple RPC endpoints - some may be down
    rpcs: [
      'wss://paseo-asset-hub-rpc.polkadot.io',
      'wss://sys.ibp.network/paseo-asset-hub',
      'wss://paseo-asset-hub.dotters.network',
      'wss://rpc-asset-hub-paseo.luckyfriday.io'
    ],
    token: 'PAS'
  },
  // Rococo Contracts (backup testnet)
  ROCOCO_CONTRACTS: {
    name: 'Rococo Contracts',
    rpcs: ['wss://rococo-contracts-rpc.polkadot.io'],
    token: 'ROC'
  },
  // Local development
  LOCAL: {
    name: 'Local Node',
    rpcs: ['ws://127.0.0.1:9944'],
    token: 'UNIT'
  }
};

// CHANGE THIS to match your deployment network
export const ACTIVE_NETWORK = NETWORKS.PASEO_ASSET_HUB;


// IMPORTANT: Replace this with your full metadata from target/ink/polkadot_stream.json
export const contractMetadata = {
  "source": {
    "hash": "0xde2069910cf5187319e7d7668e27e2ed088c602d3591e5fe721a1cdcbf336f8a",
    "language": "ink! 6.0.0-beta",
    "compiler": "rustc 1.88.0",
    "build_info": {
      "build_mode": "Release",
      "cargo_contract_version": "6.0.0-beta",
      "rust_toolchain": "stable-aarch64-apple-darwin"
    }
  },
  "contract": {
    "name": "polkadot_stream",
    "version": "0.1.0",
    "authors": [
      "ola-893 mharvehll@gmail.com"
    ]
  },
  "image": null,
  "spec": {
    "constructors": [
      {
        "args": [],
        "default": false,
        "docs": [
          "Constructor"
        ],
        "label": "new",
        "payable": false,
        "returnType": {
          "displayName": [
            "ink_primitives",
            "ConstructorResult"
          ],
          "type": 14
        },
        "selector": "0x9bae9d5e"
      }
    ],
    "docs": [],
    "environment": {
      "accountId": {
        "displayName": [
          "AccountId"
        ],
        "type": 26
      },
      "balance": {
        "displayName": [
          "Balance"
        ],
        "type": 28
      },
      "blockNumber": {
        "displayName": [
          "BlockNumber"
        ],
        "type": 30
      },
      "hash": {
        "displayName": [
          "Hash"
        ],
        "type": 29
      },
      "nativeToEthRatio": 100000000,
      "staticBufferSize": 16384,
      "timestamp": {
        "displayName": [
          "Timestamp"
        ],
        "type": 5
      }
    },
    "events": [
      {
        "args": [
          {
            "docs": [],
            "indexed": true,
            "label": "stream_id",
            "type": {
              "displayName": [
                "u64"
              ],
              "type": 5
            }
          },
          {
            "docs": [],
            "indexed": true,
            "label": "sender",
            "type": {
              "displayName": [
                "H160"
              ],
              "type": 0
            }
          },
          {
            "docs": [],
            "indexed": true,
            "label": "recipient",
            "type": {
              "displayName": [
                "H160"
              ],
              "type": 0
            }
          },
          {
            "docs": [],
            "indexed": false,
            "label": "total_amount",
            "type": {
              "displayName": [
                "U256"
              ],
              "type": 3
            }
          },
          {
            "docs": [],
            "indexed": false,
            "label": "start_time",
            "type": {
              "displayName": [
                "Timestamp"
              ],
              "type": 5
            }
          },
          {
            "docs": [],
            "indexed": false,
            "label": "stop_time",
            "type": {
              "displayName": [
                "Timestamp"
              ],
              "type": 5
            }
          }
        ],
        "docs": [
          "Events"
        ],
        "label": "StreamCreated",
        "module_path": "polkadot_stream::polkadot_stream",
        "signature_topic": "0x0025c5bb30762f9b85b546c24452de4c1b3e72b9fa303d0259a914958bc49ade"
      },
      {
        "args": [
          {
            "docs": [],
            "indexed": true,
            "label": "stream_id",
            "type": {
              "displayName": [
                "u64"
              ],
              "type": 5
            }
          },
          {
            "docs": [],
            "indexed": true,
            "label": "recipient",
            "type": {
              "displayName": [
                "H160"
              ],
              "type": 0
            }
          },
          {
            "docs": [],
            "indexed": false,
            "label": "amount",
            "type": {
              "displayName": [
                "U256"
              ],
              "type": 3
            }
          }
        ],
        "docs": [],
        "label": "Withdrawn",
        "module_path": "polkadot_stream::polkadot_stream",
        "signature_topic": "0x98260c3ec44cede5ee20b74b92f7d1ca1c22175c86e9ebada2ed9e00a7d07b1d"
      },
      {
        "args": [
          {
            "docs": [],
            "indexed": true,
            "label": "stream_id",
            "type": {
              "displayName": [
                "u64"
              ],
              "type": 5
            }
          },
          {
            "docs": [],
            "indexed": false,
            "label": "sender",
            "type": {
              "displayName": [
                "H160"
              ],
              "type": 0
            }
          },
          {
            "docs": [],
            "indexed": false,
            "label": "recipient",
            "type": {
              "displayName": [
                "H160"
              ],
              "type": 0
            }
          },
          {
            "docs": [],
            "indexed": false,
            "label": "sender_balance",
            "type": {
              "displayName": [
                "U256"
              ],
              "type": 3
            }
          },
          {
            "docs": [],
            "indexed": false,
            "label": "recipient_balance",
            "type": {
              "displayName": [
                "U256"
              ],
              "type": 3
            }
          }
        ],
        "docs": [],
        "label": "StreamCancelled",
        "module_path": "polkadot_stream::polkadot_stream",
        "signature_topic": "0x5ca0a7bacdabcba56f28099d3501eea39fc343ab8c87f9fc4ffe2c7a6026f679"
      }
    ],
    "lang_error": {
      "displayName": [
        "ink",
        "LangError"
      ],
      "type": 15
    },
    "messages": [
      {
        "args": [
          {
            "label": "recipient",
            "type": {
              "displayName": [
                "H160"
              ],
              "type": 0
            }
          },
          {
            "label": "duration",
            "type": {
              "displayName": [
                "u64"
              ],
              "type": 5
            }
          }
        ],
        "default": false,
        "docs": [
          " Creates a new money stream"
        ],
        "label": "create_stream",
        "mutates": true,
        "payable": true,
        "returnType": {
          "displayName": [
            "ink",
            "MessageResult"
          ],
          "type": 16
        },
        "selector": "0x8ec33dbd"
      },
      {
        "args": [
          {
            "label": "stream_id",
            "type": {
              "displayName": [
                "u64"
              ],
              "type": 5
            }
          }
        ],
        "default": false,
        "docs": [
          " Calculates the claimable balance for a stream"
        ],
        "label": "get_claimable_balance",
        "mutates": false,
        "payable": false,
        "returnType": {
          "displayName": [
            "ink",
            "MessageResult"
          ],
          "type": 19
        },
        "selector": "0x14382e73"
      },
      {
        "args": [
          {
            "label": "stream_id",
            "type": {
              "displayName": [
                "u64"
              ],
              "type": 5
            }
          }
        ],
        "default": false,
        "docs": [
          " Allows recipient to withdraw accrued funds"
        ],
        "label": "withdraw_from_stream",
        "mutates": true,
        "payable": false,
        "returnType": {
          "displayName": [
            "ink",
            "MessageResult"
          ],
          "type": 21
        },
        "selector": "0x00115d06"
      },
      {
        "args": [
          {
            "label": "stream_id",
            "type": {
              "displayName": [
                "u64"
              ],
              "type": 5
            }
          }
        ],
        "default": false,
        "docs": [
          " Cancels a stream and refunds both parties"
        ],
        "label": "cancel_stream",
        "mutates": true,
        "payable": false,
        "returnType": {
          "displayName": [
            "ink",
            "MessageResult"
          ],
          "type": 21
        },
        "selector": "0x84ca2f11"
      },
      {
        "args": [
          {
            "label": "stream_id",
            "type": {
              "displayName": [
                "u64"
              ],
              "type": 5
            }
          }
        ],
        "default": false,
        "docs": [
          " Get stream details"
        ],
        "label": "get_stream",
        "mutates": false,
        "payable": false,
        "returnType": {
          "displayName": [
            "ink",
            "MessageResult"
          ],
          "type": 23
        },
        "selector": "0xc878802c"
      },
      {
        "args": [],
        "default": false,
        "docs": [
          " Get total number of streams created"
        ],
        "label": "get_stream_count",
        "mutates": false,
        "payable": false,
        "returnType": {
          "displayName": [
            "ink",
            "MessageResult"
          ],
          "type": 25
        },
        "selector": "0x86ec0aeb"
      }
    ]
  },
  "storage": {
    "root": {
      "layout": {
        "struct": {
          "fields": [
            {
              "layout": {
                "root": {
                  "layout": {
                    "struct": {
                      "fields": [
                        {
                          "layout": {
                            "leaf": {
                              "key": "0xd6483efe",
                              "ty": 0
                            }
                          },
                          "name": "sender"
                        },
                        {
                          "layout": {
                            "leaf": {
                              "key": "0xd6483efe",
                              "ty": 0
                            }
                          },
                          "name": "recipient"
                        },
                        {
                          "layout": {
                            "leaf": {
                              "key": "0xd6483efe",
                              "ty": 3
                            }
                          },
                          "name": "total_amount"
                        },
                        {
                          "layout": {
                            "leaf": {
                              "key": "0xd6483efe",
                              "ty": 3
                            }
                          },
                          "name": "flow_rate"
                        },
                        {
                          "layout": {
                            "leaf": {
                              "key": "0xd6483efe",
                              "ty": 5
                            }
                          },
                          "name": "start_time"
                        },
                        {
                          "layout": {
                            "leaf": {
                              "key": "0xd6483efe",
                              "ty": 5
                            }
                          },
                          "name": "stop_time"
                        },
                        {
                          "layout": {
                            "leaf": {
                              "key": "0xd6483efe",
                              "ty": 3
                            }
                          },
                          "name": "amount_withdrawn"
                        },
                        {
                          "layout": {
                            "leaf": {
                              "key": "0xd6483efe",
                              "ty": 6
                            }
                          },
                          "name": "is_active"
                        }
                      ],
                      "name": "Stream"
                    }
                  },
                  "root_key": "0xd6483efe",
                  "ty": 7
                }
              },
              "name": "streams"
            },
            {
              "layout": {
                "leaf": {
                  "key": "0x00000000",
                  "ty": 5
                }
              },
              "name": "next_stream_id"
            }
          ],
          "name": "PolkadotStream"
        }
      },
      "root_key": "0x00000000",
      "ty": 13
    }
  },
  "types": [
    {
      "id": 0,
      "type": {
        "def": {
          "composite": {
            "fields": [
              {
                "type": 1,
                "typeName": "[u8; 20]"
              }
            ]
          }
        },
        "path": [
          "primitive_types",
          "H160"
        ]
      }
    },
    {
      "id": 1,
      "type": {
        "def": {
          "array": {
            "len": 20,
            "type": 2
          }
        }
      }
    },
    {
      "id": 2,
      "type": {
        "def": {
          "primitive": "u8"
        }
      }
    },
    {
      "id": 3,
      "type": {
        "def": {
          "composite": {
            "fields": [
              {
                "type": 4,
                "typeName": "[u64; 4]"
              }
            ]
          }
        },
        "path": [
          "primitive_types",
          "U256"
        ]
      }
    },
    {
      "id": 4,
      "type": {
        "def": {
          "array": {
            "len": 4,
            "type": 5
          }
        }
      }
    },
    {
      "id": 5,
      "type": {
        "def": {
          "primitive": "u64"
        }
      }
    },
    {
      "id": 6,
      "type": {
        "def": {
          "primitive": "bool"
        }
      }
    },
    {
      "id": 7,
      "type": {
        "def": {
          "composite": {}
        },
        "params": [
          {
            "name": "K",
            "type": 5
          },
          {
            "name": "V",
            "type": 8
          },
          {
            "name": "KeyType",
            "type": 9
          }
        ],
        "path": [
          "ink_storage",
          "lazy",
          "mapping",
          "Mapping"
        ]
      }
    },
    {
      "id": 8,
      "type": {
        "def": {
          "composite": {
            "fields": [
              {
                "name": "sender",
                "type": 0,
                "typeName": "H160"
              },
              {
                "name": "recipient",
                "type": 0,
                "typeName": "H160"
              },
              {
                "name": "total_amount",
                "type": 3,
                "typeName": "U256"
              },
              {
                "name": "flow_rate",
                "type": 3,
                "typeName": "U256"
              },
              {
                "name": "start_time",
                "type": 5,
                "typeName": "Timestamp"
              },
              {
                "name": "stop_time",
                "type": 5,
                "typeName": "Timestamp"
              },
              {
                "name": "amount_withdrawn",
                "type": 3,
                "typeName": "U256"
              },
              {
                "name": "is_active",
                "type": 6,
                "typeName": "bool"
              }
            ]
          }
        },
        "path": [
          "polkadot_stream",
          "polkadot_stream",
          "Stream"
        ]
      }
    },
    {
      "id": 9,
      "type": {
        "def": {
          "composite": {}
        },
        "params": [
          {
            "name": "L",
            "type": 10
          },
          {
            "name": "R",
            "type": 11
          }
        ],
        "path": [
          "ink_storage_traits",
          "impls",
          "ResolverKey"
        ]
      }
    },
    {
      "id": 10,
      "type": {
        "def": {
          "composite": {}
        },
        "path": [
          "ink_storage_traits",
          "impls",
          "AutoKey"
        ]
      }
    },
    {
      "id": 11,
      "type": {
        "def": {
          "composite": {}
        },
        "params": [
          {
            "name": "ParentKey",
            "type": 12
          }
        ],
        "path": [
          "ink_storage_traits",
          "impls",
          "ManualKey"
        ]
      }
    },
    {
      "id": 12,
      "type": {
        "def": {
          "tuple": []
        }
      }
    },
    {
      "id": 13,
      "type": {
        "def": {
          "composite": {
            "fields": [
              {
                "name": "streams",
                "type": 7,
                "typeName": "<Mapping<u64, Stream> as::ink::storage::traits::AutoStorableHint<\n::ink::storage::traits::ManualKey<4265494742u32, ()>,>>::Type"
              },
              {
                "name": "next_stream_id",
                "type": 5,
                "typeName": "<u64 as::ink::storage::traits::AutoStorableHint<::ink::storage\n::traits::ManualKey<3407574223u32, ()>,>>::Type"
              }
            ]
          }
        },
        "path": [
          "polkadot_stream",
          "polkadot_stream",
          "PolkadotStream"
        ]
      }
    },
    {
      "id": 14,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 12
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 15
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 12
          },
          {
            "name": "E",
            "type": 15
          }
        ],
        "path": [
          "Result"
        ]
      }
    },
    {
      "id": 15,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "index": 1,
                "name": "CouldNotReadInput"
              }
            ]
          }
        },
        "path": [
          "ink_primitives",
          "LangError"
        ]
      }
    },
    {
      "id": 16,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 17
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 15
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 17
          },
          {
            "name": "E",
            "type": 15
          }
        ],
        "path": [
          "Result"
        ]
      }
    },
    {
      "id": 17,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 5
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 18
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 5
          },
          {
            "name": "E",
            "type": 18
          }
        ],
        "path": [
          "Result"
        ]
      }
    },
    {
      "id": 18,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "index": 0,
                "name": "StreamNotActive"
              },
              {
                "index": 1,
                "name": "NotRecipient"
              },
              {
                "index": 2,
                "name": "NotAuthorized"
              },
              {
                "index": 3,
                "name": "NoFundsToWithdraw"
              },
              {
                "index": 4,
                "name": "TransferFailed"
              },
              {
                "index": 5,
                "name": "InvalidRecipient"
              },
              {
                "index": 6,
                "name": "InvalidDuration"
              },
              {
                "index": 7,
                "name": "InvalidAmount"
              },
              {
                "index": 8,
                "name": "ZeroFlowRate"
              },
              {
                "index": 9,
                "name": "StreamNotFound"
              }
            ]
          }
        },
        "path": [
          "polkadot_stream",
          "polkadot_stream",
          "Error"
        ]
      }
    },
    {
      "id": 19,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 20
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 15
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 20
          },
          {
            "name": "E",
            "type": 15
          }
        ],
        "path": [
          "Result"
        ]
      }
    },
    {
      "id": 20,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 3
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 18
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 3
          },
          {
            "name": "E",
            "type": 18
          }
        ],
        "path": [
          "Result"
        ]
      }
    },
    {
      "id": 21,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 22
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 15
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 22
          },
          {
            "name": "E",
            "type": 15
          }
        ],
        "path": [
          "Result"
        ]
      }
    },
    {
      "id": 22,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 12
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 18
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 12
          },
          {
            "name": "E",
            "type": 18
          }
        ],
        "path": [
          "Result"
        ]
      }
    },
    {
      "id": 23,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 24
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 15
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 24
          },
          {
            "name": "E",
            "type": 15
          }
        ],
        "path": [
          "Result"
        ]
      }
    },
    {
      "id": 24,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "index": 0,
                "name": "None"
              },
              {
                "fields": [
                  {
                    "type": 8
                  }
                ],
                "index": 1,
                "name": "Some"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 8
          }
        ],
        "path": [
          "Option"
        ]
      }
    },
    {
      "id": 25,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 5
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 15
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 5
          },
          {
            "name": "E",
            "type": 15
          }
        ],
        "path": [
          "Result"
        ]
      }
    },
    {
      "id": 26,
      "type": {
        "def": {
          "composite": {
            "fields": [
              {
                "type": 27,
                "typeName": "[u8; 32]"
              }
            ]
          }
        },
        "path": [
          "ink_primitives",
          "types",
          "AccountId"
        ]
      }
    },
    {
      "id": 27,
      "type": {
        "def": {
          "array": {
            "len": 32,
            "type": 2
          }
        }
      }
    },
    {
      "id": 28,
      "type": {
        "def": {
          "primitive": "u128"
        }
      }
    },
    {
      "id": 29,
      "type": {
        "def": {
          "composite": {
            "fields": [
              {
                "type": 27,
                "typeName": "[u8; 32]"
              }
            ]
          }
        },
        "path": [
          "ink_primitives",
          "types",
          "Hash"
        ]
      }
    },
    {
      "id": 30,
      "type": {
        "def": {
          "primitive": "u32"
        }
      }
    }
  ],
  "version": 6
}