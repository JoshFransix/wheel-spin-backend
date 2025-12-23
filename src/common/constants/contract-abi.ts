export const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "vrfCoordinator", "type": "address" },
      { "internalType": "uint256", "name": "subscriptionId", "type": "uint256" },
      { "internalType": "bytes32", "name": "keyHash", "type": "bytes32" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "roomId", "type": "uint256" },
      { "indexed": false, "internalType": "uint8", "name": "roomSize", "type": "uint8" },
      { "indexed": false, "internalType": "uint256", "name": "betAmount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "RoomCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "roomId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "uint8", "name": "character", "type": "uint8" },
      { "indexed": false, "internalType": "string", "name": "nickname", "type": "string" },
      { "indexed": false, "internalType": "uint8", "name": "currentPlayers", "type": "uint8" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "PlayerJoined",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "roomId", "type": "uint256" },
      { "indexed": false, "internalType": "uint8", "name": "totalPlayers", "type": "uint8" },
      { "indexed": false, "internalType": "uint256", "name": "totalPot", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "GameStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "roomId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "requestId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "RandomnessRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "roomId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "winner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "payout", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "feeAmount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "GameCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "collector", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "FeeCollected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "nickname", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "NicknameSet",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "uint8", "name": "roomSize", "type": "uint8" },
      { "internalType": "uint8", "name": "character", "type": "uint8" }
    ],
    "name": "placeBet",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "roomId", "type": "uint256" }],
    "name": "getRoomInfo",
    "outputs": [
      { "internalType": "uint8", "name": "roomSize", "type": "uint8" },
      { "internalType": "uint256", "name": "betAmount", "type": "uint256" },
      { "internalType": "enum SpinTheWheel.RoomStatus", "name": "status", "type": "uint8" },
      { "internalType": "uint8", "name": "currentPlayers", "type": "uint8" },
      { "internalType": "uint256", "name": "totalPot", "type": "uint256" },
      { "internalType": "address", "name": "winner", "type": "address" },
      { "internalType": "address[]", "name": "players", "type": "address[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "roomId", "type": "uint256" }],
    "name": "getCaracterInRoom",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "wallet", "type": "address" },
          { "internalType": "uint8", "name": "character", "type": "uint8" },
          { "internalType": "string", "name": "nickname", "type": "string" },
          { "internalType": "uint256", "name": "joinedAt", "type": "uint256" }
        ],
        "internalType": "struct SpinTheWheel.Player[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentRoomId",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "accumulatedFees",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "FEE_PERCENTAGE",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];
