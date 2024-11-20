import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CampaignList = ({ campaigns, contract, account }) => {
    const [timeLeft, setTimeLeft] = useState({});

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
                    updatedTimeLeft[index] = `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
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

    const getProgressBarColor = (campaign) => {
        const now = Math.floor(Date.now() / 1000);
        const hasEnded = now >= parseInt(campaign.deadline);
        const goalReached = ethers.parseEther(campaign.raisedAmount) >= ethers.parseEther(campaign.goal);
        
        if (!hasEnded) return "bg-green-500";
        if (hasEnded && goalReached) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign, index) => {
                const goal = ethers.formatEther(campaign.goal.toString());
                const raised = ethers.formatEther(campaign.raisedAmount.toString());
                const percentage = (parseFloat(raised) / parseFloat(goal)) * 100;
                const isCampaignOwner = account === campaign.fundraiser;

                return (
                    <div key={index} className="border rounded-lg p-4 bg-white shadow-md">
                        <h2 className="font-bold">{campaign.title}</h2>
                        <p>{campaign.story}</p>
                        <p>Goal: {goal} ETH</p>
                        <p>Raised: {raised} ETH</p>
                        <p>Percentage: {percentage.toFixed(2)}%</p>
                        <div className="relative w-full h-2 bg-gray-200 rounded">
                            <div
                                className={`absolute h-full rounded ${getProgressBarColor(campaign)}`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                        </div>
                        <p className="mt-2">Time left: {timeLeft[index] || "Loading..."}</p>
                        
                        {campaign.isActive && (
                            <button
                                onClick={() => handleDonate(index + 1)}
                                className="bg-green-500 text-white px-4 py-2 rounded mt-2 w-full"
                            >
                                Donate
                            </button>
                        )}
                        
                        {isCampaignOwner && !campaign.isWithdrawn && (
                            <button
                                onClick={() => handleWithdraw(index + 1)}
                                className="bg-blue-500 text-white px-4 py-2 rounded mt-2 w-full"
                            >
                                Withdraw Funds
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default CampaignList;