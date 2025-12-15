"use client";

import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CartButton({ listingId, className }: { listingId: string, className?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation if inside a link
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        body: JSON.stringify({ listingId }),
      });
      if (res.ok) {
        router.refresh();
        alert("Səbətə əlavə olundu!");
      } else if (res.status === 401) {
        router.push("/sign-in");
      } else {
        const data = await res.json();
        alert(data.message || "Xəta baş verdi");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={addToCart}
      disabled={loading}
      className={`flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-xl transition-colors disabled:opacity-50 font-bold border border-gray-700 ${className}`}
    >
      <ShoppingCart className="w-5 h-5" />
      {loading ? "..." : "Səbət"}
    </button>
  );
}
