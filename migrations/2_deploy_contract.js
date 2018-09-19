var MultiSigWallet = artifacts.require('MultiSigWallet.sol');
var SimpleToken = artifacts.require('SimpleToken.sol');
var MultiSigWalletCreator = artifacts.require('MultiSigWalletCreator.sol');
module.exports = function(deployer, network, accounts) {
	//deployer.deploy(
	//	MultiSigWallet, 
	//	[
	//		accounts[1],
	//		accounts[2]
	//	],
	//	2
	//);
	deployer.deploy(SimpleToken);
	deployer.deploy(MultiSigWalletCreator);
};
