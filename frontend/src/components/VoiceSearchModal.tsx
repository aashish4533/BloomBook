import { useState, useEffect } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { Button } from './ui/button';

interface VoiceSearchModalProps {
  onClose: () => void;
  onSearchComplete: (query: string) => void;
}

export function VoiceSearchModal({ onClose, onSearchComplete }: VoiceSearchModalProps) {
  const [isListening, setIsListening] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  useEffect(() => {
    // Simulate voice recognition (in production, use Web Speech API)
    if (isListening) {
      const timer = setTimeout(() => {
        const mockTranscript = "Search for science fiction books";
        setTranscript(mockTranscript);
        setIsListening(false);
      }, 2000);

      // Simulate interim results
      const interimTimer = setTimeout(() => {
        setInterimTranscript("Search for...");
      }, 500);

      return () => {
        clearTimeout(timer);
        clearTimeout(interimTimer);
      };
    }
  }, [isListening]);

  const handleSearch = () => {
    if (transcript) {
      onSearchComplete(transcript);
      onClose();
    }
  };

  const handleRetry = () => {
    setTranscript('');
    setInterimTranscript('');
    setIsListening(true);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeInUp">
      <div className="bg-white rounded-2xl shadow-hover max-w-md w-full p-8 transition-smooth">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl text-gray-900">Voice Search</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Microphone Animation */}
        <div className="flex flex-col items-center mb-6">
          <div
            className={`relative w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-smooth ${
              isListening
                ? 'bg-red-100 animate-pulse'
                : transcript
                ? 'bg-green-100'
                : 'bg-gray-100'
            }`}
          >
            <div
              className={`absolute inset-0 rounded-full ${
                isListening ? 'animate-ping bg-red-200' : ''
              }`}
            />
            {isListening ? (
              <Mic className="w-12 h-12 text-red-600 relative z-10" />
            ) : transcript ? (
              <Mic className="w-12 h-12 text-green-600 relative z-10" />
            ) : (
              <MicOff className="w-12 h-12 text-gray-400 relative z-10" />
            )}
          </div>

          {/* Waveform Animation */}
          {isListening && (
            <div className="flex items-center gap-1 h-12 mb-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 40 + 20}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}

          {/* Status Text */}
          <p className="text-center mb-2">
            {isListening ? (
              <span className="text-red-600">Listening...</span>
            ) : transcript ? (
              <span className="text-green-600">Recording Complete</span>
            ) : (
              <span className="text-gray-500">Click to retry</span>
            )}
          </p>
        </div>

        {/* Transcript Display */}
        <div className="bg-gray-50 rounded-lg p-4 min-h-[80px] mb-6">
          {transcript ? (
            <p className="text-gray-900">{transcript}</p>
          ) : interimTranscript ? (
            <p className="text-gray-500 italic">{interimTranscript}</p>
          ) : (
            <p className="text-gray-400 text-center">
              {isListening ? 'Start speaking...' : 'No speech detected'}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRetry}
            className="flex-1 hover:bg-gray-50 transition-smooth"
            disabled={isListening}
          >
            Retry
          </Button>
          <Button
            onClick={handleSearch}
            disabled={!transcript}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-smooth btn-scale disabled:opacity-50"
          >
            Search
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Tip: Speak clearly for best results
        </p>
      </div>
    </div>
  );
}
