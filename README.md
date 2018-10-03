# Phenom Multisig Wallet 
Ethereum multisig wallet with ERC20 tokens support.

## Requirements
* Node.js at least 7.0.0
* npm
* truffle for development
* ganache for testing

## Installation
* Clone this repository into your local machine.
* Run ```truffle compile``` to compile smart contracts

## Contract functions

### Contract ```MultiSigWallet```
#### constructor
```
    constructor(
        address[] _signers, 
        uint _requiredConfirmations,
        string _name
    ) 
    public
```
Contract constructor sets signers list, required number of confirmations and name of the wallet.

#### createTransaction
```
    function createTransaction(
        address _to, 
        address _tokenAddress,
        uint _amount
    ) 
    public 
    onlySigners
```
Allows to create a new transaction

#### signTransaction
```
    function signTransaction(uint _txId) public onlySigners
```
Allows to sign a transaction

#### unsignTransaction
```
    function unsignTransaction(uint _txId) external onlySigners
```
Allows to unsign a transaction

#### getTransactionsId
```
    function getTransactionsId(
        bool _pending, 
        bool _done,
        bool _tokenTransfers,
        bool _etherTransfers, 
        uint _tailSize
    ) 
    public 
    view returns(uint[] _txIdList)
```
Allows to get transaction IDs with parameters, passed as functon arguments

#### isSigned
```
    function isSigned(uint _txId, address _signer) 
        public
        view
        returns (bool _isSigned) 
```
Allows to check whether tx is signed by signer

### Contract ```MultiSigWalletCreator```

#### createMultiSigWallet
```
    function createMultiSigWallet(
        address[] _signers, 
        uint _requiredConfirmations,
        string _name
    )
    public
    returns (address wallet)
```
Allows to create a multisig wallet with given parameters

## Testing
Having running ganache/testrpc run ```truffle tests```.
