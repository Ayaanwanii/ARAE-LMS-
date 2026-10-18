/**
 * Profile Creation / Onboarding Page
 * Multi-step form for new users to complete their profile
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUpdateProfile } from '@/lib/hooks/useUsers';
import Button from '@/components/ui/Button';

const INTERESTS = [
    'Technology',
    'Science',
    'Mathematics',
    'Language',
    'Arts',
    'Sports',
    'Music',
    'Environment',
    'History',
    'Business',
    'Health',
    'Cooking',
];

export default function ProfileCreatePage() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const updateProfile = useUpdateProfile();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        displayName: profile?.displayName || '',
        schoolName: profile?.schoolName || '',
        age: profile?.age || '',
        gender: profile?.gender || '',
        interest: profile?.interest || [],
        phoneNumber: profile?.phoneNumber || '',
        countryRef: profile?.countryRef || '',
        stateRef: profile?.stateRef || '',
    });

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleInterest = (interest: string) => {
        setFormData((prev) => ({
            ...prev,
            interest: prev.interest.includes(interest)
                ? prev.interest.filter((i) => i !== interest)
                : [...prev.interest, interest],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await updateProfile.mutateAsync({
                displayName: formData.displayName,
                schoolName: formData.schoolName,
                age: parseInt(String(formData.age)) || 0,
                gender: formData.gender,
                interest: formData.interest,
                phoneNumber: formData.phoneNumber,
                countryRef: formData.countryRef,
                stateRef: formData.stateRef,
            });

            router.push('/programs');
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-slate-50 to-pink-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center px-4 py-12">
            <div className="max-w-2xl w-full bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 backdrop-blur-xl p-8">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Step {step} of 3</span>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{Math.round((step / 3) * 100)}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2.5 rounded-full transition-all duration-300 shadow-sm"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome to ARAE LMS!</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-8 font-medium">Let's get to know you better</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.displayName}
                                        onChange={(e) => handleChange('displayName', e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-800/90 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition font-medium"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                            Age <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max="150"
                                            value={formData.age}
                                            onChange={(e) => handleChange('age', e.target.value)}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-800/90 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition font-medium"
                                            placeholder="25"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                            Gender <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={formData.gender}
                                            onChange={(e) => handleChange('gender', e.target.value)}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-800/90 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition font-medium cursor-pointer"
                                        >
                                            <option value="" className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white">Select...</option>
                                            <option value="male" className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white">Male</option>
                                            <option value="female" className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white">Female</option>
                                            <option value="other" className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white">Other</option>
                                            <option value="prefer-not-to-say" className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white">Prefer not to say</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                            Country <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.countryRef}
                                            onChange={(e) => handleChange('countryRef', e.target.value)}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-800/90 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition font-medium"
                                            placeholder="United States"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                            State <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.stateRef}
                                            onChange={(e) => handleChange('stateRef', e.target.value)}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-800/90 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition font-medium"
                                            placeholder="California"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phoneNumber}
                                        onChange={(e) => handleChange('phoneNumber', e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-800/90 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition font-medium"
                                        placeholder="+1234567890"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: School */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Education</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-8 font-medium">Tell us about your school or institution</p>

                            <div>
                                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                    School/Institution Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.schoolName}
                                    onChange={(e) => handleChange('schoolName', e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800/90 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition font-medium"
                                    placeholder="Harvard University"
                                />
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    This helps us connect you with relevant programs
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Interests */}
                    {step === 3 && (
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your Interests</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-8 font-medium">
                                Select topics you're interested in (select at least one)
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {INTERESTS.map((interest) => (
                                    <button
                                        key={interest}
                                        type="button"
                                        onClick={() => toggleInterest(interest)}
                                        className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${formData.interest.includes(interest)
                                            ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20'
                                            : 'bg-gray-100 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {interest}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-8 flex justify-between items-center">
                        {step > 1 ? (
                            <Button type="button" onClick={prevStep} variant="outline">
                                Previous
                            </Button>
                        ) : (
                            <div />
                        )}

                        {step < 3 ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                disabled={
                                    (step === 1 && (!formData.displayName || !formData.age || !formData.gender || !formData.phoneNumber || !formData.countryRef || !formData.stateRef)) ||
                                    (step === 2 && !formData.schoolName) ||
                                    (step === 3 && formData.interest.length === 0)
                                }
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                isLoading={updateProfile.isPending}
                                disabled={formData.interest.length === 0}
                            >
                                Complete Profile
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );

}
