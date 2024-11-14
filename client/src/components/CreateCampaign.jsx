// src/components/CreateCampaign.js

import React, { useState } from 'react';
import { ethers } from 'ethers';

const CreateCampaign = ({ contract, setCampaigns }) => {
    const [title, setTitle] = useState('');
    const [goal, setGoal] = useState('');
    const [story, setStory] = useState('');
    const [duration, setDuration] = useState(3600); // Default to 1 hour

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!contract) throw new Error("Contract is not initialized."); // Error handling
            
            // Call createCampaign function on the smart contract
            const tx = await contract.createCampaign(
                title,
                ethers.parseEther(goal), // Correctly access parseEther directly from ethers
                duration,
                story,
                "" // Assuming you're not using an image URL for now; adjust as necessary
            );
            await tx.wait();
            alert('Campaign created successfully!');

            // Fetch updated campaigns
            await fetchUpdatedCampaigns();
        } catch (error) {
            console.error("Error creating campaign:", error);
            alert("Failed to create campaign.");
        }
    };

    // Function to fetch updated campaigns after creation
    const fetchUpdatedCampaigns = async () => {
        if (contract) {
            try {
                const totalCampaigns = await contract.campaignCount();
                const loadedCampaigns = [];
                for (let i = 1; i <= totalCampaigns; i++) {
                    const campaignData = await contract.campaigns(i);
                    loadedCampaigns.push({
                        title: campaignData.title,
                        fundraiser: campaignData.fundraiser,
                        goal: campaignData.goal.toString(),
                        raisedAmount: campaignData.raisedAmount.toString(),
                        deadline: campaignData.deadline.toString(),
                        story: campaignData.story,
                        isActive: campaignData.isActive
                    });
                }
                setCampaigns(loadedCampaigns);
            } catch (error) {
                console.error("Error fetching updated campaigns:", error);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg shadow-lg bg-white">
            <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="border p-2 w-full" />
            <input type="text" placeholder="Goal (ETH)" value={goal} onChange={(e) => setGoal(e.target.value)} required className="border p-2 w-full" />
            <textarea placeholder="Story" value={story} onChange={(e) => setStory(e.target.value)} required className="border p-2 w-full"></textarea>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className="border p-2 w-full">
                <option value={3600}>1 Hour</option>
                <option value={86400}>1 Day</option>
                <option value={604800}>1 Week</option>
                <option value={2592000}>1 Month</option>
            </select>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Create Campaign</button>
        </form>
    );
};

export default CreateCampaign;