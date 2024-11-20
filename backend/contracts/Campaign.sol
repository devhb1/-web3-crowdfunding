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
        address[] donors;         // Array to track unique donors
        mapping(address => uint) donations; // Track donation amounts per donor
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
        
        bool validDuration = false;
        for(uint i = 0; i < availableDurations.length; i++) {
            if(_duration == availableDurations[i]) {
                validDuration = true;
                break;
            }
        }
        require(validDuration, "Invalid duration selected");
        
        campaignCount++;
        CampaignData storage newCampaign = campaigns[campaignCount];
        newCampaign.title = _title;
        newCampaign.fundraiser = payable(msg.sender);
        newCampaign.goal = _goal;
        newCampaign.raisedAmount = 0;
        newCampaign.deadline = block.timestamp + _duration;
        newCampaign.story = _story;
        newCampaign.imageUrl = _imageUrl;
        newCampaign.isActive = true;
        newCampaign.isWithdrawn = false;

        emit CampaignCreated(campaignCount, msg.sender);
    }

    function donate(uint _campaignId) public payable {
        CampaignData storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign is not active");
        require(block.timestamp < campaign.deadline, "Campaign has ended");
        require(msg.value > 0, "Must send ether to donate");
        require(campaign.raisedAmount + msg.value <= campaign.goal, "Donation would exceed campaign goal");
        
        if(campaign.donations[msg.sender] == 0) {
            campaign.donors.push(msg.sender);
        }
        campaign.donations[msg.sender] += msg.value;
        campaign.raisedAmount += msg.value;
        
        emit DonationReceived(_campaignId, msg.sender, msg.value);

        // Auto-update campaign status if goal is reached
        if (campaign.raisedAmount >= campaign.goal) {
            campaign.isActive = false;
        }
    }

    function getDonors(uint _campaignId) public view returns (address[] memory, uint[] memory) {
        CampaignData storage campaign = campaigns[_campaignId];
        uint[] memory amounts = new uint[](campaign.donors.length);
        
        for(uint i = 0; i < campaign.donors.length; i++) {
            amounts[i] = campaign.donations[campaign.donors[i]];
        }
        
        return (campaign.donors, amounts);
    }

    function getDonationAmount(uint _campaignId, address donor) public view returns (uint) {
        return campaigns[_campaignId].donations[donor];
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
        uint timeLeft,
        uint donorCount
    ) {
        CampaignData storage campaign = campaigns[_campaignId];
        isActive = campaign.isActive;
        hasReachedGoal = campaign.raisedAmount >= campaign.goal;
        hasEnded = block.timestamp >= campaign.deadline;
        isWithdrawn = campaign.isWithdrawn;
        timeLeft = block.timestamp >= campaign.deadline ? 0 : campaign.deadline - block.timestamp;
        donorCount = campaign.donors.length;
    }
}