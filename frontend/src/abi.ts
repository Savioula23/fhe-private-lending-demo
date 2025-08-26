export const ABI = [
  {
    "inputs":[{"internalType":"struct PermissionV2","name":"permission","type":"tuple"}],
    "name":"myDecision",
    "outputs":[
      {"components":[{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes","name":"nonce","type":"bytes"}],"internalType":"struct FHE.SealedUint","name":"","type":"tuple"},
      {"components":[{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes","name":"nonce","type":"bytes"}],"internalType":"struct FHE.SealedUint","name":"","type":"tuple"},
      {"components":[{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes","name":"nonce","type":"bytes"}],"internalType":"struct FHE.SealedBool","name":"","type":"tuple"},
      {"components":[{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes","name":"nonce","type":"bytes"}],"internalType":"struct FHE.SealedUint","name":"","type":"tuple"}
    ],
    "stateMutability":"view","type":"function"
  },
  {
    "inputs":[
      {"internalType":"inEuint64","name":"encIncome","type":"bytes"},
      {"internalType":"inEuint64","name":"encDebt","type":"bytes"}
    ],
    "name":"apply","outputs":[],"stateMutability":"nonpayable","type":"function"
  },
  {
    "inputs":[{"internalType":"inEuint64","name":"encPayment","type":"bytes"}],
    "name":"pay","outputs":[],"stateMutability":"nonpayable","type":"function"
  }
];