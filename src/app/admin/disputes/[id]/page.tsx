import { db } from "@/db";
import { disputes, orders, listings, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveDispute } from "@/app/actions/admin-dispute";

export default async function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const dispute = await db
    .select({
      id: disputes.id,
      reason: disputes.reason,
      videoProofUrl: disputes.videoProofUrl,
      status: disputes.status,
      createdAt: disputes.createdAt,
      orderId: orders.id,
      amount: orders.amount,
      buyerName: user.name,
      buyerEmail: user.email,
      listingModel: listings.modelName,
      listingPrice: listings.price,
      sellerId: listings.sellerId,
    })
    .from(disputes)
    .innerJoin(orders, eq(disputes.orderId, orders.id))
    .innerJoin(listings, eq(orders.listingId, listings.id))
    .innerJoin(user, eq(orders.buyerId, user.id))
    .where(eq(disputes.id, id))
    .limit(1)
    .then((res) => res[0]);

  if (!dispute) {
    return <div>Dispute not found</div>;
  }

  // Fetch seller details separately since we joined on buyer
  const seller = await db.query.user.findFirst({
    where: eq(user.id, dispute.sellerId),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Dispute Details
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Order #{dispute.orderId}
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {dispute.status}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Buyer</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {dispute.buyerName} ({dispute.buyerEmail})
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Seller</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {seller?.name} ({seller?.email})
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Item</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {dispute.listingModel} - ${(dispute.amount / 100).toFixed(2)}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Reason</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {dispute.reason}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Proof</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {dispute.videoProofUrl ? (
                  <div className="mt-2">
                    <video controls className="max-w-full h-auto max-h-96">
                      <source src={dispute.videoProofUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    <p className="mt-2 text-xs text-gray-500">
                      URL: <a href={dispute.videoProofUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">{dispute.videoProofUrl}</a>
                    </p>
                  </div>
                ) : (
                  "No video proof provided"
                )}
              </dd>
            </div>
          </dl>
        </div>
        
        {dispute.status === "open" && (
          <div className="px-4 py-5 sm:px-6 flex gap-4 justify-end bg-gray-50 border-t border-gray-200">
            <form action={resolveDispute.bind(null, dispute.id, "refund")}>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Refund Buyer
              </button>
            </form>
            <form action={resolveDispute.bind(null, dispute.id, "payout")}>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Release to Seller
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
