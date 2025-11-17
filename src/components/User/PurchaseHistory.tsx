import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Eye, Download } from 'lucide-react';

interface Purchase {
  id: string;
  bookTitle: string;
  author: string;
  price: number;
  date: string;
  status: 'completed' | 'shipped' | 'delivered';
}

const mockPurchases: Purchase[] = [
  {
    id: '1',
    bookTitle: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    price: 15.99,
    date: '2024-11-01',
    status: 'delivered'
  },
  {
    id: '2',
    bookTitle: '1984',
    author: 'George Orwell',
    price: 18.50,
    date: '2024-10-28',
    status: 'delivered'
  },
];

export function PurchaseHistory() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[#2C3E50] text-xl">Purchase History</h3>
            <p className="text-gray-600 text-sm">View all your book purchases</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        <div className="space-y-4">
          {mockPurchases.map((purchase) => (
            <div key={purchase.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-[#2C3E50]">{purchase.bookTitle}</h4>
                    <Badge className={getStatusColor(purchase.status)}>
                      {purchase.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">by {purchase.author}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Order #{purchase.id}</span>
                    <span>•</span>
                    <span>{new Date(purchase.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="text-[#C4A672]">${purchase.price.toFixed(2)}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
