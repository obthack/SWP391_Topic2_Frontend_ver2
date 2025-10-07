import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../lib/api';
import { RotateCcw, Trash2 } from 'lucide-react';

export const Trash = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getListingId = (l) => l?.id ?? l?.productId ?? l?.Id ?? l?.listingId ?? l?.product_id ?? null;
  const norm = (v)=> String(v||'').toLowerCase();
  const isDeleted = (l)=> norm(l?.status || l?.Status || '') === 'deleted';

  useEffect(()=>{
    (async ()=>{
      try{
        const data = await apiRequest(`/api/Product/seller/${user?.id || user?.accountId || user?.userId}`);
        const list = Array.isArray(data) ? data : (data?.items || []);
        setItems(list.filter(isDeleted));
      } catch(e){ setError(e.message || 'Không thể tải thùng rác'); }
      finally{ setLoading(false); }
    })();
  }, [user]);

  const restore = async (id)=>{
    try {
      await apiRequest(`/api/Product/${id}`, { method: 'PUT', body: { status: 'pending' } });
      setItems((prev)=> prev.filter((x)=> getListingId(x) !== id));
    } catch(e){ alert(e.message || 'Không thể khôi phục'); }
  };

  const hardDelete = async (id)=>{
    if(!confirm('Xóa vĩnh viễn?')) return;
    try {
      await apiRequest(`/api/Product/${id}`, { method: 'DELETE' });
      setItems((prev)=> prev.filter((x)=> getListingId(x) !== id));
    } catch(e){ alert(e.message || 'Không thể xóa vĩnh viễn'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Thùng rác</h1>
          <Link to="/my-listings" className="text-blue-600">Quay lại danh sách</Link>
        </div>
        {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700">{error}</div>}
        {items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-600">Không có mục nào</div>
        ) : (
          <div className="space-y-3">
            {items.map((l)=>{
              const id = getListingId(l);
              return (
                <div key={id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={l.images?.[0] || 'https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=100'} alt="thumb" className="w-16 h-16 rounded object-cover"/>
                    <div>
                      <div className="font-semibold">{l.title}</div>
                      <div className="text-sm text-gray-500">{l.licensePlate || l.license_plate || ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=> restore(id)} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-1">
                      <RotateCcw className="w-4 h-4"/> Khôi phục
                    </button>
                    <button onClick={()=> hardDelete(id)} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-1">
                      <Trash2 className="w-4 h-4"/> Xóa vĩnh viễn
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
