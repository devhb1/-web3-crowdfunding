import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CreateCampaign = ({ contract, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        goal: '',
        story: '',
        duration: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [durations, setDurations] = useState([]);

    useEffect(() => {
        const fetchDurations = async () => {
            try {
                const availableDurations = await contract.getDurations();
                setDurations(availableDurations);
                setFormData(prev => ({ ...prev, duration: availableDurations[0].toString() }));
            } catch (error) {
                console.error("Error fetching durations:", error);
                setError("Failed to load duration options");
            }
        };

        if (contract) {
            fetchDurations();
        }
    }, [contract]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(''); // Clear any previous errors
    };

    const formatDuration = (seconds) => {
        const minute = 60;
        const hour = minute * 60;
        const day = hour * 24;
        const week = day * 7;
        const month = day * 30;

        if (seconds === 2 * minute) return "2 Minutes";
        if (seconds === 5 * minute) return "5 Minutes";
        if (seconds === 15 * minute) return "15 Minutes";
        if (seconds === hour) return "1 Hour";
        if (seconds === day) return "1 Day";
        if (seconds === week) return "1 Week";
        if (seconds === month) return "1 Month";
        return `${seconds} seconds`;
    };

    const validateForm = () => {
        if (!formData.title.trim()) return "Title is required";
        if (!formData.goal || parseFloat(formData.goal) <= 0) return "Valid goal amount is required";
        if (!formData.story.trim()) return "Story is required";
        if (!formData.duration) return "Duration is required";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const tx = await contract.createCampaign(
                formData.title.trim(),
                ethers.parseEther(formData.goal),
                formData.duration,
                formData.story.trim(),
                "" // imageUrl placeholder
            );

            await tx.wait();
            onSuccess?.();
            
            // Reset form
            setFormData({
                title: '',
                goal: '',
                story: '',
                duration: durations[0]?.toString() || '',
            });
            
        } catch (error) {
            console.error("Error creating campaign:", error);
            setError(error.message || "Failed to create campaign");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Campaign Title
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter campaign title"
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Goal Amount (ETH)
                    </label>
                    <input
                        type="number"
                        name="goal"
                        value={formData.goal}
                        onChange={handleInputChange}
                        step="0.0001"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter goal amount in ETH"
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Campaign Duration
                    </label>
                    <select
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    >
                        {durations.map((duration, index) => (
                            <option key={index} value={duration.toString()}>
                                {formatDuration(duration)}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Campaign Story
                    </label>
                    <textarea
                        name="story"
                        value={formData.story}
                        onChange={handleInputChange}
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tell your campaign story..."
                        disabled={isLoading}
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className={`w-full px-4 py-2 text-white font-medium rounded-md transition-colors duration-300 
                    ${isLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600'}`}
            >
                {isLoading ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Campaign...
                    </span>
                ) : (
                    'Create Campaign'
                )}
            </button>
        </form>
    );
};

export default CreateCampaign;