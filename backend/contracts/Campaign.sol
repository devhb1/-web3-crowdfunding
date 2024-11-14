// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Campaign {
    struct CampaignData {
        string title;
        address payable fundraiser;
        uint goal;
        uint raisedAmount;
        uint deadline;
        string story;
        string imageUrl;
        bool isActive;
    }

    mapping(uint => CampaignData) public campaigns;
    uint public campaignCount;

    function createCampaign(string memory _title, uint _goal, uint _duration, string memory _story, string memory _imageUrl) public {
        campaignCount++;
        campaigns[campaignCount] = CampaignData({
            title: _title,
            fundraiser: payable(msg.sender),
            goal: _goal,
            raisedAmount: 0,
            deadline: block.timestamp + _duration,
            story: _story,
            imageUrl: _imageUrl,
            isActive: true
        });
    }

    function donate(uint _campaignId) public payable {
        CampaignData storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign is not active");
        require(msg.value > 0, "Must send ether to donate");
        
        campaign.raisedAmount += msg.value;

        if (campaign.raisedAmount >= campaign.goal) {
            campaign.fundraiser.transfer(campaign.raisedAmount);
            campaign.isActive = false; // Mark as inactive after reaching goal
        }
    }
}