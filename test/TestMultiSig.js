const MultiSigWallet = artifacts.require('MultiSigWallet.sol');
const SimpleToken = artifacts.require('SimpleToken.sol');
const MultiSigWalletCreator = artifacts.require('MultiSigWalletCreator.sol');


/*
====================================================================================================
MultiSig tests
====================================================================================================
*/

contract('MultiSigWallet', (accounts) => {
    function randomInteger(min, max) {
        let rand = min - 0.5 + Math.random() * (max - min + 1);
        rand = Math.round(rand);
        return rand;
    }
    let MultiSigWalletFactoryContract;
    let SimpleTokenContract;
    let MultiSigWalletContract;
    // Outside addresses
    const tokenOwner = accounts[0];
    const signers = [
        accounts[1],
        accounts[2],
        accounts[3],
        accounts[4],
        accounts[5],
    ];
    const REQUIRED_CONFIRMATIONS = 3;
    const MULTISIG_NAME = 'My Awesome Multisig';
    const multisigCreator = accounts[6];
    const notSigner = accounts[7];
    const etherReciever = accounts[8];
    const tokenReciever = accounts[9];

    /*
====================================================================================================
Start of testing
====================================================================================================
*/
    let factoryInstance = null;

    before(async () => {
        factoryInstance = await MultiSigWalletCreator.new({ from: multisigCreator });
    });

    describe('Creation of multisig from the factory', async () => {
        let walletInstance = null;
        const systemInfoString = 'System info string';

        beforeEach(async () => {
            await factoryInstance.createMultiSigWallet(
                signers,
                REQUIRED_CONFIRMATIONS,
                MULTISIG_NAME,
                {
                    from: multisigCreator,
                },
            );
        });

        it('creates Multisig Wallet from factory', async () => {
            // check that every signer has this multisig assosiated with one
            for (const signer of signers) {
                const address = await factoryInstance.wallets(signer, 0);
                assert.ok(address, 'MultiSigWallet wasn\'t created');
            }
            const walletAddress = await factoryInstance.wallets(signers[0], 0);
            walletInstance = MultiSigWallet.at(walletAddress);
        });

        it('does not allow to set info string anyone but the owner', async () => {
            try {
                await factoryInstance.setCurrentSystemInfo(systemInfoString, { from: notSigner });
            } catch (err) {
                assert.equal(err.message, 'VM Exception while processing transaction: revert');
                return;
            }
            assert(false, 'system info was changed');

        });

        it('sets proper system info string', async () => {
            await factoryInstance.setCurrentSystemInfo(systemInfoString, { from: multisigCreator });
            const setString = await factoryInstance.currentSystemInfo();
            assert.equal(setString, systemInfoString);
        });

        it('check signers, name and required confirmations', async () => {
            const _signers = await walletInstance.getSigners();
            const _REQUIRED_CONFIRMATIONS = await walletInstance.requiredConfirmations();
            const walletName = await walletInstance.name();
            assert.deepEqual(_signers, signers, 'signers list isn\'t correct');
            assert.equal(
                REQUIRED_CONFIRMATIONS,
                _REQUIRED_CONFIRMATIONS.toNumber(),
                'required confirmations isn\'t correct',
            );
            assert.equal(MULTISIG_NAME, walletName, 'wallet name is not correct');
        });

        it('check deposit', async () => {
            const value = web3.toWei(5, 'ether');
            await walletInstance.sendTransaction({ from: multisigCreator, value });
            const balance = await web3.eth.getBalance(walletInstance.address);
            assert.equal(balance.toNumber(), value);
        });
    });

    describe('Creating transactions', async () => {
        let walletInstance = null;

        beforeEach(async () => {
            const receipt = await factoryInstance.createMultiSigWallet(
                signers,
                REQUIRED_CONFIRMATIONS,
                MULTISIG_NAME,
                {
                    from: multisigCreator,
                },
            );
            const address = receipt.logs[0].args._wallet;
            walletInstance = MultiSigWallet.at(address);
        });


        it('should allow create transaction only by signers', () => walletInstance.createTransaction(
            etherReciever,
            0,
            web3.toWei(5, 'ether'),
            {
                from: notSigner,
            },
        )
            .then(() => {
                assert(false, 'tx was created by not signer');
            })
            .catch((error) => {
                assert(
                    error.message == 'VM Exception while processing transaction: revert',
                    'wrong error message',
                );
            }));

        it('create ether transfer transaction', async () => {
            await walletInstance.createTransaction(
                etherReciever,
                0,
                web3.toWei(5, 'ether'),
                {
                    from: signers[0],
                },
            );
            const txCount = await walletInstance.txCount();
            const tx = await walletInstance.transactions(txCount.toNumber());
            assert.deepEqual(
                tx[0],
                etherReciever,
                'created tx isn\t correct',
            );
            assert.deepEqual(
                tx[1],
                '0x0000000000000000000000000000000000000000',
                'created tx isn\t correct',
            );
            assert.equal(
                tx[2].toNumber(),
                (web3.toWei(5, 'ether')),
                'created tx isn\t correct',
            );
            assert(tx[3].toNumber(), txCount.toNumber(), 'created tx isn\t correct');
            assert(!tx[4], 'created tx isn\t correct');
        });


        it('create token transfer transaction', async () => {
            const tokenAmount = 5 * (10 ** 18);

            SimpleTokenContract = await SimpleToken.deployed();
            await SimpleTokenContract.mintTokens(
                walletInstance.address,
                tokenAmount,
                {
                    from: tokenOwner,
                },
            );
            await walletInstance.createTransaction(
                tokenReciever,
                SimpleTokenContract.address,
                tokenAmount,
                {
                    from: signers[0],
                },
            );
            const txCount = await walletInstance.txCount();
            const tx = await walletInstance.transactions(txCount.toNumber());
            assert.deepEqual(
                tx[0],
                tokenReciever,
                'created tx isn\t correct',
            );
            assert.deepEqual(
                tx[1],
                SimpleTokenContract.address,
                'created tx isn\t correct',
            );
            assert.equal(
                tx[2].toNumber(),
                (web3.toWei(5, 'ether')),
                'created tx isn\t correct',
            );
            assert(tx[3].toNumber(), txCount.toNumber(), 'created tx isn\t correct');
            assert(!tx[4], 'created tx isn\t correct');
        });
    });

    describe('Signing transactions', async () => {
        let walletInstance = null;

        let ethTxIndex = null;
        let tokenTxIndex = null;
        const nonExistingTxIndex = 3;

        const tokenValue = 5 * (10 ** 18);

        beforeEach(async () => {
            const walletCreationReceipt = await factoryInstance.createMultiSigWallet(
                signers,
                REQUIRED_CONFIRMATIONS,
                MULTISIG_NAME,
                {
                    from: multisigCreator,
                },
            );
            const address = walletCreationReceipt.logs[0].args._wallet;
            walletInstance = MultiSigWallet.at(address);
            await walletInstance.sendTransaction({ value: web3.toWei(5, 'ether'), from: tokenOwner });
            SimpleTokenContract = await SimpleToken.deployed();
            await SimpleTokenContract.mintTokens(
                walletInstance.address,
                tokenValue,
                {
                    from: tokenOwner,
                },
            );
            const ethTxCreationReceipt = await walletInstance.createTransaction(
                etherReciever,
                0,
                web3.toWei(1, 'ether'),
                { from: signers[0] }
            );
            ethTxIndex = ethTxCreationReceipt.logs[0].args._txId.toNumber();
            const tokenTxCreationReceipt = await walletInstance.createTransaction(
                tokenReciever,
                SimpleTokenContract.address,
                tokenValue / 5,
                { from: signers[0] }
            );
            tokenTxIndex = tokenTxCreationReceipt.logs[0].args._txId.toNumber();
        });

        it('shouldn\'t allow to sign transaction twice', () => walletInstance.signTransaction(
            ethTxIndex,
            {
                from: signers[0],
            },
        )
            .then(() => {
                assert(false, 'tx was signed twice');
            })
            .catch((error) => {
                assert(
                    error.message == 'VM Exception while processing transaction: revert',
                    'wrong error message',
                );
            }));


        it('shouldn\'t allow to sign transaction only to non signer', () => walletInstance.signTransaction(
            ethTxIndex,
            {
                from: notSigner,
            },
        )
            .then(() => {
                assert(false, 'tx was signed by not signer');
            })
            .catch((error) => {
                assert(
                    error.message == 'VM Exception while processing transaction: revert',
                    'wrong error message',
                );
            }));

        it('shouldn\'t allow to unsign transaction only to non signer', () => walletInstance.unsignTransaction(
            ethTxIndex,
            {
                from: notSigner,
            },
        )
            .then(() => {
                assert(false, 'tx was signed by not signer');
            })
            .catch((error) => {
                assert(
                    error.message == 'VM Exception while processing transaction: revert',
                    'wrong error message',
                );
            }));

        it('shouldn\'t allow to sign unexisting transaction', () => walletInstance.signTransaction(
            nonExistingTxIndex,
            {
                from: signers[2],
            },
        )
            .then(() => {
                assert(false, 'tx was signed by not signer');
            })
            .catch((error) => {
                assert(
                    error.message == 'VM Exception while processing transaction: revert',
                    'wrong error message',
                );
            }));

        it('shouldn\'t allow to unsign  unsigned transaction', () => walletInstance.unsignTransaction(
            ethTxIndex,
            {
                from: signers[2],
            },
        )
            .then(() => {
                assert(false, 'tx was unsigned twice');
            })
            .catch((error) => {
                assert(
                    error.message == 'VM Exception while processing transaction: revert',
                    'wrong error message',
                );
            }));

        it('check signing and exectuting ether transfer', async () => {
            const balanceBefore = await web3.eth.getBalance(etherReciever);
            await walletInstance.signTransaction(
                ethTxIndex,
                {
                    from: signers[1],
                },
            );
            let balanceCurrent = await web3.eth.getBalance(etherReciever);
            assert.deepEqual(
                balanceBefore,
                balanceCurrent,
                'tx was exectuted with 2 confirmations instead 3',
            );
            await walletInstance.signTransaction(
                ethTxIndex,
                {
                    from: signers[2],
                },
            );
            balanceCurrent = await web3.eth.getBalance(etherReciever);
            const tx = await walletInstance.transactions.call(1);
            assert.deepEqual(
                balanceBefore.plus(web3.toWei(1, 'ether')),
                balanceCurrent,
                'tx wasn\'t exectuted',
            );
            assert.equal(
                tx[4],
                true,
                'tx wasn\'t exectuted',
            );
        });

        it('check signing and exectuting token transfer', async () => {
            const balanceBefore = await SimpleTokenContract.balanceOf(tokenReciever);
            await walletInstance.signTransaction(
                tokenTxIndex,
                {
                    from: signers[1],
                },
            );
            let balanceCurrent = await SimpleTokenContract.balanceOf(tokenReciever);
            assert.deepEqual(
                balanceBefore,
                balanceCurrent,
                'tx was exectuted with 2 confirmations instead 3',
            );
            await walletInstance.signTransaction(
                tokenTxIndex,
                {
                    from: signers[2],
                },
            );
            balanceCurrent = await SimpleTokenContract.balanceOf(tokenReciever);
            const tx = await walletInstance.transactions(tokenTxIndex);
            assert.deepEqual(
                balanceBefore.plus(tokenValue / 5),
                balanceCurrent,
                'tx wasn\'t exectuted',
            );
            assert.equal(
                tx[4],
                true,
                'tx wasn\'t exectuted',
            );
        });

        describe('When transaction is executed', async () => {
            beforeEach(async () => {
                for (const signer of signers.slice(1, 3)) {
                    await walletInstance.signTransaction(ethTxIndex, { from: signer });
                }
                // now transaction should be executed
            });

            it('shouldn\'t allow to sign  exectuted transaction', async () => walletInstance.signTransaction(
                ethTxIndex,
                {
                    from: signers[4],
                },
            )
                .then(() => {
                    assert(false, 'exectuted transaction was signed');
                })
                .catch((error) => {
                    assert(
                        error.message == 'VM Exception while processing transaction: revert',
                        'wrong error message',
                    );
                }));

            it('should not allow to unsign executed transaction', async () => walletInstance.unsignTransaction(
                ethTxIndex,
                {
                    from: signers[0],
                },
            )
                .then(() => {
                    assert(false, 'exectuted transaction was unsigned');
                })
                .catch((error) => {
                    assert(
                        error.message == 'VM Exception while processing transaction: revert',
                        'wrong error message',
                    );
                }));
        });
    });
});

