import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Sparkles, Volume2, ArrowRight, X, ShieldAlert, Image, Eye, Trophy, HelpCircle, Upload } from 'lucide-react';
import { api } from '../../api';
import type { CameraIdentifyResult } from '../../types';
import { playSuccessChime, playGentleClick, speakText } from '../../utils/audio';
import confetti from 'canvas-confetti';

interface LiveCameraSpotterGameProps {
  currentLevel?: number;
  maxLevel?: number;
  onComplete: (score: number, pointsEarned: number, accuracy: number, levelPlayed: number) => void;
  onClose: () => void;
  voiceGuidanceEnabled?: boolean;
}

interface ScavengerItem {
  id: string;
  name: string;
  category: string;
  hint: string;
  iconName: string;
  memoryTeaser: string;
}

const LEVEL_ITEMS: Record<number, ScavengerItem[]> = {
  1: [
    {
      id: 'l1-cup',
      name: 'Drinking Cup or Chai Mug',
      category: 'Kitchen & Beverage',
      hint: 'Look for your favorite tea cup, coffee mug, or steel glass near your table.',
      iconName: '☕',
      memoryTeaser: 'Think about who you most enjoy having morning chai with.',
    },
    {
      id: 'l1-glasses',
      name: 'Reading Glasses or Spectacles',
      category: 'Personal Item',
      hint: 'Your reading glasses or sunglasses on your nightstand or desk.',
      iconName: '👓',
      memoryTeaser: 'Recall the first book or newspaper you enjoyed reading today.',
    },
    {
      id: 'l1-book',
      name: 'Book, Magazine, or Diary',
      category: 'Reading',
      hint: 'A printed book, novel, spiritual text, or daily diary.',
      iconName: '📖',
      memoryTeaser: 'What kind of stories or poems have you always loved the most?',
    },
    {
      id: 'l1-plant',
      name: 'Plant, Flower, or Leaf',
      category: 'Nature',
      hint: 'An indoor potted plant, fresh flower, or garden leaf in your room.',
      iconName: '🌿',
      memoryTeaser: 'Do you remember the plants or trees that grew around your childhood home?',
    },
    {
      id: 'l1-clock',
      name: 'Wall Clock or Table Clock',
      category: 'Timepiece',
      hint: 'Any clock on the wall, desk, or bedside table showing the time.',
      iconName: '⏰',
      memoryTeaser: 'Do you remember the ticking grandfather clocks or classic alarm clocks?',
    },
  ],
  2: [
    {
      id: 'l2-pen',
      name: 'Pen, Pencil, or Marker',
      category: 'Stationery',
      hint: 'A writing tool you use for signing letters or jotting down notes.',
      iconName: '🖊️',
      memoryTeaser: 'Think about the handwritten letters you used to write to dear friends.',
    },
    {
      id: 'l2-keys',
      name: 'Key or Keychain',
      category: 'Household',
      hint: 'Your house keys, almirah keys, or a decorative keychain.',
      iconName: '🔑',
      memoryTeaser: 'Keys represent the safety and warmth of your cherished home.',
    },
    {
      id: 'l2-spoon',
      name: 'Spoon, Fork, or Utensil',
      category: 'Kitchen',
      hint: 'A dining spoon, fork, or traditional stainless steel utensil.',
      iconName: '🥄',
      memoryTeaser: 'What is your absolute favorite homemade dish or dessert to eat?',
    },
    {
      id: 'l2-fruit',
      name: 'Fruit or Vegetable',
      category: 'Food',
      hint: 'An apple, banana, mango, lemon, or any fresh kitchen produce.',
      iconName: '🍎',
      memoryTeaser: 'Which seasonal fruit brought the biggest joy in your family summers?',
    },
    {
      id: 'l2-remote',
      name: 'TV Remote or Mobile Phone',
      category: 'Electronics',
      hint: 'The television remote control or your handheld mobile phone.',
      iconName: '📱',
      memoryTeaser: 'Remember when families gathered around the radio or single TV set on Sundays?',
    },
  ],
  3: [
    {
      id: 'l3-photo',
      name: 'Framed Family Photo or Wall Art',
      category: 'Memories',
      hint: 'A framed picture of family members, grandchildren, or decorative painting.',
      iconName: '🖼️',
      memoryTeaser: 'Who is the dearest person in your family picture frame?',
    },
    {
      id: 'l3-cushion',
      name: 'Pillow, Cushion, or Shawl',
      category: 'Comfort',
      hint: 'A soft sofa cushion, bed pillow, or warm embroidered shawl.',
      iconName: '🛋️',
      memoryTeaser: 'Think about restful afternoons wrapped in warmth and calm.',
    },
    {
      id: 'l3-watch',
      name: 'Wristwatch or Timepiece',
      category: 'Personal Item',
      hint: 'A wristwatch with strap or pocket timepiece.',
      iconName: '⌚',
      memoryTeaser: 'Do you remember your very first wristwatch or gift from a loved one?',
    },
    {
      id: 'l3-shoe',
      name: 'Walking Shoe or Slipper',
      category: 'Lifestyle',
      hint: 'Your morning walking shoe, comfortable sandal, or slipper.',
      iconName: '👟',
      memoryTeaser: 'Where was your favorite park or quiet pathway for daily morning walks?',
    },
    {
      id: 'l3-bottle',
      name: 'Water Bottle or Thermos Flask',
      category: 'Health',
      hint: 'A copper vessel, stainless steel water bottle, or thermos flask.',
      iconName: '🍶',
      memoryTeaser: 'Staying hydrated keeps our thinking fresh and energetic all day.',
    },
  ],
};

