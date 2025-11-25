import { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Download, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Slider } from './ui/slider';

interface VideoPlayerProps {
  title: string;
  description?: string;
  duration?: string;
  onClose?: () => void;
  downloadable?: boolean;
}

export function VideoPlayer({ title, description, duration = '15:30', onClose, downloadable = false }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState([30]);
  const [volume, setVolume] = useState([70]);

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-white">
            <h2 className="text-2xl mb-1">{title}</h2>
            {description && <p className="text-white/70 text-sm">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        {/* Video Container */}
        <Card className="bg-black overflow-hidden">
          <div className="relative" style={{ aspectRatio: '16/9' }}>
            {/* Video Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/20 transition-colors"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Pause className="w-12 h-12 text-white" />
                  ) : (
                    <Play className="w-12 h-12 text-white ml-2" />
                  )}
                </div>
                <p className="text-white/70 text-sm">Video Lecture Player</p>
                <p className="text-white/50 text-xs mt-1">Placeholder for embedded video content</p>
              </div>
            </div>

            {/* Video Overlay (when playing) */}
            {isPlaying && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
            )}

            {/* Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              {/* Progress Bar */}
              <div className="mb-4">
                <Slider
                  value={progress}
                  onValueChange={setProgress}
                  max={100}
                  step={1}
                  className="w-full cursor-pointer"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-white/70">
                  <span>{Math.floor((progress[0] / 100) * 15)}:{String(Math.floor(((progress[0] / 100) * 30) % 60)).padStart(2, '0')}</span>
                  <span>{duration}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Play/Pause */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </button>

                  {/* Volume */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-white/80 hover:text-white"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                    <div className="w-24 hidden md:block">
                      <Slider
                        value={volume}
                        onValueChange={setVolume}
                        max={100}
                        step={1}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Time */}
                  <span className="text-white/80 text-sm hidden sm:inline">
                    {Math.floor((progress[0] / 100) * 15)}:{String(Math.floor(((progress[0] / 100) * 30) % 60)).padStart(2, '0')} / {duration}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Download */}
                  {downloadable && (
                    <button className="text-white/80 hover:text-white p-2">
                      <Download className="w-5 h-5" />
                    </button>
                  )}

                  {/* Settings */}
                  <button className="text-white/80 hover:text-white p-2">
                    <Settings className="w-5 h-5" />
                  </button>

                  {/* Fullscreen */}
                  <button className="text-white/80 hover:text-white p-2">
                    <Maximize className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Additional Info */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-white/10 border-white/20 text-white">
            <p className="text-sm text-white/70 mb-1">Quality</p>
            <p>1080p HD</p>
          </Card>
          <Card className="p-4 bg-white/10 border-white/20 text-white">
            <p className="text-sm text-white/70 mb-1">Duration</p>
            <p>{duration} minutes</p>
          </Card>
          <Card className="p-4 bg-white/10 border-white/20 text-white">
            <p className="text-sm text-white/70 mb-1">Format</p>
            <p>MP4 Video</p>
          </Card>
        </div>

        {/* Action Buttons */}
        {downloadable && (
          <div className="mt-4 flex gap-3">
            <Button className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white">
              <Download className="w-4 h-4 mr-2" />
              Download Video
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
              Share
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
