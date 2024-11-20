import React from 'react';
import { ethers } from 'ethers';

const CampaignList = ({ campaigns, contract }) => {
    const handleDonate = async (campaignId) => {
        const amount = prompt("Enter the amount in ETH you want to donate:");
        if (!amount) return;

        try {
            const parsedAmount = ethers.parseEther(amount);
            
            // Get the signer's balance
            const signer = await contract.runner.provider.getSigner();
            const balance = await contract.runner.provider.getBalance(await signer.getAddress());
            
            // Get gas estimate
            const gasEstimate = await contract.donate.estimateGas(campaignId, { 
                value: parsedAmount 
            });
            
            // Get gas price
            const gasPrice = await contract.runner.provider.getFeeData();
            const gasCost = gasEstimate * gasPrice.gasPrice;
            
            // Calculate total cost (donation + gas)
            const totalCost = parsedAmount + gasCost;

            // Check if user has enough funds
            if (balance < totalCost) {
                const requiredEth = ethers.formatEther(totalCost);
                const balanceEth = ethers.formatEther(balance);
                alert(`Insufficient funds. You need approximately ${requiredEth} ETH for this transaction (including gas fees). Your current balance is ${balanceEth} ETH.`);
                return;
            }

            // Convert strings to BigInt using JavaScript's native BigInt
            const goal = BigInt(campaigns[campaignId - 1].goal);
            const raisedAmount = BigInt(campaigns[campaignId - 1].raisedAmount);
            const parsedAmountBigInt = BigInt(parsedAmount);

            if (parsedAmountBigInt + raisedAmount > goal) {
                alert("Donation exceeds campaign goal!");
                return;
            }

            // If all checks pass, proceed with the donation
            const tx = await contract.donate(campaignId, { 
                value: parsedAmount,
                gasLimit: gasEstimate // Explicitly set gas limit
            });
            await tx.wait();
            alert("Donation successful!");
            // Optionally refresh campaigns here
        } catch (error) {
            console.error("Error during donation:", error);
            if (error.code === 'INSUFFICIENT_FUNDS') {
                alert("Insufficient funds to complete the transaction. Please make sure you have enough ETH to cover both the donation and gas fees.");
            } else {
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
                            onClick={() => handleDonate(index + 1)}
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