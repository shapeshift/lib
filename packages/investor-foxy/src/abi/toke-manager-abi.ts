import { AbiItem } from 'web3-utils'

export const tokeManagerAbi: AbiItem[] = [
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'bytes32', name: 'id', type: 'bytes32' },
      { indexed: false, internalType: 'address', name: 'controller', type: 'address' }
    ],
    name: 'ControllerRegistered',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'bytes32', name: 'id', type: 'bytes32' },
      { indexed: false, internalType: 'address', name: 'controller', type: 'address' }
    ],
    name: 'ControllerUnregistered',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint256', name: 'duration', type: 'uint256' }],
    name: 'CycleDurationSet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' }],
    name: 'CycleRolloverComplete',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' }],
    name: 'CycleRolloverStarted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'bytes32', name: 'controller', type: 'bytes32' },
      { indexed: false, internalType: 'address', name: 'adapaterAddress', type: 'address' },
      { indexed: false, internalType: 'bytes', name: 'data', type: 'bytes' }
    ],
    name: 'DeploymentStepExecuted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address', name: 'fxStateSender', type: 'address' },
      { indexed: false, internalType: 'address', name: 'destinationOnL2', type: 'address' }
    ],
    name: 'DestinationsSet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'bool', name: 'eventSendSet', type: 'bool' }],
    name: 'EventSendSet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address', name: 'pool', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'LiquidityMovedToManager',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address', name: 'pool', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'LiquidityMovedToPool',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address[]', name: 'addresses', type: 'address[]' },
      { indexed: false, internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }
    ],
    name: 'ManagerSwept',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'nextCycleStartTime', type: 'uint256' }
    ],
    name: 'NextCycleStartSet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'address', name: 'pool', type: 'address' }],
    name: 'PoolRegistered',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'address', name: 'pool', type: 'address' }],
    name: 'PoolUnregistered',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'previousAdminRole', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'newAdminRole', type: 'bytes32' }
    ],
    name: 'RoleAdminChanged',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: true, internalType: 'address', name: 'sender', type: 'address' }
    ],
    name: 'RoleGranted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: true, internalType: 'address', name: 'sender', type: 'address' }
    ],
    name: 'RoleRevoked',
    type: 'event'
  },
  {
    inputs: [],
    name: 'ADMIN_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'MID_CYCLE_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'ROLLOVER_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'START_ROLLOVER_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: '_eventSend',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'string', name: 'rewardsIpfsHash', type: 'string' }],
    name: 'completeRollover',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'currentCycle',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'currentCycleIndex',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'cycleDuration',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'cycleRewardsHashes',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'destinations',
    outputs: [
      { internalType: 'contract IFxStateSender', name: 'fxStateSender', type: 'address' },
      { internalType: 'address', name: 'destinationOnL2', type: 'address' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: 'bytes32', name: 'controllerId', type: 'bytes32' },
              { internalType: 'bytes', name: 'data', type: 'bytes' }
            ],
            internalType: 'struct IManager.ControllerTransferData[]',
            name: 'cycleSteps',
            type: 'tuple[]'
          }
        ],
        internalType: 'struct IManager.MaintenanceExecution',
        name: 'params',
        type: 'tuple'
      }
    ],
    name: 'executeMaintenance',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: 'address', name: 'pool', type: 'address' },
              { internalType: 'uint256', name: 'amount', type: 'uint256' }
            ],
            internalType: 'struct IManager.PoolTransferData[]',
            name: 'poolData',
            type: 'tuple[]'
          },
          {
            components: [
              { internalType: 'bytes32', name: 'controllerId', type: 'bytes32' },
              { internalType: 'bytes', name: 'data', type: 'bytes' }
            ],
            internalType: 'struct IManager.ControllerTransferData[]',
            name: 'cycleSteps',
            type: 'tuple[]'
          },
          { internalType: 'address[]', name: 'poolsForWithdraw', type: 'address[]' },
          { internalType: 'bool', name: 'complete', type: 'bool' },
          { internalType: 'string', name: 'rewardsIpfsHash', type: 'string' }
        ],
        internalType: 'struct IManager.RolloverExecution',
        name: 'params',
        type: 'tuple'
      }
    ],
    name: 'executeRollover',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getControllers',
    outputs: [{ internalType: 'bytes32[]', name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getCurrentCycle',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getCurrentCycleIndex',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getCycleDuration',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getPools',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'uint256', name: 'index', type: 'uint256' }
    ],
    name: 'getRoleMember',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }],
    name: 'getRoleMemberCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getRolloverStatus',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' }
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' }
    ],
    name: 'hasRole',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_cycleDuration', type: 'uint256' },
      { internalType: 'uint256', name: '_nextCycleStartTime', type: 'uint256' }
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'nextCycleStartTime',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'id', type: 'bytes32' },
      { internalType: 'address', name: 'controller', type: 'address' }
    ],
    name: 'registerController',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
    name: 'registerPool',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'registeredControllers',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' }
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' }
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'rolloverStarted',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'duration', type: 'uint256' }],
    name: 'setCycleDuration',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_fxStateSender', type: 'address' },
      { internalType: 'address', name: '_destinationOnL2', type: 'address' }
    ],
    name: 'setDestinations',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'bool', name: '_eventSendSet', type: 'bool' }],
    name: 'setEventSend',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_nextCycleStartTime', type: 'uint256' }],
    name: 'setNextCycleStartTime',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }],
    name: 'setupRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'startCycleRollover',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address[]', name: 'poolAddresses', type: 'address[]' }],
    name: 'sweep',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'id', type: 'bytes32' }],
    name: 'unRegisterController',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
    name: 'unRegisterPool',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]
