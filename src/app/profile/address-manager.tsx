"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Address = {
  id: string;
  title: string;
  addressLine: string;
  city: string;
  zipCode: string | null;
  isDefault: boolean;
};

export default function AddressManager() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  // Form State
  const [newAddress, setNewAddress] = useState({
    title: "",
    addressLine: "",
    city: "Baku",
    zipCode: "",
    isDefault: false,
  });

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });

      if (res.ok) {
        toast.success("Ünvan əlavə edildi");
        setShowForm(false);
        setNewAddress({ title: "", addressLine: "", city: "Baku", zipCode: "", isDefault: false });
        fetchAddresses();
        router.refresh();
      } else {
        toast.error("Xəta baş verdi");
      }
    } catch (error) {
      toast.error("Xəta baş verdi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ünvanı silmək istədiyinizə əminsiniz?")) return;
    
    try {
      const res = await fetch(`/api/addresses?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Ünvan silindi");
        fetchAddresses();
      }
    } catch (error) {
      toast.error("Xəta baş verdi");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-500" />
          Çatdırılma Ünvanları
        </h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Yeni
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div>
            <label className="text-xs text-gray-400">Başlıq (Məs: Ev, İş)</label>
            <input 
              required
              value={newAddress.title}
              onChange={(e) => setNewAddress({...newAddress, title: e.target.value})}
              className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-sm mt-1"
              placeholder="Ev"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Ünvan</label>
            <input 
              required
              value={newAddress.addressLine}
              onChange={(e) => setNewAddress({...newAddress, addressLine: e.target.value})}
              className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-sm mt-1"
              placeholder="Nizami küç. 12, mənzil 45"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-400">Şəhər</label>
              <select 
                value={newAddress.city}
                onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-sm mt-1"
              >
                <option value="Baku">Bakı</option>
                <option value="Sumqayit">Sumqayıt</option>
                <option value="Ganja">Gəncə</option>
              </select>
            </div>
            <div className="w-1/3">
              <label className="text-xs text-gray-400">Poçt Kodu</label>
              <input 
                value={newAddress.zipCode}
                onChange={(e) => setNewAddress({...newAddress, zipCode: e.target.value})}
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-sm mt-1"
                placeholder="AZ1000"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isDefault"
              checked={newAddress.isDefault}
              onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})}
              className="rounded bg-gray-950 border-gray-800"
            />
            <label htmlFor="isDefault" className="text-sm text-gray-300">Əsas ünvan kimi qeyd et</label>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-800 py-2 rounded text-sm">Ləğv et</button>
            <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-500 py-2 rounded text-sm font-medium">Yadda saxla</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-gray-500">Yüklənir...</p>
        ) : addresses.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Hələ ünvan əlavə edilməyib.</p>
        ) : (
          addresses.map((addr) => (
            <div key={addr.id} className="bg-gray-900 p-3 rounded-lg border border-gray-800 flex justify-between items-start group">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{addr.title}</span>
                  {addr.isDefault && <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 rounded">Əsas</span>}
                </div>
                <p className="text-xs text-gray-400 mt-1">{addr.addressLine}, {addr.city} {addr.zipCode}</p>
              </div>
              <button 
                onClick={() => handleDelete(addr.id)}
                className="text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
