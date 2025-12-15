"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CreditCard, MapPin, Plus } from "lucide-react";
import Link from "next/link";

type Address = {
  id: string;
  title: string;
  addressLine: string;
  city: string;
  isDefault: boolean;
};

export default function CheckoutClient({ listing, user }: { listing: any, user: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch("/api/addresses");
        if (res.ok) {
          const data = await res.json();
          setAddresses(data);
          const defaultAddr = data.find((a: Address) => a.isDefault);
          if (defaultAddr) setSelectedAddressId(defaultAddr.id);
          else if (data.length > 0) setSelectedAddressId(data[0].id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, []);

  const handleOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Zəhmət olmasa çatdırılma ünvanını seçin");
      return;
    }

    const selectedAddr = addresses.find(a => a.id === selectedAddressId);
    const fullAddress = selectedAddr ? `${selectedAddr.addressLine}, ${selectedAddr.city}` : "";

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          address: fullAddress,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sifariş yaradılarkən xəta baş verdi");
      }

      toast.success("Sifariş uğurla yaradıldı!");
      router.push(`/orders/${data.orderId}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-4">
        <div className="flex items-center justify-between text-gray-300 mb-2">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-green-500" />
            <h3 className="font-medium">Çatdırılma Ünvanı</h3>
          </div>
          <Link href="/profile" className="text-xs text-green-500 hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Yeni
          </Link>
        </div>
        
        {loadingAddresses ? (
          <div className="text-sm text-gray-500">Ünvanlar yüklənir...</div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400 mb-2">Qeyd edilmiş ünvan yoxdur.</p>
            <Link href="/profile" className="text-green-500 text-sm font-medium hover:underline">
              + Ünvan əlavə et
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr) => (
              <div 
                key={addr.id}
                onClick={() => setSelectedAddressId(addr.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  selectedAddressId === addr.id 
                    ? "bg-green-900/20 border-green-500/50" 
                    : "bg-gray-950 border-gray-800 hover:border-gray-700"
                }`}
              >
                <div>
                  <div className="font-medium text-sm text-gray-200">{addr.title}</div>
                  <div className="text-xs text-gray-500">{addr.addressLine}, {addr.city}</div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedAddressId === addr.id ? "border-green-500 bg-green-500" : "border-gray-600"
                }`}>
                  {selectedAddressId === addr.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-4">
        <div className="flex items-center gap-3 text-gray-300 mb-2">
          <CreditCard className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium">Ödəniş Üsulu</h3>
        </div>
        <div className="p-3 border border-green-500/30 bg-green-500/10 rounded-lg flex justify-between items-center">
          <span className="text-sm font-medium text-green-400">Bank Kartı (Demo)</span>
          <div className="w-4 h-4 rounded-full border-4 border-green-500"></div>
        </div>
        <p className="text-xs text-gray-500">
          Bu demo versiyadır. Kart məlumatı tələb olunmur. Balansınızdan (əgər varsa) və ya virtual kartdan çıxılacaq.
        </p>
      </div>

      <button
        onClick={handleOrder}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Emal edilir...
          </>
        ) : (
          <>
            Ödənişi Təsdiqlə ({listing.price} ₼)
          </>
        )}
      </button>
    </div>
  );
}