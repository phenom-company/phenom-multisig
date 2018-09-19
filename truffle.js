module.exports = {
    networks: {
        development: {
            host: 'localhost',
            port: 8545,
            network_id: '*', // Match any network id
            gasPrice: 25000000000,
            gas: 5000000,

        },
    },
};
