import { useState } from 'react';
import { Eye, Search, ShoppingCart, Calendar, Users, BookOpen, Clock, Filter, Download } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface ActivityHistoryProps {
  onNavigateToBook?: (bookId: string) => void;
}

export function ActivityHistory({ onNavigateToBook }: ActivityHistoryProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'views' | 'searches' | 'transactions'>('all');

  const viewHistory = [
    {
      id: 'v1',
      type: 'view',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      timestamp: '2 hours ago',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80',
      price: 12.99
    },
    {
      id: 'v2',
      type: 'view',
      title: '1984',
      author: 'George Orwell',
      timestamp: '5 hours ago',
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
      price: 11.99
    },
    {
      id: 'v3',
      type: 'view',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      timestamp: '1 day ago',
      image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80',
      price: 13.50
    }
  ];

  const searchHistory = [
    {
      id: 's1',
      type: 'search',
      query: 'classic literature',
      results: 45,
      timestamp: '3 hours ago'
    },
    {
      id: 's2',
      type: 'search',
      query: 'science fiction dystopia',
      results: 28,
      timestamp: '1 day ago'
    },
    {
      id: 's3',
      type: 'search',
      query: 'programming books python',
      results: 67,
      timestamp: '2 days ago'
    },
    {
      id: 's4',
      type: 'search',
      query: 'best selling novels 2024',
      results: 89,
      timestamp: '3 days ago'
    }
  ];

  const transactionHistory = [
    {
      id: 't1',
      type: 'purchase',
      title: 'Dune',
      author: 'Frank Herbert',
      amount: 16.50,
      transactionId: 'TXN123456',
      timestamp: '1 week ago',
      status: 'completed',
      image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&q=80'
    },
    {
      id: 't2',
      type: 'rental',
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      amount: 5.99,
      transactionId: 'TXN123455',
      timestamp: '2 weeks ago',
      status: 'active',
      duration: '14 days',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80'
    },
    {
      id: 't3',
      type: 'tuition',
      title: 'Advanced Mathematics Session',
      instructor: 'Dr. Sarah Johnson',
      amount: 45.00,
      transactionId: 'TXN123454',
      timestamp: '3 weeks ago',
      status: 'completed'
    }
  ];

  const communityActivity = [
    {
      id: 'c1',
      type: 'join',
      communityName: 'Science Fiction Lovers',
      timestamp: '1 week ago',
      members: 1234
    },
    {
      id: 'c2',
      type: 'post',
      communityName: 'Book Club Discussions',
      content: 'Just finished reading "The Martian"...',
      likes: 23,
      comments: 8,
      timestamp: '2 days ago'
    }
  ];

  const allActivities = [
    ...viewHistory.map(v => ({ ...v, category: 'view' })),
    ...searchHistory.map(s => ({ ...s, category: 'search' })),
    ...transactionHistory.map(t => ({ ...t, category: 'transaction' })),
    ...communityActivity.map(c => ({ ...c, category: 'community' }))
  ].sort((a, b) => {
    // Simple timestamp sorting (in real app, would use actual dates)
    return 0;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'view':
        return Eye;
      case 'search':
        return Search;
      case 'purchase':
      case 'rental':
        return ShoppingCart;
      case 'tuition':
        return BookOpen;
      case 'join':
      case 'post':
        return Users;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'view':
        return 'bg-blue-100 text-blue-600';
      case 'search':
        return 'bg-purple-100 text-purple-600';
      case 'purchase':
      case 'rental':
        return 'bg-green-100 text-green-600';
      case 'tuition':
        return 'bg-orange-100 text-orange-600';
      case 'join':
      case 'post':
        return 'bg-pink-100 text-pink-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[#2C3E50] text-xl">Activity History</h3>
          <p className="text-gray-600 text-sm">Your browsing and transaction history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl text-[#2C3E50]">{viewHistory.length}</p>
              <p className="text-xs text-gray-600">Books Viewed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl text-[#2C3E50]">{searchHistory.length}</p>
              <p className="text-xs text-gray-600">Searches</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl text-[#2C3E50]">{transactionHistory.length}</p>
              <p className="text-xs text-gray-600">Transactions</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl text-[#2C3E50]">{communityActivity.length}</p>
              <p className="text-xs text-gray-600">Community</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Activity</TabsTrigger>
          <TabsTrigger value="views">Views</TabsTrigger>
          <TabsTrigger value="searches">Searches</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card className="divide-y">
            {allActivities.slice(0, 10).map((activity: any) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {activity.category === 'view' && (
                        <div className="flex gap-3">
                          <ImageWithFallback
                            src={activity.image}
                            alt={activity.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="text-[#2C3E50]">{activity.title}</p>
                            <p className="text-sm text-gray-600">by {activity.author}</p>
                            <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                          </div>
                        </div>
                      )}
                      {activity.category === 'search' && (
                        <div>
                          <p className="text-[#2C3E50]">Searched: "{activity.query}"</p>
                          <p className="text-sm text-gray-600">{activity.results} results found</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                        </div>
                      )}
                      {activity.category === 'transaction' && (
                        <div className="flex gap-3">
                          {activity.image && (
                            <ImageWithFallback
                              src={activity.image}
                              alt={activity.title}
                              className="w-12 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[#2C3E50]">{activity.title}</p>
                              <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                                {activity.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">${activity.amount.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </TabsContent>

        <TabsContent value="views" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {viewHistory.map((item) => (
              <Card
                key={item.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onNavigateToBook?.(item.id)}
              >
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  className="w-full h-48 object-cover rounded mb-3"
                />
                <h4 className="text-[#2C3E50] mb-1">{item.title}</h4>
                <p className="text-sm text-gray-600 mb-2">by {item.author}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[#C4A672]">${item.price}</span>
                  <span className="text-xs text-gray-500">{item.timestamp}</span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="searches" className="mt-6">
          <Card className="divide-y">
            {searchHistory.map((search) => (
              <div key={search.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-[#2C3E50]">"{search.query}"</p>
                      <p className="text-sm text-gray-600">{search.results} results</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{search.timestamp}</p>
                </div>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <Card className="divide-y">
            {transactionHistory.map((transaction) => (
              <div key={transaction.id} className="p-4">
                <div className="flex gap-4">
                  {transaction.image && (
                    <ImageWithFallback
                      src={transaction.image}
                      alt={transaction.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-[#2C3E50]">{transaction.title}</h4>
                        {transaction.author && (
                          <p className="text-sm text-gray-600">by {transaction.author}</p>
                        )}
                        {transaction.instructor && (
                          <p className="text-sm text-gray-600">with {transaction.instructor}</p>
                        )}
                      </div>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">ID: {transaction.transactionId}</span>
                      <span className="text-[#C4A672]">${transaction.amount.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{transaction.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
