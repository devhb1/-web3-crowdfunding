// src/components/WalletConnect.js

import React from 'react';
import { ethers } from 'ethers';

const WalletConnect = ({ setAccount }) => {
    const connectWallet = async () => {
        if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(accounts[0]);
        } else {
            alert("Please install MetaMask!");
        }
    };

    return (
        <div className="flex justify-center mt-10">
            <button onClick={connectWallet} className="bg-blue-500 text-white px-4 py-2 rounded">
                Connect Wallet
            </button>
        </div>
    );
};

export default WalletConnect;