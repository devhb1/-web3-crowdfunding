import React, { useEffect, useState } from 'react';
import CampaignList from '../components/CampaignList'; 
import CreateCampaign from '../components/CreateCampaign'; 
import WalletConnect from '../components/WalletConnect';
import { ethers } from 'ethers';
import CampaignABI from '../contracts/Campaign.json'; 
const CrowdfundingPage = () => {
    
    const [account, setAccount] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [contract, setContract] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateCampaign, setShowCreateCampaign] = useState(false);

    // Effect to initialize blockchain connection and load data when the component mounts
    useEffect(() => {
        const loadBlockchainData = async () => {
            if (window.ethereum) {
                try {
                    // Listen for account changes in MetaMask
                    window.ethereum.on('accountsChanged', (accounts) => setAccount(accounts[0]));

                    // Initialize a provider and signer using ethers.js
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const signer = await provider.getSigner();

                   // the deployed contract's address
                    const address = "0xef49eB3407CD79ad2dEDdcDdCE9Be93514bCd991";

                    // Create a contract instance
                    const campaignContract = new ethers.Contract(address, CampaignABI.abi, signer);
                    setContract(campaignContract);

                    // Fetch all campaigns from the contract
                    await fetchCampaigns(campaignContract);
                } catch (error) {
                    console.error("Error loading blockchain data:", error);
                } finally {
                    // Stop showing the loading indicator
                    setIsLoading(false);
                }
            } else {
                // Alert the user to install MetaMask if not found
                alert("Please install MetaMask!");
                setIsLoading(false);
            }
        };

        loadBlockchainData();

        // Cleanup function to remove listeners when the component unmounts
        return () => {
            if (window.ethereum) window.ethereum.removeAllListeners('accountsChanged');
        };
    }, []);

    // Function to fetch campaigns from the blockchain
    const fetchCampaigns = async (campaignContract) => {
        try {
            const totalCampaigns = await campaignContract.campaignCount(); // Get the total number of campaigns
            const loadedCampaigns = [];

            // Loop through all campaigns and fetch their details
            for (let i = 1; i <= totalCampaigns; i++) {
                const campaignData = await campaignContract.campaigns(i);
                const status = await campaignContract.getCampaignStatus(i);

                // Add campaign details to the list
                loadedCampaigns.push({
                    id: i,
                    title: campaignData.title,
                    fundraiser: campaignData.fundraiser,
                    goal: campaignData.goal.toString(),
                    raisedAmount: campaignData.raisedAmount.toString(),
                    deadline: campaignData.deadline.toString(),
                    story: campaignData.story,
                    imageUrl: campaignData.imageUrl,
                    isActive: campaignData.isActive,
                    isWithdrawn: campaignData.isWithdrawn,
                    status: status,
                });
            }
            setCampaigns(loadedCampaigns);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-blue-600">Web3 Crowdfunding</h1>
                        
                        {/* Wallet connection button or account display */}
                        {!account ? (
                            <WalletConnect setAccount={setAccount} /> // WalletConnect component handles wallet login
                        ) : (
                            <div className="flex items-center space-x-4">
                                {/* Display shortened wallet address */}
                                <span className="text-sm text-gray-600">
                                    {account.slice(0, 6)}...{account.slice(-4)}
                                </span>
                                {/* Button to toggle the campaign creation form */}
                                <button
                                    onClick={() => setShowCreateCampaign(!showCreateCampaign)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-300"
                                >
                                    {showCreateCampaign ? 'Hide Form' : 'Create Campaign'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="container mx-auto px-4 py-8">
                {isLoading ? (
                    // Loading spinner
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : account ? (
                    // Content displayed when the user is logged in
                    <div className="space-y-8">
                        {/* Campaign creation form */}
                        {showCreateCampaign && (
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold mb-4">Create New Campaign</h2>
                                <CreateCampaign 
                                    contract={contract} 
                                    setCampaigns={setCampaigns} 
                                    onSuccess={() => {
                                        setShowCreateCampaign(false);
                                        fetchCampaigns(contract); // Reload campaigns after a new one is created
                                    }}
                                />
                            </div>
                        )}

                        {/* Active Campaigns Section */}
                        <div>
                            <h2 className="text-xl font-bold mb-4">Active Campaigns</h2>
                            <CampaignList 
                                campaigns={campaigns} 
                                contract={contract} 
                                account={account}
                                onCampaignUpdate={() => fetchCampaigns(contract)} // Refresh campaigns on update
                            />
                        </div>
                    </div>
                ) : (
                    // Message for users who haven't connected their wallet
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-bold text-gray-700">Welcome to Web3 Crowdfunding</h2>
                        <p className="mt-4 text-gray-600">Connect your wallet to start creating or supporting campaigns</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CrowdfundingPage;
