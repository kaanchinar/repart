import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { listings, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import ProfileForm from "./profile-form";
import AddressManager from "./address-manager";
import SecuritySettings from "./security-settings";
import Link from "next/link";
import { formatAZN } from "@/lib/validators";
import { ArrowRight, Package, ShoppingBag, Sparkles, Star, CircleUserRound } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const myListings = await db
    .select()
    .from(listings)
    .where(eq(listings.sellerId, session.user.id))
    .orderBy(desc(listings.createdAt));

  const myOrders = await db
    .select({
      id: orders.id,
      amount: orders.amount,
      status: orders.escrowStatus,
      createdAt: orders.createdAt,
      listingModel: listings.modelName,
    })
    .from(orders)
    .innerJoin(listings, eq(orders.listingId, listings.id))
    .where(eq(orders.buyerId, session.user.id))
    .orderBy(desc(orders.createdAt));

  const mySales = await db
    .select({
      id: orders.id,
      amount: orders.amount,
      status: orders.escrowStatus,
      createdAt: orders.createdAt,
      listingModel: listings.modelName,
    })
    .from(orders)
    .innerJoin(listings, eq(orders.listingId, listings.id))
    .where(eq(orders.sellerId, session.user.id))
    .orderBy(desc(orders.createdAt));

  const totalSpend = myOrders.reduce((sum, order) => sum + order.amount, 0);
  const totalEarned = mySales.reduce((sum, sale) => sum + sale.amount, 0);
  const activeListings = myListings.filter((item) => item.status === "active").length;
  const disputes = mySales.filter((sale) => sale.status === "disputed").length;

  const statCards = [
    { label: "Aktiv elan", value: activeListings.toString(), accent: "text-emerald-200" },
    { label: "Alış xərci", value: formatAZN(totalSpend), accent: "text-sky-200" },
    { label: "Satış gəliri", value: formatAZN(totalEarned), accent: "text-indigo-200" },
    { label: "Mübahisələr", value: disputes.toString(), accent: disputes ? "text-amber-200" : "text-slate-300" },
  ];
  return (
    <div className="min-h-screen bg-[#060910] text-slate-100">

      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#04050a]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <CircleUserRound className="h-6 w-6 text-emerald-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Profil paneli</p>
              <h1 className="text-lg font-semibold text-white">{session.user.name}</h1>
            </div>
          </div>
          <Link
            href="/sell"
            className="group inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500"
          >
            Yeni elan yarat
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-8 px-6 pb-24 pt-10">
        <section className="rounded-3xl border border-slate-800 bg-[#0b0f18] p-8 shadow-[0_25px_60px_rgba(3,6,12,0.45)]">
          <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-[#0f1424] px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
                <Sparkles className="h-3 w-3 text-slate-200" />
                Repart hesabı
              </span>
              <div>
                <p className="text-sm text-slate-300">Xoş gəldiniz</p>
                <h2 className="mt-1 text-3xl font-semibold text-white">{session.user.name}</h2>
                <p className="text-sm text-slate-400">
                  {session.user.email}
                  {session.user.phoneNumber ? ` · ${session.user.phoneNumber}` : ""}
                </p>
              </div>
              <p className="max-w-2xl text-sm text-slate-400">
                Hesabınızı və təhlükəsizlik seçimlərinizi bir paneldən idarə edin. Şəxsi məlumatlarınızı yeniləyin, əsas
                ünvanları saxlayın və passkey/2FA ilə girişinizi qoruyun.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0f1424] p-4">
              <div className="rounded-2xl border border-slate-800 bg-[#11172a] p-5">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                  Hesab səviyyəsi
                  <Star className="h-4 w-4 text-slate-200" />
                </div>
                <p className="mt-3 text-3xl font-semibold text-white">Trusted Seller</p>
                <p className="text-sm text-slate-400">Passkey + 2FA dəstəyi</p>
                <div className="mt-5 h-2 rounded-full bg-slate-800">
                  <div className="h-full w-4/5 rounded-full bg-slate-200" />
                </div>
                <p className="mt-2 text-xs text-slate-500">Növbəti mərhələ: Pro Satıcı</p>
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-800 bg-[#0f1424] p-4 transition hover:border-slate-600"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
                <p className={`mt-3 text-2xl font-semibold ${card.accent}`}>{card.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[2fr_1.1fr]">
          <div className="space-y-6">
            <ProfileForm />
            <SecuritySettings />
          </div>
          <div className="space-y-6">
            <AddressManager />
            <div className="rounded-3xl border border-slate-800 bg-[#0f1424] p-6 shadow-lg">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Tez əməllər</p>
              <h3 className="mt-3 text-xl font-semibold text-white">Yeni cihaz sat?</h3>
              <p className="text-sm text-slate-400">
                Fault Tree sihirbazını aç, cihazı qiymətləndir və 60 saniyəyə elan dərc et.
              </p>
              <Link
                href="/sell"
                className="mt-6 flex items-center justify-between rounded-2xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-slate-500"
              >
                Elan sihirbazını aç
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <OrderList
            title="Sifarişlərim"
            description="Aldığınız cihazların statusu"
            iconColor="text-sky-400"
            data={myOrders}
            empty="Hələ heç nə almamısınız."
          />
          <OrderList
            title="Satışlarım"
            description="Gələn sifarişləri izləyin"
            iconColor="text-violet-400"
            data={mySales}
            empty="Hələ satışınız yoxdur."
            highlightGain
          />
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Aktiv elanlar</p>
              <h2 className="text-xl font-semibold text-white">Elanlarım</h2>
            </div>
          </div>
          {myListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-sm text-slate-400">
              Hələ heç nə satmamısınız.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {myListings.map((item) => (
                <Link key={item.id} href={`/listings/${item.id}`} className="group">
                  <div className="rounded-2xl border border-slate-800 bg-[#11172a] p-5 transition hover:border-slate-600">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-400">{item.imeiMasked}</p>
                        <p className="text-lg font-semibold text-white">{item.modelName}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "active"
                            ? "bg-emerald-900/30 text-emerald-100"
                            : item.status === "sold"
                              ? "bg-slate-800 text-slate-200"
                              : "bg-amber-900/30 text-amber-100"
                        }`}
                      >
                        {item.status === "active" ? "Satışda" : item.status === "sold" ? "Satılıb" : "Qaralama"}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                      <span>Qiymət</span>
                      <span className="text-lg font-semibold text-white">{formatAZN(item.price)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

type OrderPreview = {
  id: string;
  amount: number;
  status: string;
  createdAt: Date | string;
  listingModel: string;
};

function statusBadge(status: string, highlightGain?: boolean) {
  const map = {
    held: "bg-slate-800 text-slate-200",
    released: "bg-emerald-900/40 text-emerald-100",
    refunded: "bg-rose-900/30 text-rose-200",
    disputed: "bg-amber-900/30 text-amber-100",
  } as Record<string, string>;

  if (status === "released" && highlightGain) {
    return "bg-emerald-900/40 text-emerald-100 border border-emerald-800";
  }

  return map[status] ?? "bg-slate-700 text-slate-200";
}

function statusLabel(status: string, highlightGain?: boolean) {
  if (highlightGain && status === "released") return "Ödənildi";
  switch (status) {
    case "held":
      return "Gözləmədə";
    case "released":
      return "Tamamlandı";
    case "refunded":
      return "Qaytarıldı";
    case "disputed":
      return "Mübahisəli";
    default:
      return "Status";
  }
}

function OrderList({
  title,
  description,
  iconColor,
  data,
  empty,
  highlightGain,
}: {
  title: string;
  description: string;
  iconColor: string;
  data: OrderPreview[];
  empty: string;
  highlightGain?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0b0f18] p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{description}</p>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <ShoppingBag className={`h-5 w-5 ${iconColor}`} />
      </div>
      {data.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="mt-4 space-y-4">
          {data.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="block">
              <div className="rounded-2xl border border-slate-800 bg-[#11172a] p-4 transition hover:border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="text-base font-semibold text-white">{order.listingModel}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${highlightGain ? "text-emerald-300" : "text-sky-200"}`}>
                      {highlightGain ? "+" : ""}
                      {formatAZN(order.amount)}
                    </p>
                    <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(order.status, highlightGain)}`}>
                      {statusLabel(order.status, highlightGain)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
