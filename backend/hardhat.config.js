/** @type import('hardhat/config').HardhatUserConfig */
require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

module.exports = {
    solidity: "0.8.0",
    networks: {
        sepolia: {
            url: process.env.INFURA_URL,
            accounts: [process.env.PRIVATE_KEY]
        }
    }
};