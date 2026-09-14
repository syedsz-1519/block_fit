import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface DemoVideoPlayerProps {
  onClose?: () => void;
}

export const DemoVideoPlayer: React.FC<DemoVideoPlayerProps> = ({ onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setProgress(percent * 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full"
    >
      {/* Video Container */}
      <div className="relative w-full bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
        {/* Animated Demo Grid Background */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
          {/* Grid Pattern Background */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Animated Demo Content */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            {isPlaying ? (
              <AnimatedGameplayDemo />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePlayPause}
                  className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl hover:shadow-emerald-500/50 transition-shadow"
                >
                  <Play className="w-10 h-10 text-white fill-white ml-1" />
                </motion.button>
                <p className="text-gray-300 text-sm font-semibold">Watch Demo</p>
              </div>
            )}
          </div>

          {/* Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-20">
            {/* Progress Bar */}
            <div
              onClick={handleProgressClick}
              className="w-full h-1 bg-gray-700 rounded-full mb-3 cursor-pointer hover:h-1.5 transition-all"
            >
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: isPlaying ? `${progress}%` : '0%' }}
                transition={{ type: 'linear', duration: 0.05 }}
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePlayPause}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMuteToggle}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </motion.button>
              </div>

              <div className="text-xs text-gray-300">
                {isPlaying ? '1:23' : '0:00'} / 1:23
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Description */}
      <div className="mt-4 space-y-2">
        <h4 className="font-bold text-white text-sm">Learn Block Fit Basics</h4>
        <p className="text-xs text-gray-300">
          Watch how to drag blocks, rotate pieces, and complete puzzles. Master the fundamentals in under 2 minutes!
        </p>
      </div>
    </motion.div>
  );
};

// Animated Gameplay Demo Component
const AnimatedGameplayDemo: React.FC = () => {
  const gridSize = 4;
  const cellSize = 40;

  // Sample blocks being placed
  const [blocks, setBlocks] = React.useState([
    { id: 1, x: 0, y: 0, width: 2, height: 1, color: '#f59e0b', delay: 0 },
    { id: 2, x: 2, y: 0, width: 1, height: 2, color: '#3b82f6', delay: 0.3 },
    { id: 3, x: 0, y: 1, width: 1, height: 2, color: '#10b981', delay: 0.6 },
    { id: 4, x: 1, y: 1, width: 1, height: 1, color: '#ec4899', delay: 0.9 },
  ]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setBlocks(prev => prev.map(block => ({
        ...block,
        delay: (block.delay + 3) % 12, // Cycle animation
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative" style={{ width: `${gridSize * cellSize}px`, height: `${gridSize * cellSize}px` }}>
      {/* Grid */}
      <div className="absolute inset-0 border-2 border-gray-600 rounded-lg overflow-hidden">
        {Array.from({ length: gridSize }).map((_, row) =>
          Array.from({ length: gridSize }).map((_, col) => (
            <div
              key={`${row}-${col}`}
              className="absolute border border-gray-700 bg-gray-800/20"
              style={{
                width: cellSize,
                height: cellSize,
                left: col * cellSize,
                top: row * cellSize,
              }}
            />
          ))
        )}
      </div>

      {/* Animated Blocks */}
      {blocks.map(block => (
        <motion.div
          key={block.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: block.x * cellSize,
            y: block.y * cellSize,
          }}
          transition={{
            delay: block.delay,
            duration: 0.5,
            ease: 'easeOut',
          }}
          className="absolute rounded-lg shadow-lg"
          style={{
            backgroundColor: block.color,
            width: block.width * cellSize,
            height: block.height * cellSize,
            opacity: 0.9,
          }}
        >
          {/* Shine Effect */}
          <motion.div
            animate={{
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: block.delay,
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent rounded-lg"
          />
        </motion.div>
      ))}

      {/* Animation Labels */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="absolute -bottom-8 left-0 right-0 text-center"
      >
        <p className="text-xs text-gray-400">Drag • Rotate • Place • Complete</p>
      </motion.div>
    </div>
  );
};
