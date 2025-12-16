"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
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
      console.error("Failed to create address", error);
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
      console.error("Failed to delete address", error);
      toast.error("Xəta baş verdi");
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-[#0b0f18] p-6 shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Çatdırılma ünvanları</p>
          <h2 className="text-xl font-semibold text-white">Ünvan kitabçam</h2>
          <p className="text-sm text-slate-400">Çatdırılma üçün tez-tez istifadə etdiyiniz məkanları saxlayın</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500"
        >
          <Plus className="h-4 w-4" />
          Yeni ünvan
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 rounded-2xl border border-slate-800 bg-[#11172a] p-5 text-sm text-slate-300"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span>Başlıq</span>
              <input
                required
                value={newAddress.title}
                onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-[#0b0f18] px-3 py-2 text-white focus:border-slate-500 focus:outline-none"
                placeholder="Ev / Ofis"
              />
            </label>
            <label className="space-y-2">
              <span>Şəhər</span>
              <select
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-[#0b0f18] px-3 py-2 text-white focus:border-slate-500 focus:outline-none"
              >
                <option value="Baku">Bakı</option>
                <option value="Sumqayit">Sumqayıt</option>
                <option value="Ganja">Gəncə</option>
              </select>
            </label>
          </div>
          <label className="space-y-2">
            <span>Ünvan xətti</span>
            <input
              required
              value={newAddress.addressLine}
              onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-[#0b0f18] px-3 py-2 text-white focus:border-slate-500 focus:outline-none"
              placeholder="Nizami küç. 12, mənzil 45"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <label className="space-y-2">
              <span>Poçt kodu</span>
              <input
                value={newAddress.zipCode ?? ""}
                onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-[#0b0f18] px-3 py-2 text-white focus:border-slate-500 focus:outline-none"
                placeholder="AZ1000"
              />
            </label>
            <label className="mt-5 flex items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={newAddress.isDefault}
                onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-slate-600 bg-[#0b0f18] text-slate-100 focus:ring-slate-500"
              />
              Əsas ünvan kimi qeyd et
            </label>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
            >
              Ləğv et
            </button>
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900"
            >
              Yadda saxla
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 grid gap-4">
        {loading ? (
          <p className="text-sm text-slate-500">Yüklənir...</p>
        ) : addresses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-sm text-slate-500">
            Hələ ünvan əlavə edilməyib.
          </div>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr.id}
              className="group flex items-start justify-between rounded-2xl border border-slate-800 bg-[#11172a] p-4 transition hover:border-slate-600"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{addr.title}</span>
                  {addr.isDefault && (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200">
                      Əsas
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {addr.addressLine}, {addr.city} {addr.zipCode}
                </p>
              </div>
              <button
                onClick={() => handleDelete(addr.id)}
                className="rounded-full border border-transparent p-2 text-slate-500 opacity-0 transition group-hover:border-slate-500 group-hover:text-white group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
