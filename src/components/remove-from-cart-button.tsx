"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RemoveFromCartButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const remove = async () => {
    if (!confirm("Silmək istədiyinizə əminsiniz?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cart/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={remove} 
      disabled={loading}
      className="text-gray-500 hover:text-red-500 transition-colors p-1"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
