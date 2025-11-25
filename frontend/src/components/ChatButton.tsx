import { MessageCircle } from 'lucide-react';

export function ChatButton() {
  return (
    <button 
      className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[#D4A574] hover:bg-[#C49563] shadow-lg flex items-center justify-center transition-colors"
      aria-label="Open chat"
    >
      <MessageCircle className="w-6 h-6 text-white" />
    </button>
  );
}
