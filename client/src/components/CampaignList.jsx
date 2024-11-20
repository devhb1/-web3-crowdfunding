import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CampaignList = ({ campaigns, contract, account }) => {
    const [timeLeft, setTimeLeft] = useState({});
    const [campaignStatuses, setCampaignStatuses] = useState({});

    useEffect(() => {
        const fetchCampaignStatuses = async () => {
            const statuses = {};
            for (let i = 0; i < campaigns.length; i++) {
                try {
                    const status = await contract.getCampaignStatus(i + 1);
                    statuses[i] = status;
                } catch (error) {
                    console.error(`Error fetching status for campaign ${i + 1}:`, error);
                }
            }
            setCampaignStatuses(statuses);
        };

        if (contract && campaigns.length > 0) {
            fetchCampaignStatuses();
        }
    }, [campaigns, contract]);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            const updatedTimeLeft = {};
            
            campaigns.forEach((campaign, index) => {
                const deadline = parseInt(campaign.deadline);
                if (now < deadline) {
                    const seconds = deadline - now;
                    const days = Math.floor(seconds / 86400);
                    const hours = Math.floor((seconds % 86400) / 3600);
                    const minutes = Math.floor((seconds % 3600) / 60);
                    const remainingSeconds = seconds % 60;
                    
                    let timeString = '';
                    if (days > 0) timeString += `${days}d `;
                    if (hours > 0) timeString += `${hours}h `;
                    if (minutes > 0) timeString += `${minutes}m `;
                    timeString += `${remainingSeconds}s`;
                    
                    updatedTimeLeft[index] = timeString;
                } else {
                    updatedTimeLeft[index] = "Ended";
                }
            });
            
            setTimeLeft(updatedTimeLeft);
        }, 1000);

        return () => clearInterval(timer);
    }, [campaigns]);

    const handleDonate = async (campaignId) => {
        const amount = prompt("Enter the amount in ETH you want to donate:");
        if (!amount) return;

        try {
            const parsedAmount = ethers.parseEther(amount);
            
            const signer = await contract.runner.provider.getSigner();
            const balance = await contract.runner.provider.getBalance(await signer.getAddress());
            
            const gasEstimate = await contract.donate.estimateGas(campaignId, { 
                value: parsedAmount 
            });
            
            const gasPrice = await contract.runner.provider.getFeeData();
            const gasCost = gasEstimate * gasPrice.gasPrice;
            
            const totalCost = parsedAmount + gasCost;

            if (balance < totalCost) {
                const requiredEth = ethers.formatEther(totalCost);
                const balanceEth = ethers.formatEther(balance);
                alert(`Insufficient funds. You need approximately ${requiredEth} ETH for this transaction (including gas fees). Your current balance is ${balanceEth} ETH.`);
                return;
            }

            const tx = await contract.donate(campaignId, { 
                value: parsedAmount,
                gasLimit: gasEstimate
            });
            await tx.wait();
            alert("Donation successful!");
            window.location.reload();
        } catch (error) {
            console.error("Error during donation:", error);
            alert(error.message || "Donation failed. Please try again.");
        }
    };

    const handleWithdraw = async (campaignId) => {
        try {
            const tx = await contract.withdrawFunds(campaignId);
            await tx.wait();
            alert("Funds withdrawn successfully!");
            window.location.reload();
        } catch (error) {
            console.error("Error withdrawing funds:", error);
            alert(error.message || "Withdrawal failed. Please try again.");
        }
    };

    const getProgressBarColor = (campaign, status) => {
        if (!status) return "bg-gray-500";
        
        const hasEnded = status.hasEnded;
        const goalReached = status.hasReachedGoal;
        
        if (!hasEnded && !goalReached) return "bg-green-500";
        if (goalReached) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {campaigns.map((campaign, index) => {
                const goal = ethers.formatEther(campaign.goal.toString());
                const raised = ethers.formatEther(campaign.raisedAmount.toString());
                const percentage = (parseFloat(raised) / parseFloat(goal)) * 100;
                const isCampaignOwner = account === campaign.fundraiser;
                const status = campaignStatuses[index];

                return (
                    <div key={index} className="border rounded-xl p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-800">{campaign.title}</h2>
                            <p className="text-gray-600 line-clamp-3">{campaign.story}</p>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Goal:</span>
                                    <span className="font-semibold">{goal} ETH</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Raised:</span>
                                    <span className="font-semibold">{raised} ETH</span>
                                </div>
                                
                                <div className="relative pt-1">
                                    <div className="flex mb-2 items-center justify-between">
                                        <div>
                                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-gray-200">
                                                Progress
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-semibold inline-block text-gray-600">
                                                {percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex h-2 mb-4 overflow-hidden rounded bg-gray-200">
                                        <div
                                            className={`transition-all duration-300 ${getProgressBarColor(campaign, status)}`}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="text-sm font-medium text-gray-600">
                                Time left: {timeLeft[index] || "Loading..."}
                            </div>

                            <div className="space-y-2 pt-2">
                                {status?.isActive && (
                                    <button
                                        onClick={() => handleDonate(index + 1)}
                                        className="w-full px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-300"
                                    >
                                        Donate Now
                                    </button>
                                )}
                                
                                {isCampaignOwner && status && !status.isWithdrawn && 
                                 (status.hasEnded || status.hasReachedGoal) && (
                                    <button
                                        onClick={() => handleWithdraw(index + 1)}
                                        className="w-full px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-300"
                                    >
                                        Withdraw Funds
                                    </button>
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