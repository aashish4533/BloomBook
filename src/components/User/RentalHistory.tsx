import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Calendar, RefreshCw } from 'lucide-react';

export function RentalHistory() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[#2C3E50] text-xl">Rental History</h3>
            <p className="text-gray-600 text-sm">Manage your active and past rentals</p>
          </div>
        </div>

        {/* Active Rentals */}
        <div className="mb-6">
          <h4 className="text-[#2C3E50] mb-3">Active Rentals</h4>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h5 className="text-[#2C3E50]">Pride and Prejudice</h5>
                <p className="text-sm text-gray-600">by Jane Austen</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Due: Nov 30, 2024</span>
              </div>
              <span>•</span>
              <span>15 days left</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-[#C4A672] hover:bg-[#8B7355] text-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Renew
              </Button>
              <Button size="sm" variant="outline">
                Return Book
              </Button>
            </div>
          </div>
        </div>

        {/* Past Rentals */}
        <div>
          <h4 className="text-[#2C3E50] mb-3">Past Rentals</h4>
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="text-[#2C3E50]">The Catcher in the Rye</h5>
                  <p className="text-sm text-gray-600">by J.D. Salinger</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                    <span>Rented: Sep 1 - Oct 1, 2024</span>
                    <span>•</span>
                    <span className="text-[#C4A672]">$5.99</span>
                  </div>
                </div>
                <Badge className="bg-gray-100 text-gray-800">Returned</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