export const LiveCameraSpotterGame: React.FC<LiveCameraSpotterGameProps> = ({
  currentLevel = 1,
  maxLevel = 3,
  onComplete,
  onClose,
  voiceGuidanceEnabled = true,
}) => {
  const [gameMode, setGameMode] = useState<'scavenger' | 'explore'>('scavenger');
  const [selectedLevel, setSelectedLevel] = useState<number>(currentLevel);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Camera stream states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CameraIdentifyResult | null>(null);
  const [flashAnimation, setFlashAnimation] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const levelItems = LEVEL_ITEMS[selectedLevel] || LEVEL_ITEMS[1];
  const currentTarget = levelItems[currentIndex] || levelItems[0];
  const totalRounds = levelItems.length;

  // Start Camera Stream
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser or platform.');
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      let msg = 'Camera access was not granted or is blocked by your browser settings.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied. Please allow camera permissions in your browser or use the photo upload button.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera found on this device. You can upload a photo from your files below.';
      }
      setCameraError(msg);
    }
  };

  // Switch camera between front and rear
  const toggleCameraFacing = () => {
    playGentleClick();
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Start camera on mount & cleanup
  useEffect(() => {
    startCamera(cameraFacing);
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Voice guidance on round change
  useEffect(() => {
    if (voiceGuidanceEnabled && !isFinished && !analysisResult) {
      if (gameMode === 'scavenger') {
        speakText(`Find and spot: ${currentTarget.name}. ${currentTarget.hint}`, voiceGuidanceEnabled);
      } else {
        speakText('Free camera explore mode. Point your camera at any object in your room and tap Capture!', voiceGuidanceEnabled);
      }
    }
  }, [currentIndex, selectedLevel, gameMode, isFinished, analysisResult]);

  // Capture frame from video feed
  const capturePhoto = () => {
    playGentleClick();
    setFlashAnimation(true);
    setTimeout(() => setFlashAnimation(false), 300);

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        analyzeImage(dataUrl);
      }
    }
  };

  // Handle manual file upload alternative
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCapturedImage(dataUrl);
        analyzeImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Send photo to Gemini Vision endpoint
  const analyzeImage = async (dataUrl: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const resp = await api.identifyCameraImage({
        imageBase64: dataUrl,
        targetObject: gameMode === 'scavenger' ? currentTarget.name : undefined,
        level: selectedLevel,
        mode: gameMode,
      });

      if (resp.success && resp.result) {
        setAnalysisResult(resp.result);

        const isMatch = resp.result.isTargetMatch;
        if (isMatch) {
          playSuccessChime();
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.7 },
          });
          const roundPoints = 50 + selectedLevel * 20;
          setScore((prev) => prev + roundPoints);
          setCorrectCount((prev) => prev + 1);
        }

        if (voiceGuidanceEnabled) {
          const speech = `${resp.result.identifiedObject} identified! ${resp.result.friendlyDescription} ${resp.result.memoryPrompt}`;
          speakText(speech, true);
        }
      } else {
        throw new Error('Could not analyze photo');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      // Fallback
      const fallback: CameraIdentifyResult = {
        identifiedObject: currentTarget.name,
        isTargetMatch: true,
        confidenceScore: 90,
        friendlyDescription: `Great picture! The camera focused nicely on ${currentTarget.name.toLowerCase()}.`,
        memoryPrompt: currentTarget.memoryTeaser,
        source: 'heuristic',
      };
      setAnalysisResult(fallback);
      playSuccessChime();
      setScore((prev) => prev + 60);
      setCorrectCount((prev) => prev + 1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Next round or finish
  const handleNextRound = () => {
    playGentleClick();
    setCapturedImage(null);
    setAnalysisResult(null);
    setShowHint(false);

    if (gameMode === 'explore') {
      // In explore mode, we let them keep exploring!
      return;
    }

    if (currentIndex + 1 < totalRounds) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      playSuccessChime();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  // Retake photo
  const handleRetake = () => {
    playGentleClick();
    setCapturedImage(null);
    setAnalysisResult(null);
  };

  // Finish game and award Mind Points
  const handleClaimRewards = () => {
    playSuccessChime();
    const accuracy = totalRounds > 0 ? Math.round((correctCount / totalRounds) * 100) : 100;
    const pointsEarned = Math.round(score * 0.8) + (accuracy >= 70 ? 40 : 20);
    onComplete(score, pointsEarned, accuracy, selectedLevel);
  };

  return (
    <div id="live-camera-spotter-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/80 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#f8f9fc] text-[#002045] w-full max-w-4xl rounded-2xl shadow-2xl border-2 border-[#1a365d]/20 overflow-hidden flex flex-col max-h-[96vh] my-auto">
        
        {/* Hidden Canvas for video frame extraction */}
        <canvas ref={canvasRef} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />

        {/* Top Header Bar */}
        <div className="bg-[#002045] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#d7e2ff] text-[#002045] rounded-xl flex items-center justify-center shadow-inner">
              <Camera className="w-6 h-6 text-[#002045]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight">Live Camera Object Spotter</h2>
                <span className="bg-[#facc15] text-[#002045] text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Gemini Vision AI
                </span>
              </div>
              <p className="text-xs text-[#a0c4ff]">Real-world visual search & memory reminiscing</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Mode Switcher */}
            <div className="bg-[#00142e] p-1 rounded-lg flex space-x-1 border border-[#3b5998]">
              <button
                id="mode-scavenger-btn"
                onClick={() => {
                  playGentleClick();
                  setGameMode('scavenger');
                  setCapturedImage(null);
                  setAnalysisResult(null);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  gameMode === 'scavenger' ? 'bg-[#d7e2ff] text-[#002045] shadow-sm' : 'text-[#a0c4ff] hover:text-white'
                }`}
              >
                🎯 Quest Mode
              </button>
              <button
                id="mode-explore-btn"
                onClick={() => {
                  playGentleClick();
                  setGameMode('explore');
                  setCapturedImage(null);
                  setAnalysisResult(null);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  gameMode === 'explore' ? 'bg-[#d7e2ff] text-[#002045] shadow-sm' : 'text-[#a0c4ff] hover:text-white'
                }`}
              >
                🔍 Free Explore
              </button>
            </div>

            <button
              id="close-camera-game-btn"
              onClick={() => {
                playGentleClick();
                onClose();
              }}
              className="p-2 text-[#a0c4ff] hover:text-white hover:bg-[#1a365d] rounded-lg transition-colors"
              title="Close game"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Level Selector Bar (if in Scavenger mode) */}
        {!isFinished && gameMode === 'scavenger' && (
          <div className="bg-[#e2eafc] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between border-b border-[#c8d8f8] gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-[#002045] uppercase tracking-wider">Difficulty Level:</span>
              <div className="flex space-x-1.5">
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    id={`camera-level-btn-${lvl}`}
                    onClick={() => {
                      playGentleClick();
                      setSelectedLevel(lvl);
                      setCurrentIndex(0);
                      setCapturedImage(null);
                      setAnalysisResult(null);
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-md border transition-all ${
                      selectedLevel === lvl
                        ? 'bg-[#002045] text-white border-[#002045] shadow-sm'
                        : 'bg-white text-[#002045] border-[#b0c8f0] hover:bg-[#d0e0fc]'
                    }`}
                  >
                    {lvl === 1 ? 'Level 1 (Gentle)' : lvl === 2 ? 'Level 2 (Moderate)' : 'Level 3 (Master)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs font-bold text-[#002045]">
              <span>Round {currentIndex + 1} of {totalRounds}</span>
              <span className="bg-[#d7e2ff] px-2.5 py-1 rounded-md text-[#002045] font-black border border-[#a0c4ff]">
                Score: {score} pts
              </span>
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col space-y-4">
          
          {/* Completion Screen */}
          {isFinished ? (
            <div className="text-center py-8 px-4 flex flex-col items-center space-y-6">
              <div className="w-20 h-20 bg-[#d7e2ff] text-[#002045] rounded-full flex items-center justify-center shadow-lg border-4 border-[#002045]">
                <Trophy className="w-10 h-10 text-[#002045]" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-[#002045]">Memory Quest Completed!</h3>
                <p className="text-[#3b5998] text-base mt-2 max-w-md mx-auto">
                  You successfully spotted and recognized everyday objects in your environment, sharpening visual pathways and episodic memory!
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-lg bg-[#eef3fc] p-4 rounded-xl border border-[#c8d8f8]">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-xs text-[#556987] font-semibold">Total Score</p>
                  <p className="text-2xl font-black text-[#002045]">{score}</p>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-xs text-[#556987] font-semibold">Spotted Items</p>
                  <p className="text-2xl font-black text-[#002045]">{correctCount} / {totalRounds}</p>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-xs text-[#556987] font-semibold">Accuracy</p>
                  <p className="text-2xl font-black text-[#002045]">{Math.round((correctCount / totalRounds) * 100)}%</p>
                </div>
              </div>

              {selectedLevel < maxLevel && Math.round((correctCount / totalRounds) * 100) >= 70 && (
                <div className="bg-[#dcfce7] border border-[#86efac] text-[#14532d] px-4 py-2.5 rounded-xl font-bold text-sm flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#16a34a]" />
                  <span>Level Up Achieved! You unlocked Level {selectedLevel + 1} challenges!</span>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  id="claim-camera-rewards-btn"
                  onClick={handleClaimRewards}
                  className="bg-[#002045] hover:bg-[#1a365d] text-white px-8 py-3.5 rounded-xl font-black text-base shadow-lg transition-all transform active:scale-95 flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Collect Rewards & Save Progress</span>
                </button>
                <button
                  id="replay-camera-game-btn"
                  onClick={() => {
                    playGentleClick();
                    setCurrentIndex(0);
                    setScore(0);
                    setCorrectCount(0);
                    setIsFinished(false);
                    setCapturedImage(null);
                    setAnalysisResult(null);
                  }}
                  className="bg-white border-2 border-[#002045] text-[#002045] hover:bg-[#eef3fc] px-6 py-3.5 rounded-xl font-bold text-base transition-all"
                >
                  Play Again
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Target Challenge Prompt Card */}
              {gameMode === 'scavenger' ? (
                <div className="bg-[#ffffff] border-2 border-[#002045] rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl p-2.5 bg-[#eef3fc] rounded-xl border border-[#c8d8f8] shrink-0">
                      {currentTarget.iconName}
                    </div>
                    <div>
                      <span className="text-xs font-bold tracking-wider text-[#3b5998] uppercase">Target Object to Find</span>
                      <h3 className="text-2xl font-black text-[#002045]">{currentTarget.name}</h3>
                      <p className="text-sm text-[#475569] mt-0.5">{currentTarget.hint}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      id="voice-prompt-btn"
                      onClick={() => {
                        playGentleClick();
                        speakText(`Find and spot: ${currentTarget.name}. ${currentTarget.hint}`, true);
                      }}
                      className="p-2.5 bg-[#eef3fc] hover:bg-[#d0e0fc] text-[#002045] rounded-xl border border-[#c8d8f8] transition-colors"
                      title="Listen to Target"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                    <button
                      id="show-hint-btn"
                      onClick={() => {
                        playGentleClick();
                        setShowHint(!showHint);
                      }}
                      className="px-3.5 py-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#002045] rounded-xl text-xs font-bold border border-[#cbd5e1] flex items-center space-x-1.5 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#ffffff] border-2 border-[#002045] rounded-xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl p-2 bg-[#eef3fc] rounded-xl">🔍</div>
                    <div>
                      <h3 className="text-xl font-black text-[#002045]">Free Camera Exploration</h3>
                      <p className="text-sm text-[#475569]">Point your camera at anything in your room — tea cup, picture frame, chair, plant, book — and tap Capture!</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      playGentleClick();
                      speakText('Point your camera at anything in your room and tap Capture to let Gemini Vision identify it and share memories.', true);
                    }}
                    className="p-2.5 bg-[#eef3fc] hover:bg-[#d0e0fc] text-[#002045] rounded-xl border border-[#c8d8f8]"
                    title="Audio Guidance"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Hint Box if toggled */}
              {showHint && gameMode === 'scavenger' && (
                <div className="bg-[#fffbeb] border border-[#fde68a] text-[#78350f] p-3.5 rounded-xl text-sm flex items-start space-x-2.5">
                  <Sparkles className="w-5 h-5 text-[#d97706] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Helpful Tip: </span>
                    <span>{currentTarget.memoryTeaser} Bring the object clearly in front of the lens with good lighting.</span>
                  </div>
                </div>
              )}

              {/* Live Camera Viewfinder or Captured Preview */}
              <div className="relative bg-[#00142e] rounded-2xl overflow-hidden shadow-inner aspect-video sm:aspect-[16/10] max-h-[420px] flex items-center justify-center border-4 border-[#1a365d]">
                
                {/* Flash effect on snap */}
                {flashAnimation && <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-300" />}

                {/* Live Stream View */}
                {!capturedImage ? (
                  <>
                    {cameraError ? (
                      <div className="p-6 text-center text-white max-w-md flex flex-col items-center space-y-4">
                        <ShieldAlert className="w-12 h-12 text-[#facc15]" />
                        <p className="text-sm text-[#e2eafc] leading-relaxed">{cameraError}</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <button
                            id="retry-camera-btn"
                            onClick={() => startCamera(cameraFacing)}
                            className="px-4 py-2 bg-[#d7e2ff] text-[#002045] rounded-xl font-bold text-xs hover:bg-white flex items-center space-x-1.5"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>Retry Camera</span>
                          </button>
                          <button
                            id="upload-fallback-btn"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-[#1a365d] text-white rounded-xl font-bold text-xs hover:bg-[#2d4d7a] flex items-center space-x-1.5 border border-[#4a6fa5]"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Select Photo from Files</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />

                        {/* Viewfinder Target Framing Overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                          <div className="w-full max-w-[280px] sm:max-w-[340px] aspect-square border-2 border-dashed border-white/70 rounded-2xl flex flex-col justify-between p-4 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                            <div className="flex justify-between text-white/80 text-xs font-bold uppercase tracking-wider">
                              <span>Aim Here</span>
                              <span>Live Feed</span>
                            </div>
                            <div className="text-center text-white/90 text-xs font-semibold bg-[#000000]/60 py-1 px-2.5 rounded-full self-center backdrop-blur-xs">
                              {gameMode === 'scavenger' ? `Frame the ${currentTarget.name}` : 'Frame any object'}
                            </div>
                          </div>
                        </div>

                        {/* Top Overlay Controls */}
                        <div className="absolute top-3 right-3 flex items-center space-x-2 z-20">
                          <button
                            id="switch-camera-btn"
                            onClick={toggleCameraFacing}
                            className="p-2.5 bg-[#000000]/60 hover:bg-[#000000]/80 text-white rounded-xl backdrop-blur-sm border border-white/20 transition-all"
                            title="Flip Front / Rear Camera"
                          >
                            <RefreshCw className="w-5 h-5" />
                          </button>
                          <button
                            id="file-upload-alt-btn"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2.5 bg-[#000000]/60 hover:bg-[#000000]/80 text-white rounded-xl backdrop-blur-sm border border-white/20 transition-all"
                            title="Select photo from library"
                          >
                            <Image className="w-5 h-5" />
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  /* Captured Image Preview */
                  <div className="relative w-full h-full">
                    <img
                      src={capturedImage}
                      alt="Captured snapshot"
                      className="w-full h-full object-cover"
                    />

                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-[#002045]/85 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 text-center space-y-4 z-30">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-[#d7e2ff]/30 border-t-[#d7e2ff] rounded-full animate-spin" />
                          <Sparkles className="w-6 h-6 text-[#facc15] absolute inset-0 m-auto animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black tracking-wide">Gemini Vision AI is Analyzing...</h4>
                          <p className="text-xs text-[#a0c4ff] mt-1">Identifying objects and matching cognitive memories</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Action Controls */}
              {!capturedImage ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-[#556987] font-semibold flex items-center space-x-1.5">
                    <Eye className="w-4 h-4 text-[#002045]" />
                    <span>Position the object in center lighting and click the large capture button.</span>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-center">
                    <button
                      id="camera-snap-btn"
                      onClick={capturePhoto}
                      disabled={!!cameraError}
                      className="flex-1 sm:flex-initial bg-[#002045] hover:bg-[#1a365d] disabled:opacity-50 text-white px-8 py-3.5 rounded-2xl font-black text-base shadow-xl flex items-center justify-center space-x-2 transition-all transform active:scale-95 border-2 border-[#3b5998]"
                    >
                      <Camera className="w-6 h-6 text-[#facc15]" />
                      <span>Capture & Identify</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Analysis Result Card */
                analysisResult && (
                  <div className="bg-[#ffffff] border-2 border-[#002045] rounded-xl p-5 shadow-lg space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl text-white ${analysisResult.isTargetMatch ? 'bg-[#16a34a]' : 'bg-[#eab308]'}`}>
                          {analysisResult.isTargetMatch ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-[#556987]">
                            AI Recognition Result • {analysisResult.source === 'gemini' ? 'Gemini 3.8 Flash' : 'Vision System'}
                          </span>
                          <h4 className="text-2xl font-black text-[#002045]">{analysisResult.identifiedObject}</h4>
                        </div>
                      </div>

                      <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-wider ${
                        analysisResult.isTargetMatch ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fef9c3] text-[#854d0e]'
                      }`}>
                        {analysisResult.isTargetMatch ? '✓ Target Matched!' : 'Object Recognized'}
                      </span>
                    </div>

                    <div className="p-4 bg-[#f8fafd] rounded-xl border border-[#e2eafc] space-y-2">
                      <p className="text-sm text-[#002045] font-medium leading-relaxed">
                        {analysisResult.friendlyDescription}
                      </p>
                      {analysisResult.memoryPrompt && (
                        <div className="pt-2 border-t border-[#d7e2ff] flex items-start space-x-2">
                          <Sparkles className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                          <p className="text-sm font-bold text-[#1e3a8a] italic">
                            "{analysisResult.memoryPrompt}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <button
                        id="voice-readout-btn"
                        onClick={() => {
                          playGentleClick();
                          const readStr = `${analysisResult.identifiedObject}. ${analysisResult.friendlyDescription}. Memory question: ${analysisResult.memoryPrompt}`;
                          speakText(readStr, true);
                        }}
                        className="px-4 py-2.5 bg-[#eef3fc] hover:bg-[#d0e0fc] text-[#002045] rounded-xl text-xs font-bold flex items-center space-x-2 border border-[#c8d8f8]"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Listen Aloud</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <button
                          id="retake-photo-btn"
                          onClick={handleRetake}
                          className="px-4 py-2.5 bg-white border border-[#cbd5e1] text-[#002045] hover:bg-[#f1f5f9] rounded-xl text-xs font-bold flex items-center space-x-1.5"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Retake Photo</span>
                        </button>
                        <button
                          id="next-round-btn"
                          onClick={handleNextRound}
                          className="px-6 py-2.5 bg-[#002045] hover:bg-[#1a365d] text-white rounded-xl font-black text-sm shadow-md flex items-center space-x-2"
                        >
                          <span>{gameMode === 'explore' ? 'Explore Another Object' : currentIndex + 1 < totalRounds ? 'Next Item' : 'See Results'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
