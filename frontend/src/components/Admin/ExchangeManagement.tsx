import { useMemo, useState } from 'react';
import { collection, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../../firebase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ExchangeRow {
  id: string;
  requesterId: string;
  ownerId: string;
  status?: string;
  requestedBookId?: string;
  offeredBookId?: string;
}

export function ExchangeManagement() {
  const [search, setSearch] = useState('');
  const [snap, loading] = useCollection(collection(db, 'exchanges'));

  const rows: ExchangeRow[] = useMemo(() => {
    if (!snap?.docs.length) return [];
    return snap.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id,
        requesterId: String(x.requesterId || ''),
        ownerId: String(x.ownerId || ''),
        status: x.status != null ? String(x.status) : undefined,
        requestedBookId: x.requestedBookId != null ? String(x.requestedBookId) : undefined,
        offeredBookId: x.offeredBookId != null ? String(x.offeredBookId) : undefined,
      };
    });
  }, [snap]);

  const filtered = rows.filter(
    (r) =>
      !search.trim() ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.requesterId.includes(search) ||
      r.ownerId.includes(search)
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this exchange offer?')) return;
    try {
      await deleteDoc(doc(db, 'exchanges', id));
      toast.success('Exchange removed');
    } catch (e) {
      console.error(e);
      toast.error('Could not delete exchange');
    }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'exchanges', id), { status, updatedAt: serverTimestamp() });
      toast.success('Status updated');
    } catch (e) {
      console.error(e);
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#2C3E50] mb-1">Book exchange offers</h3>
        <p className="text-sm text-gray-500 mb-4">Admin CRUD: delete stuck offers or set status for support.</p>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search by id or user id…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Requester</th>
                <th className="text-left p-3">Owner</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50/80">
                  <td className="p-3 font-mono text-xs max-w-[120px] truncate" title={r.id}>
                    {r.id}
                  </td>
                  <td className="p-3 font-mono text-xs max-w-[100px] truncate">{r.requesterId}</td>
                  <td className="p-3 font-mono text-xs max-w-[100px] truncate">{r.ownerId}</td>
                  <td className="p-3">
                    <Badge variant="outline">{r.status || '—'}</Badge>
                  </td>
                  <td className="p-3 text-right space-x-1">
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void handleStatus(r.id, 'cancelled')}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs text-red-600" onClick={() => void handleDelete(r.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <p className="p-8 text-center text-gray-500">No exchange records.</p>}
        </div>
      )}
    </div>
  );
}
