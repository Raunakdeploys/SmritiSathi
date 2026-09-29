import React, { useState } from 'react';
import type { RewardItem } from '../types';
import { playSuccessChime, playGentleClick, speakText } from '../utils/audio';
import confetti from 'canvas-confetti';

interface RewardsModalProps {
  rewards: RewardItem[];
  mindPoints: number;
  onRedeem: (rewardId: string) => Promise<void>;
  onClose: () => void;
}

export const RewardsModal: React.FC<RewardsModalProps> = ({
  rewards,
  mindPoints,
  onRedeem,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'claimed'>('available');
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<RewardItem | null>(null);

  const availableRewards = rewards.filter((r) => !r.isClaimed);
  const claimedRewards = rewards.filter((r) => r.isClaimed);

  const handleRedeemClick = async (reward: RewardItem) => {
    if (mindPoints < reward.cost) {
      speakText(`You need ${reward.cost - mindPoints} more Mind Points to redeem this reward.`);
      return;
    }
    playGentleClick();
    setRedeemingId(reward.id);
    try {
      await onRedeem(reward.id);
      playSuccessChime();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setSuccessModal(reward);
    } catch (e) {
      console.error(e);
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#002045]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#ffffff] rounded-2xl border-2 border-[#002045] p-5 sm:p-7 max-w-3xl w-full shadow-2xl my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-[#c4c6cf]">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-[#ffdeaa] border border-[#f8bc4b] flex items-center justify-center text-[#2d1d00]">
              <span className="material-symbols-outlined filled-icon text-[30px]">stars</span>
            </div>
            <div>
              <h2 className="font-extrabold text-[22px] sm:text-[26px] text-[#002045]">Mind Points Rewards</h2>
              <p className="text-sm text-[#43474e]">
                Available balance: <span className="font-bold text-[#2d1d00] text-base">{mindPoints.toLocaleString()} pts</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-[#43474e] hover:bg-[#f0f3ff] rounded-full min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex space-x-3 my-4">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-5 py-2.5 rounded-xl font-bold text-[17px] transition-all cursor-pointer ${
              activeTab === 'available'
                ? 'bg-[#002045] text-white shadow-xs'
                : 'bg-[#f0f3ff] text-[#43474e] hover:bg-[#d9e3f9]'
            }`}
          >
            Available Rewards ({availableRewards.length})
          </button>
          <button
            onClick={() => setActiveTab('claimed')}
            className={`px-5 py-2.5 rounded-xl font-bold text-[17px] transition-all cursor-pointer ${
              activeTab === 'claimed'
                ? 'bg-[#002045] text-white shadow-xs'
                : 'bg-[#f0f3ff] text-[#43474e] hover:bg-[#d9e3f9]'
            }`}
          >
            Claimed Vouchers ({claimedRewards.length})
          </button>
        </div>

        {/* Reward List */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 my-2">
          {activeTab === 'available' ? (
            availableRewards.map((reward) => {
              const canAfford = mindPoints >= reward.cost;
              return (
                <div
                  key={reward.id}
                  className="p-4 sm:p-5 bg-[#f9f9ff] rounded-2xl border-2 border-[#c4c6cf] hover:border-[#002045] flex flex-col sm:flex-row items-center gap-4 transition-all"
                >
                  <img
                    src={reward.imageUrl}
                    alt={reward.title}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-[#d9e3f9] shadow-xs flex-shrink-0"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <span className="bg-[#d9e3f9] text-[#002045] text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {reward.category}
                    </span>
                    <h3 className="font-bold text-[19px] sm:text-[20px] text-[#002045] mt-1">
                      {reward.title}
                    </h3>
                    <p className="text-[15px] text-[#43474e] mt-1">{reward.description}</p>
                    <div className="mt-2 font-extrabold text-[18px] text-[#2d1d00] flex items-center justify-center sm:justify-start">
                      <span className="material-symbols-outlined text-[20px] mr-1 text-amber-600">stars</span>
                      {reward.cost.toLocaleString()} Mind Points
                    </div>
                  </div>

                  <button
                    onClick={() => handleRedeemClick(reward)}
                    disabled={!canAfford || redeemingId === reward.id}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-[17px] min-h-[52px] cursor-pointer shadow-xs transition-all flex items-center justify-center ${
                      canAfford
                        ? 'bg-[#2d1d00] hover:bg-[#493100] text-white focus:ring-4 focus:ring-[#2d1d00]'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {redeemingId === reward.id ? 'Processing...' : canAfford ? 'Redeem Reward' : `Need ${reward.cost - mindPoints} pts`}
                  </button>
                </div>
              );
            })
          ) : (
            claimedRewards.length === 0 ? (
              <div className="text-center py-10 text-[#43474e]">
                <span className="material-symbols-outlined text-[48px] text-gray-400 mb-2">inventory_2</span>
                <p className="text-[18px]">No vouchers claimed yet. Play more games to earn and redeem!</p>
              </div>
            ) : (
              claimedRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="p-4 sm:p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-600/50 flex flex-col sm:flex-row items-center gap-4"
                >
                  <img
                    src={reward.imageUrl}
                    alt={reward.title}
                    className="w-24 h-24 object-cover rounded-xl border border-emerald-200 flex-shrink-0"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <span className="bg-emerald-200 text-emerald-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      Claimed Voucher
                    </span>
                    <h3 className="font-bold text-[19px] text-emerald-950 mt-1">{reward.title}</h3>
                    <p className="text-sm text-emerald-800 mt-1">Claimed: {reward.claimedAt || 'Recently'}</p>
                    <p className="font-mono font-bold text-base text-[#002045] bg-white inline-block px-3 py-1 rounded-lg border border-emerald-300 mt-2">
                      Code: {reward.claimCode || 'SS-8821-DEL'}
                    </p>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-60 animate-fadeIn">
          <div className="bg-white rounded-2xl border-2 border-emerald-600 p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
            <h3 className="font-extrabold text-[24px] text-[#002045]">Reward Claimed!</h3>
            <p className="text-[17px] text-[#43474e]">
              You redeemed <strong>{successModal.title}</strong>! Your family caregiver has also received notification.
            </p>
            <div className="bg-[#f0f3ff] p-3 rounded-xl font-mono text-lg font-bold text-[#002045]">
              Voucher Code: SS-{Math.floor(1000 + Math.random() * 9000)}-DEL
            </div>
            <button
              onClick={() => setSuccessModal(null)}
              className="w-full bg-[#002045] hover:bg-[#1a365d] text-white py-3.5 rounded-xl font-bold text-[18px] cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
