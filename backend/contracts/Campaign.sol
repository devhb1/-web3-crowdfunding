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
        bool isWithdrawn;
    }

    mapping(uint => CampaignData) public campaigns;
    uint public campaignCount;

    event CampaignCreated(uint campaignId, address fundraiser);
    event DonationReceived(uint campaignId, address donor, uint amount);
    event FundsWithdrawn(uint campaignId, address fundraiser, uint amount);

    // Updated durations array
    uint[] public availableDurations = [
        2 minutes,
        5 minutes,
        15 minutes,
        1 hours,
        1 days,
        7 days,
        30 days
    ];

    function getDurations() public view returns (uint[] memory) {
        return availableDurations;
    }

    function createCampaign(string memory _title, uint _goal, uint _duration, string memory _story, string memory _imageUrl) public {
        require(_goal > 0, "Goal must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        
        // Verify duration is valid
        bool validDuration = false;
        for(uint i = 0; i < availableDurations.length; i++) {
            if(_duration == availableDurations[i]) {
                validDuration = true;
                break;
            }
        }
        require(validDuration, "Invalid duration selected");
        
        campaignCount++;
        campaigns[campaignCount] = CampaignData({
            title: _title,
            fundraiser: payable(msg.sender),
            goal: _goal,
            raisedAmount: 0,
            deadline: block.timestamp + _duration,
            story: _story,
            imageUrl: _imageUrl,
            isActive: true,
            isWithdrawn: false
        });

        emit CampaignCreated(campaignCount, msg.sender);
    }

    function donate(uint _campaignId) public payable {
        CampaignData storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign is not active");
        require(block.timestamp < campaign.deadline, "Campaign has ended");
        require(msg.value > 0, "Must send ether to donate");
        require(campaign.raisedAmount + msg.value <= campaign.goal, "Donation would exceed campaign goal");
        
        campaign.raisedAmount += msg.value;
        
        emit DonationReceived(_campaignId, msg.sender, msg.value);

        // Auto-update campaign status if goal is reached
        if (campaign.raisedAmount >= campaign.goal) {
            campaign.isActive = false;
        }
    }

    function withdrawFunds(uint _campaignId) public {
        CampaignData storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.fundraiser, "Only campaign creator can withdraw");
        require(!campaign.isWithdrawn, "Funds have already been withdrawn");
        require(block.timestamp >= campaign.deadline || campaign.raisedAmount >= campaign.goal, 
                "Campaign must be ended or goal reached");
        
        uint amountToWithdraw = campaign.raisedAmount;
        require(amountToWithdraw > 0, "No funds to withdraw");

        campaign.isWithdrawn = true;
        campaign.isActive = false;

        emit FundsWithdrawn(_campaignId, msg.sender, amountToWithdraw);
        campaign.fundraiser.transfer(amountToWithdraw);
    }

    function getCampaignStatus(uint _campaignId) public view returns (
        bool isActive,
        bool hasReachedGoal,
        bool hasEnded,
        bool isWithdrawn,
        uint timeLeft
    ) {
        CampaignData storage campaign = campaigns[_campaignId];
        isActive = campaign.isActive;
        hasReachedGoal = campaign.raisedAmount >= campaign.goal;
        hasEnded = block.timestamp >= campaign.deadline;
        isWithdrawn = campaign.isWithdrawn;
        timeLeft = block.timestamp >= campaign.deadline ? 0 : campaign.deadline - block.timestamp;
    }
}