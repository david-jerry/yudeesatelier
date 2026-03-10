// app/checkout/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { useCartStore } from "@/hooks/useZustand" // client component only
import OrderSummary from "./_components/OrderSummary"
import CheckoutForm from "./_components/CheckoutForm"

export default async function CheckoutPage() {


	return (
		<div className="container px-6 pt-24 pb-12 mx-auto">
			<h1 className="text-3xl font-serif tracking-wide">Checkout</h1>
			<div className="mt-10 grid md:grid-cols-5 gap-10">
				<div className="md:col-span-3">
					<CheckoutForm />
				</div>
				<div className="md:col-span-2">
					<OrderSummary />
				</div>
			</div>
		</div>
	)
}
