import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CampaignList = ({ campaigns, contract, account, onCampaignUpdate }) => {
    const [timeLeft, setTimeLeft] = useState({});
    const [campaignStatuses, setCampaignStatuses] = useState({});
    const [donors, setDonors] = useState({});
    const [showDonors, setShowDonors] = useState({});

    useEffect(() => {
        const fetchCampaignStatuses = async () => {
            const statuses = {};
            for (let campaign of campaigns) {
                try {
                    const status = await contract.getCampaignStatus(campaign.id);
                    statuses[campaign.id] = status;
                } catch (error) {
                    console.error(`Error fetching status for campaign ${campaign.id}:`, error);
                }
            }
            setCampaignStatuses(statuses);
        };

        if (contract && campaigns.length > 0) {
            fetchCampaignStatuses();
            updateTimeLeft();
        }
    }, [campaigns, contract]);

    useEffect(() => {
        const timer = setInterval(updateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [campaigns]);

    const updateTimeLeft = () => {
        const times = {};
        campaigns.forEach(campaign => {
            const deadline = parseInt(campaign.deadline);
            const now = Math.floor(Date.now() / 1000);
            times[campaign.id] = deadline > now ? deadline - now : 0;
        });
        setTimeLeft(times);
    };

    const fetchDonors = async (campaignId) => {
        try {
            const [donorAddresses, donationAmounts] = await contract.getDonors(campaignId);
            const donorsList = donorAddresses.map((address, i) => ({
                address,
                amount: ethers.formatEther(donationAmounts[i].toString())
            }));
            setDonors(prev => ({ ...prev, [campaignId]: donorsList }));
            setShowDonors(prev => ({ ...prev, [campaignId]: true }));
        } catch (error) {
            console.error("Error fetching donors:", error);
        }
    };

    const handleDonate = async (campaignId) => {
        const amount = prompt("Enter the amount in ETH you want to donate:");
        if (!amount) return;

        try {
            const parsedAmount = ethers.parseEther(amount);
            const campaign = campaigns.find(c => c.id === campaignId);
            const remainingGoal = ethers.toBigInt(campaign.goal) - ethers.toBigInt(campaign.raisedAmount);
            
            if (parsedAmount > remainingGoal) {
                alert(`Maximum donation amount for this campaign is ${ethers.formatEther(remainingGoal)} ETH`);
                return;
            }

            const tx = await contract.donate(campaignId, { value: parsedAmount });
            await tx.wait();
            onCampaignUpdate();
            alert("Donation successful!");
        } catch (error) {
            console.error("Error during donation:", error);
            alert(error.message || "Donation failed. Please try again.");
        }
    };

    const handleWithdraw = async (campaignId) => {
        try {
            const campaigns = await contract.campaigns(campaignId);
            const status = await contract.getCampaignStatus(campaignId);
    
            // Check withdrawal conditions
            const isOwner = campaigns.fundraiser.toLowerCase() === account.toLowerCase();
            const isEnded = status.hasEnded;
            const hasReachedGoal = status.hasReachedGoal;
            const isNotWithdrawn = !campaigns.isWithdrawn;
    
            if (!isOwner) {
                alert("Only campaign owner can withdraw funds.");
                return;
            }
    
            if (!isEnded && !hasReachedGoal) {
                alert("Campaign must be ended or goal reached to withdraw.");
                return;
            }
    
            if (!isNotWithdrawn) {
                alert("Funds have already been withdrawn.");
                return;
            }
    
            const tx = await contract.withdrawFunds(campaignId);
            await tx.wait();
            onCampaignUpdate();
            alert("Withdrawal successful!");
        } catch (error) {
            console.error("Error during withdrawal:", error);
            alert(error.message || "Withdrawal failed. Please try again.");
        }
    };
    const formatTime = (seconds) => {
        if (seconds <= 0) return "Ended";
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {campaigns.map((campaign) => {
                const goal = ethers.formatEther(campaign.goal);
                const raised = ethers.formatEther(campaign.raisedAmount);
                const percentage = (parseFloat(raised) / parseFloat(goal)) * 100;
                const isCampaignOwner = account.toLowerCase() === campaign.fundraiser.toLowerCase();
                const status = campaignStatuses[campaign.id];
                const campaignDonors = donors[campaign.id] || [];
                const timeLeftSeconds = timeLeft[campaign.id] || 0;

                // Determine if withdrawal is possible
                const canWithdraw = 
                    isCampaignOwner && 
                    status && 
                    (!status.isActive || timeLeftSeconds <= 0) && 
                    !status.isWithdrawn;

                return (
                    <div key={campaign.id} className="border rounded-xl p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-xl font-bold mb-2">{campaign.title}</h3>
                        <p className="text-gray-600 mb-4">{campaign.story}</p>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Progress</span>
                                    <span>{percentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 rounded-full h-2"
                                        style={{ width: `${Math.min(100, percentage)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span>{raised} ETH raised</span>
                                    <span>{goal} ETH goal</span>
                                </div>
                            </div>

                            <div className="text-sm text-gray-600">
                                Time left: {formatTime(timeLeftSeconds)}
                            </div>

                            <div className="space-y-2 pt-2">
                                {status?.isActive && (
                                    <button
                                        onClick={() => handleDonate(campaign.id)}
                                        className="w-full px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-300"
                                    >
                                        Donate Now
                                    </button>
                                )}
                                
                                {canWithdraw && (
                                    <button
                                        onClick={() => handleWithdraw(campaign.id)}
                                        className="w-full px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-300"
                                    >
                                        Withdraw Funds
                                    </button>
                                )}

                                <button
                                    onClick={() => fetchDonors(campaign.id)}
                                    className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-300"
                                >
                                    {showDonors[campaign.id] ? 'Hide Donors' : 'Show Donors'}
                                </button>

                                {showDonors[campaign.id] && (
                                    <div className="mt-4 border-t pt-4">
                                        <h4 className="font-semibold mb-2">Donors:</h4>
                                        {campaignDonors.length > 0 ? (
                                            <div className="max-h-40 overflow-y-auto">
                                                {campaignDonors.map((donor, i) => (
                                                    <div key={i} className="text-sm py-1 flex justify-between">
                                                        <span className="text-gray-600">
                                                            {donor.address.slice(0, 6)}...{donor.address.slice(-4)}
                                                        </span>
                                                        <span className="font-medium">{donor.amount} ETH</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No donors yet</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CampaignList;