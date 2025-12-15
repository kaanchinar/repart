"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DisputePage() {
  const params = useParams();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setLoading(true);
    try {
      let proofUrl = "";

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          proofUrl = data.url;
        }
      }

      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: params.id,
          reason,
          videoProofUrl: proofUrl
        }),
      });

      if (!res.ok) throw new Error("Xəta baş verdi");

      toast.success("Mübahisə açıldı. Adminlər tezliklə baxəcaq.");
      router.push(`/orders/${params.id}`);
    } catch (error) {
      toast.error("Mübahisə açmaq mümkün olmadı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <header className="mb-6 flex items-center gap-4">
        <Link href={`/orders/${params.id}`} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-red-500 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          Problem Bildir
        </h1>
      </header>

      <main className="max-w-md mx-auto bg-gray-900 p-6 rounded-xl border border-gray-800">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Problemin Təsviri
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-red-500 outline-none"
              placeholder="Məhsul təsvirə uyğun deyil, çünki..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sübut (Şəkil/Video)
            </label>
            <div className="border-2 border-dashed border-gray-800 rounded-lg p-6 text-center hover:border-gray-700 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept="image/*,video/*" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {file ? file.name : "Fayl seçin və ya bura atın"}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Mübahisə Aç"}
          </button>
        </form>
      </main>
    </div>
  );
}
