import React from 'react';
import type { UserProfile } from '../types';
import { speakText } from '../utils/audio';

interface HelpViewProps {
  user: UserProfile | null;
}

export const HelpView: React.FC<HelpViewProps> = ({ user }) => {
  return (
    <main id="help-view-main" className="flex-1 p-4 sm:p-6 md:p-12 bg-[#ffffff] overflow-y-auto">
      <div className="mb-8">
        <h1 className="font-extrabold text-[28px] md:text-[34px] leading-tight text-[#002045] mb-2">
          Help & Caregiver Assistance
        </h1>
        <p className="font-normal text-[18px] md:text-[20px] text-[#43474e]">
          Simple, easy-to-read guidance to get the most out of your daily SmritiSaathi companion.
        </p>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Quick Emergency / Caregiver Card */}
        <div className="p-6 bg-amber-50 rounded-2xl border-2 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[32px]">support_agent</span>
            </div>
            <div>
              <h2 className="font-extrabold text-[20px] text-amber-950">Caregiver Direct Contact</h2>
              <p className="text-base text-amber-900">
                Primary contact: <strong>{user?.caregiverName || 'Rohan Sharma'}</strong> ({user?.caregiverPhone || '+91 98765 43210'})
              </p>
            </div>
          </div>
          <a
            href={`tel:${user?.caregiverPhone || '+919876543210'}`}
            className="bg-[#002045] text-white px-6 py-3 rounded-xl font-bold text-base whitespace-nowrap cursor-pointer hover:bg-[#1a365d]"
          >
            📞 Call Caregiver
          </a>
        </div>

        {/* FAQs */}
        <div className="bg-[#f9f9ff] p-6 sm:p-8 rounded-2xl border-2 border-[#c4c6cf] space-y-6">
          <h2 className="font-extrabold text-[22px] text-[#002045]">Frequently Asked Questions</h2>

          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-[#d9e3f9]">
              <h3 className="font-bold text-[19px] text-[#002045] flex items-center justify-between">
                <span>1. How often should I do daily training?</span>
                <button
                  onClick={() => speakText('Doing 5 to 10 minutes of cognitive exercises each morning keeps neural plasticity active.')}
                  className="p-1 text-[#002045] hover:bg-[#f0f3ff] rounded-full"
                >
                  <span className="material-symbols-outlined text-[20px]">volume_up</span>
                </button>
              </h3>
              <p className="text-[17px] text-[#43474e] mt-1">
                Just 5 to 10 minutes once per day (preferably after morning tea) is ideal to maintain cognitive focus, memory retrieval, and daily temporal orientation.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#d9e3f9]">
              <h3 className="font-bold text-[19px] text-[#002045] flex items-center justify-between">
                <span>2. What are Mind Points and how do I redeem them?</span>
                <button
                  onClick={() => speakText('You earn Mind Points after every exercise and reality quest, which you can redeem for herbal teas, family albums, and puzzle books.')}
                  className="p-1 text-[#002045] hover:bg-[#f0f3ff] rounded-full"
                >
                  <span className="material-symbols-outlined text-[20px]">volume_up</span>
                </button>
              </h3>
              <p className="text-[17px] text-[#43474e] mt-1">
                Mind Points reward your consistency. Click on the <strong>Redeem Rewards</strong> button on the dashboard to exchange your earned points for herbal teas, custom framed family prints, and brain puzzle books!
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#d9e3f9]">
              <h3 className="font-bold text-[19px] text-[#002045] flex items-center justify-between">
                <span>3. Can my family add our own real photos?</span>
                <button
                  onClick={() => speakText('Yes, in the Settings tab, you or your caregiver can add family photos with custom names and hints.')}
                  className="p-1 text-[#002045] hover:bg-[#f0f3ff] rounded-full"
                >
                  <span className="material-symbols-outlined text-[20px]">volume_up</span>
                </button>
              </h3>
              <p className="text-[17px] text-[#43474e] mt-1">
                Yes! Head to the <strong>Settings</strong> tab and use the <strong>Family Memory Album Database</strong> section to add photos of grandchildren, children, relatives, or memorable places. They will appear right inside the "Name That Face" game.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
