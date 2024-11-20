// src/App.jsx

import React, { useEffect, useState } from 'react';
import WalletConnect from './components/WalletConnect';
import CampaignList from './components/CampaignList';
import CreateCampaign from './components/CreateCampaign';
import { ethers } from 'ethers';
import CampaignABI from './contracts/Campaign.json'; // Ensure this path is correct

const App = () => {
    const [account, setAccount] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [contract, setContract] = useState(null);

    useEffect(() => {
        const loadBlockchainData = async () => {
            if (window.ethereum) {
                try {
                    // Initialize provider and signer
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const signer = await provider.getSigner();
                    
                    // Replace with your deployed contract address
                    const address = "0x01e69f5F8B8cFBEEB58B18094aCaA6D45B1376cd"; 
                    
                    // Create contract instance
                    const campaignContract = new ethers.Contract(address, CampaignABI.abi, signer);
                    setContract(campaignContract);

                    // Load campaigns
                    await fetchCampaigns(campaignContract);
                } catch (error) {
                    console.error("Error loading blockchain data:", error);
                }
            } else {
                alert("Please install MetaMask!");
            }
        };

        loadBlockchainData();
    }, []);

    const fetchCampaigns = async (contract) => {
        try {
            const totalCampaigns = await contract.campaignCount();
            const loadedCampaigns = [];
            for (let i = 1; i <= totalCampaigns; i++) {
                const campaignData = await contract.campaigns(i);
                loadedCampaigns.push({
                    title: campaignData.title,
                    fundraiser: campaignData.fundraiser,
                    goal: campaignData.goal.toString(), // Convert to string for display
                    raisedAmount: campaignData.raisedAmount.toString(), // Convert to string for display
                    deadline: campaignData.deadline.toString(), // Convert to string for display
                    story: campaignData.story,
                    isActive: campaignData.isActive
                });
            }
            setCampaigns(loadedCampaigns);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        }
    };

    return (
        <div className="container mx-auto p-4">
            {!account ? (
                <WalletConnect setAccount={setAccount} />
            ) : (
                <>
                    <h1 className="text-xl font-bold">Welcome {account}</h1>
                    <CreateCampaign contract={contract} setCampaigns={setCampaigns} />
                    <h2 className="text-lg mt-4">Active Campaigns</h2>
                    <CampaignList campaigns={campaigns} contract={contract} /> {/* Pass contract here */}
                </>
            )}
        </div>
    );
};

export default App;