// src/components/CampaignList.jsx

import React from 'react';
import { ethers } from 'ethers';

const CampaignList = ({ campaigns, contract }) => {
    const handleDonate = async (campaignId) => {
        const amount = prompt("Enter the amount in ETH you want to donate:");
        if (amount) {
            const parsedAmount = ethers.parseEther(amount);
            const goal = ethers.BigInt(campaigns[campaignId - 1].goal); // Get goal from campaigns
            const raisedAmount = ethers.BigInt(campaigns[campaignId - 1].raisedAmount); // Get raised amount from campaigns
            
            if (parsedAmount + raisedAmount > goal) {
                alert("Donation exceeds campaign goal!");
                return;
            }

            try {
                const tx = await contract.donate(campaignId, { value: parsedAmount });
                await tx.wait();
                alert("Donation successful!");
                // Optionally refresh campaigns here
            } catch (error) {
                console.error("Error during donation:", error);
                alert("Donation failed. Please try again.");
            }
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign, index) => {
                const goal = ethers.formatEther(campaign.goal.toString());
                const raised = ethers.formatEther(campaign.raisedAmount.toString());
                const percentage = (parseFloat(raised) / parseFloat(goal)) * 100;

                return (
                    <div key={index} className="border rounded-lg p-4 bg-white shadow-md">
                        <h2 className="font-bold">{campaign.title}</h2>
                        <p>{campaign.story}</p>
                        <p>Goal: {goal} ETH</p>
                        <p>Raised: {raised} ETH</p>
                        <p>Percentage: {percentage.toFixed(2)}%</p>
                        <div className="relative w-full h-2 bg-gray-200 rounded">
                            <div
                                className="absolute h-full bg-green-500 rounded"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <p>Deadline: {new Date(campaign.deadline * 1000).toLocaleString()}</p>
                        <button 
                            onClick={() => handleDonate(index + 1)} // Pass campaign ID (1-based index)
                            className="bg-green-500 text-white px-4 py-2 rounded mt-2"
                        >
                            Donate
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default CampaignList;