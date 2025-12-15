"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Truck, CheckCircle2, AlertOctagon } from "lucide-react";

export default function OrderActions({ order, isBuyer, isSeller }: { order: any, isBuyer: boolean, isSeller: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [trackingCode, setTrackingCode] = useState(order.cargoTrackingCode || "");

  const handleAction = async (action: string, payload: any = {}) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Əməliyyat uğurla yerinə yetirildi");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (order.escrowStatus === 'released') {
    return (
      <div className="bg-green-900/20 border border-green-900/50 p-4 rounded-xl text-center">
        <p className="text-green-400 font-medium">Bu sifariş uğurla tamamlanıb.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Seller Actions */}
      {isSeller && (
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-500" />
            Çatdırılma Məlumatı
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="İzləmə kodu (Tracking ID)"
              className="flex-1 bg-gray-950 border border-gray-800 rounded-lg p-2 text-sm"
              disabled={!!order.cargoTrackingCode}
            />
            {!order.cargoTrackingCode && (
              <button
                onClick={() => handleAction('add_tracking', { trackingCode })}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {trackingCode ? "Yadda saxla" : "Avto-Kod"}
              </button>
            )}
          </div>
          {order.cargoTrackingCode && (
            <p className="text-xs text-green-500">İzləmə kodu əlavə edilib.</p>
          )}
        </div>
      )}

      {/* Buyer Actions */}
      {isBuyer && (
        <div className="space-y-3">
          {order.cargoTrackingCode && (
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-blue-500" />
                Kargo İzləmə Kodu
              </h3>
              <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 font-mono text-lg tracking-wider text-center select-all">
                {order.cargoTrackingCode}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Kargo şirkətinin saytında bu kodla izləyə bilərsiniz.
              </p>
            </div>
          )}

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
            <h3 className="font-medium mb-2">Məhsulu təhvil aldınız?</h3>
            <p className="text-xs text-gray-400 mb-4">
              Məhsulu yoxladıqdan sonra təsdiqləyin. Təsdiqlədikdən sonra vəsait satıcıya köçürüləcək.
            </p>
            <button
              onClick={() => handleAction('confirm_delivery')}
              disabled={loading || order.escrowStatus !== 'held'}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              Bəli, Təhvil Aldım
            </button>
          </div>

          <button
            onClick={() => router.push(`/orders/${order.id}/dispute`)}
            className="w-full bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-900/50 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <AlertOctagon className="w-4 h-4" />
            Problem var (Mübahisə aç)
          </button>
        </div>
      )}
    </div>
  );
}