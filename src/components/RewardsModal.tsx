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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#111e38] text-[#002045] dark:text-slate-100 rounded-2xl border-2 border-slate-200 dark:border-[#1e3a6a] p-5 sm:p-7 max-w-3xl w-full shadow-2xl my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-[#1e3a6a]">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-800 dark:text-amber-300">
              <span className="material-symbols-outlined filled-icon text-[30px]">stars</span>
            </div>
            <div>
              <h2 className="font-extrabold text-[22px] sm:text-[26px] text-[#002045] dark:text-white">Mind Points Rewards</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Available balance: <span className="font-bold text-[#FF6321] text-base">{mindPoints.toLocaleString()} pts</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#162544] rounded-full min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer"
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
                ? 'bg-[#002045] dark:bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-[#0d182e] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#162544]'
            }`}
          >
            Available Rewards ({availableRewards.length})
          </button>
          <button
            onClick={() => setActiveTab('claimed')}
            className={`px-5 py-2.5 rounded-xl font-bold text-[17px] transition-all cursor-pointer ${
              activeTab === 'claimed'
                ? 'bg-[#002045] dark:bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-[#0d182e] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#162544]'
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
                  className="p-4 sm:p-5 bg-slate-50 dark:bg-[#0d182e] rounded-2xl border-2 border-slate-200 dark:border-[#1e3a6a] hover:border-blue-500 flex flex-col sm:flex-row items-center gap-4 transition-all"
                >
                  <img
                    src={reward.imageUrl}
                    alt={reward.title}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-slate-200 dark:border-[#1e3a6a] shadow-xs flex-shrink-0"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <span className="bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                      {reward.category}
                    </span>
                    <h3 className="font-bold text-[19px] sm:text-[20px] text-[#002045] dark:text-white mt-1">
                      {reward.title}
                    </h3>
                    <p className="text-[15px] text-slate-600 dark:text-slate-300 mt-1">{reward.description}</p>
                    <div className="mt-2 font-extrabold text-[18px] text-[#FF6321] flex items-center justify-center sm:justify-start">
                      <span className="material-symbols-outlined text-[20px] mr-1 text-amber-500">stars</span>
                      {reward.cost.toLocaleString()} Mind Points
                    </div>
                  </div>

                  <button
                    onClick={() => handleRedeemClick(reward)}
                    disabled={!canAfford || redeemingId === reward.id}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-[17px] min-h-[52px] cursor-pointer shadow-xs transition-all flex items-center justify-center ${
                      canAfford
                        ? 'bg-[#002045] dark:bg-blue-600 hover:bg-[#1a365d] dark:hover:bg-blue-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {redeemingId === reward.id ? 'Processing...' : canAfford ? 'Redeem Reward' : `Need ${reward.cost - mindPoints} pts`}
                  </button>
                </div>
              );
            })
          ) : (
            claimedRewards.length === 0 ? (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-[48px] text-slate-400 mb-2">inventory_2</span>
                <p className="text-[18px]">No vouchers claimed yet. Play more games to earn and redeem!</p>
              </div>
            ) : (
              claimedRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="p-4 sm:p-5 bg-emerald-50 dark:bg-[#0e241c] rounded-2xl border-2 border-emerald-500/50 dark:border-emerald-800 flex flex-col sm:flex-row items-center gap-4"
                >
                  <img
                    src={reward.imageUrl}
                    alt={reward.title}
                    className="w-24 h-24 object-cover rounded-xl border border-emerald-200 dark:border-emerald-700 flex-shrink-0"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <span className="bg-emerald-200 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                      Claimed Voucher
                    </span>
                    <h3 className="font-bold text-[19px] text-emerald-950 dark:text-emerald-200 mt-1">{reward.title}</h3>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-1">Claimed: {reward.claimedAt || 'Recently'}</p>
                    <p className="font-mono font-bold text-base text-[#002045] dark:text-white bg-white dark:bg-[#0f1d38] inline-block px-3 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 mt-2">
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
          <div className="bg-white dark:bg-[#111e38] text-[#002045] dark:text-slate-100 rounded-2xl border-2 border-emerald-500 p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 rounded-full flex items-center justify-center mx-auto text-emerald-700 dark:text-emerald-300">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
            <h3 className="font-extrabold text-[24px] text-[#002045] dark:text-white">Reward Claimed!</h3>
            <p className="text-[17px] text-slate-600 dark:text-slate-300">
              You redeemed <strong>{successModal.title}</strong>! Your family caregiver has also received notification.
            </p>
            <div className="bg-sky-50 dark:bg-[#0d182e] p-3 rounded-xl font-mono text-lg font-bold text-[#002045] dark:text-sky-300 border border-sky-200 dark:border-[#1e3a6a]">
              Voucher Code: SS-{Math.floor(1000 + Math.random() * 9000)}-DEL
            </div>
            <button
              onClick={() => setSuccessModal(null)}
              className="w-full bg-[#002045] dark:bg-blue-600 hover:bg-[#1a365d] dark:hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold text-[18px] cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
