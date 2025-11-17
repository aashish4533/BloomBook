import { Badge } from '../ui/badge';
import { DollarSign } from 'lucide-react';

export function SalesHistory() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[#2C3E50] text-xl">Sales History</h3>
            <p className="text-gray-600 text-sm">Track your book sales and earnings</p>
          </div>
          <div className="text-right">
            <p className="text-gray-600 text-sm">Total Earnings</p>
            <p className="text-2xl text-[#C4A672]">$245.50</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-[#2C3E50] mb-2">The Great Gatsby</h4>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Sold to: Jane Smith</span>
                  <span>•</span>
                  <span>Oct 15, 2024</span>
                  <span>•</span>
                  <span className="text-[#C4A672]">$12.00</span>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Completed</Badge>
            </div>
          </div>

          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No more sales history</p>
          </div>
        </div>
      </div>
    </div>
  );
}
