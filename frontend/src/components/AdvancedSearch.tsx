// Updated src/components/AdvancedSearch.tsx
import { useState, useEffect } from 'react';
import { Search, Mic, X, Bot, Filter, MapPin, DollarSign, Tag, ChevronDown } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { toast } from 'sonner';

interface AdvancedSearchProps {
  onBack: () => void;
  onNavigateToBook?: (bookId: string) => void;
}

export function AdvancedSearch({ onBack, onNavigateToBook }: AdvancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'ai'; content: string; books?: any[] }>>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Filter states
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [location, setLocation] = useState('');
  const [condition, setCondition] = useState('');
  const [category, setCategory] = useState('');

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'books'));
      
      if (searchQuery) {
        // Basic search - for full-text, consider Cloud Firestore search extension or Algolia
        q = query(q, where('title', '>=', searchQuery), where('title', '<=', searchQuery + '\uf8ff'));
      }
      
      if (category) q = query(q, where('category', '==', category));
      if (condition) q = query(q, where('condition', '==', condition));
      // For price, since range, use >= and <=
      q = query(q, where('price', '>=', priceRange[0]), where('price', '<=', priceRange[1]));
      // Location would need geo queries or simple string match
      if (location) q = query(q, where('location', '==', location));

      q = query(q, orderBy('title'), limit(20));

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSearchResults(data);
    } catch (err) {
      toast.error('Search failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [searchQuery, priceRange, location, condition, category]);

  const handleVoiceSearch = () => {
    setShowVoiceModal(true);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // Simulate recording
    setTimeout(() => {
      setIsRecording(false);
      setSearchQuery('Harry Potter');
      setShowVoiceModal(false);
    }, 2000);
  };

  const handleSendAiMessage = () => {
    if (!aiQuery.trim()) return;

    const newUserMessage = { role: 'user' as const, content: aiQuery };
    
    // Simulate AI response with book recommendations
    const aiResponse = {
      role: 'ai' as const,
      content: `Based on "${aiQuery}", here are some recommendations:`,
      books: searchResults.slice(0, 2)
    };

    setAiMessages([...aiMessages, newUserMessage, aiResponse]);
    setAiQuery('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F3] to-white">
      {/* Header */}
      <div className="bg-[#C4A672] shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#2C3E50] hover:text-[#1a252f]"
            >
              <X className="w-6 h-6" />
              <span>Close</span>
            </button>
            <h1 className="text-[#2C3E50] text-2xl">Advanced Search</h1>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Search & Filters */}
          <div className="lg:col-span-1 space-y-6">
            {/* Traditional Search */}
            <Card className="p-6">
              <h3 className="text-[#2C3E50] mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Books
              </h3>
              
              <div className="space-y-4">
                {/* Text Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Title, author, ISBN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    onClick={handleVoiceSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4A672] hover:text-[#8B7355]"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>

                {/* AI Assistant Button */}
                <Button
                  onClick={() => setShowAiChat(!showAiChat)}
                  className="w-full bg-gradient-to-r from-[#C4A672] to-[#8B7355] hover:from-[#8B7355] hover:to-[#C4A672] text-white"
                >
                  <Bot className="w-5 h-5 mr-2" />
                  {showAiChat ? 'Hide AI Assistant' : 'Ask AI Assistant'}
                </Button>

                {/* Filters Toggle */}
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="w-full"
                >
                  <Filter className="w-5 h-5 mr-2" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                  <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>

                {/* Filter Options */}
                {showFilters && (
                  <div className="space-y-4 pt-4 border-t">
                    {/* Price Range */}
                    <div>
                      <label className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4" />
                        Price Range: ${priceRange[0]} - ${priceRange[1]}
                      </label>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    {/* Condition */}
                    <div>
                      <label className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4" />
                        Condition
                      </label>
                      <Select value={condition} onValueChange={setCondition}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Brand New</SelectItem>
                          <SelectItem value="like-new">Like New</SelectItem>
                          <SelectItem value="very-good">Very Good</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="acceptable">Acceptable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </label>
                      <Input
                        type="text"
                        placeholder="City or ZIP code"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">
                        Category
                      </label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fiction">Fiction</SelectItem>
                          <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                          <SelectItem value="science">Science</SelectItem>
                          <SelectItem value="fantasy">Fantasy</SelectItem>
                          <SelectItem value="classic">Classic</SelectItem>
                          <SelectItem value="textbook">Textbooks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Reset Filters */}
                    <Button
                      onClick={() => {
                        setPriceRange([0, 100]);
                        setCondition('');
                        setLocation('');
                        setCategory('');
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Reset Filters
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Categories */}
            <Card className="p-6">
              <h3 className="text-[#2C3E50] mb-4">Popular Categories</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="cursor-pointer hover:bg-[#C4A672] hover:text-white">
                  📚 Fiction
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-[#C4A672] hover:text-white">
                  🔬 Science
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-[#C4A672] hover:text-white">
                  💼 Business
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-[#C4A672] hover:text-white">
                  🎨 Art
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-[#C4A672] hover:text-white">
                  📖 Textbooks
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-[#C4A672] hover:text-white">
                  🧪 Academic
                </Badge>
              </div>
            </Card>
          </div>

          {/* Right Column - AI Chat & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Chat Interface */}
            {showAiChat && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[#2C3E50] flex items-center gap-2">
                    <Bot className="w-6 h-6 text-[#C4A672]" />
                    AI Book Assistant
                  </h3>
                  <button
                    onClick={() => setShowAiChat(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {aiMessages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bot className="w-12 h-12 mx-auto mb-3 text-[#C4A672]" />
                      <p className="mb-2">Ask me anything about books!</p>
                      <p className="text-sm">Try: "Suggest books like Harry Potter" or "Best science fiction books"</p>
                    </div>
                  ) : (
                    aiMessages.map((message, index) => (
                      <div key={index}>
                        {message.role === 'user' ? (
                          <div className="flex justify-end">
                            <div className="bg-[#C4A672] text-white rounded-lg px-4 py-2 max-w-[80%]">
                              {message.content}
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2 max-w-[80%]">
                              <p className="mb-2">{message.content}</p>
                              {message.books && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                  {message.books.map((book) => (
                                    <div
                                      key={book.id}
                                      className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                                      onClick={() => onNavigateToBook?.(book.id)}
                                    >
                                      <ImageWithFallback
                                        src={book.image}
                                        alt={book.title}
                                        className="w-full h-32 object-cover rounded mb-2"
                                      />
                                      <p className="text-sm text-[#2C3E50]">{book.title}</p>
                                      <p className="text-xs text-gray-500">{book.author}</p>
                                      <p className="text-sm text-[#C4A672] mt-1">${book.price}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* AI Input */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Ask for book recommendations..."
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendAiMessage}
                    className="bg-[#C4A672] hover:bg-[#8B7355]"
                  >
                    Send
                  </Button>
                </div>
              </Card>
            )}

            {/* Search Results */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#2C3E50] text-xl">
                  Search Results ({searchResults.length})
                </h3>
                <Select defaultValue="relevance">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {searchResults.map((book) => (
                  <Card
                    key={book.id}
                    className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => onNavigateToBook?.(book.id)}
                  >
                    <div className="flex gap-4">
                      <ImageWithFallback
                        src={book.image}
                        alt={book.title}
                        className="w-24 h-32 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="text-[#2C3E50] mb-1">{book.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                        <div className="space-y-1 text-xs text-gray-500">
                          <p>ISBN: {book.isbn}</p>
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {book.location}
                          </p>
                          <p className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {book.condition}
                          </p>
                        </div>
                        <p className="text-[#C4A672] text-lg mt-2">${book.price}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Search Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-8">
            <div className="text-center">
              <button
                onClick={() => setShowVoiceModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>

              <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                isRecording ? 'bg-red-100 animate-pulse' : 'bg-[#C4A672]/20'
              }`}>
                <Mic className={`w-12 h-12 ${isRecording ? 'text-red-500' : 'text-[#C4A672]'}`} />
              </div>

              <h3 className="text-[#2C3E50] text-xl mb-2">
                {isRecording ? 'Listening...' : 'Voice Search'}
              </h3>
              <p className="text-gray-600 mb-6">
                {isRecording ? 'Speak now' : 'Tap the microphone to start'}
              </p>

              {!isRecording ? (
                <Button
                  onClick={handleStartRecording}
                  className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <div className="text-sm text-gray-500">
                  Transcribing your voice...
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}