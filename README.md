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
##### Parameters
* `_signers`: array of addresses of signers to multisig wallet
* `_requiredConfirmations`: number of required confirmations for transaction to be sent (e.g. 2 confirmations of 3 signers total)
* `_name`: name of the multisig wallet

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
##### Parameters
* `_to`: address to which transation will be sent
* `_tokenAddress`
    * In case of ether transaction: zero-address (e.g. `0x`)
    * In case of `ERC20` token transfer: address of the token contract.
* `_amount`: amount of token to transfer

#### signTransaction
```
    function signTransaction(uint _txId) public onlySigners
```
Allows to sign a transaction
##### Parameters
* `_txId`: id of the transaction to be signed

#### unsignTransaction
```
    function unsignTransaction(uint _txId) external onlySigners
```
Allows to unsign a transaction
##### Parameters
* `_txId`: id of the transaction to be unsigned


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
##### Parameters
* `_pending`: is transaction still requires sufficient number of signatures to be executed
* `_done`: is transaction executed
* `_tokenTransfers`: include token transfers
* `_etherTransfers`: include ether transfers
* `_tailSize`: number of transaction ids to be returned


#### isSigned
```
    function isSigned(uint _txId, address _signer) 
        public
        view
        returns (bool _isSigned) 
```
Allows to check whether tx is signed by signer
##### Parameters
* `_txId`: id of the transaction
* `_signer`: address of the signer

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
##### Parameters
* `_signers`: array of addresses of signers to multisig wallet
* `_requiredConfirmations`: number of required confirmations for transaction to be sent (e.g. 2 confirmations of 3 signers total)
* `_name`: name of the multisig wallet


## Contract events
### Contract ```MultiSigWallet```
#### event TransactionCreated
```
event TransactionCreated(uint indexed _txId, uint indexed _timestamp, address indexed _creator);
```
is emitted when new transaction is created
#### event TranscationSended
```
event TranscationSended(uint indexed _txId, uint indexed _timestamp);
```
is emitted when transaction received sufficient number of signatures and executed.

#### event TranscationSigned
```
event TranscationSigned(uint indexed _txId, uint indexed _timestamp, address indexed _signer);
```
is emitted when transaction was signed by one of multisig's signers.

#### event TranscationUnsigned
```
event TranscationUnsigned(uint indexed _txId, uint indexed _timestamp, address indexed _signer);
```
is emitted when transaction was unsigned by one of multisig's signers.

#### event Deposit
```
event Deposit(uint _amount, address indexed _sender);
```
is emitted when multisig receives ether deposit.

### Contract ```MultiSigWalletCreator```
#### event walletCreated
```
event walletCreated(address indexed _creator, address indexed _wallet);
```
is emitted when new multisig is created.

## Testing
Having running ganache/testrpc run ```truffle tests```.
