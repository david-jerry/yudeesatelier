import { config } from "@/config"
import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Text,
	Link, // Added Link component
	Tailwind,
	render,
} from "@react-email/components"

interface ContactEmailProps {
	name: string
	email: string
	message: string
	howYouFoundUs?:
		| "search_engine"
		| "social_media"
		| "friend_or_colleague"
		| "advertisement"
		| "other"
	subscribeToNewsletter?: boolean
}

export const ContactEmail = ({
	name,
	email,
	message,
	howYouFoundUs,
	subscribeToNewsletter,
}: ContactEmailProps) => {
	const previewText = `New message from ${name}`

	// Construct the unsubscribe URL
	// Ensure NEXT_PUBLIC_APP_URL is defined in your config (e.g., https://yourdomain.com)
	const unsubscribeUrl = `${config.NEXT_PUBLIC_DOMAIN}/contact/unsubscribe?email=${encodeURIComponent(email)}`

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind>
				<Body className="bg-white my-auto mx-auto font-sans px-2">
					<Container className="border border-solid border-[#eaeaea] rounded my-10 mx-auto p-5 max-w-137.5">
						<Heading className="text-black text-[24px] font-bold text-left p-0 my-5 mx-0">
							New Contact Inquiry
						</Heading>

						<Section className="mb-4">
							<Text className="text-black text-[14px] leading-6">
								<strong>From:</strong> {name} ({email})
							</Text>
							<Hr className="border border-solid border-[#eaeaea] my-4 mx-0 w-full" />
						</Section>

						<Section>
							<Text className="text-black text-[14px] font-semibold mb-2">
								Message:
							</Text>
							<div
								className="prose prose-sm max-w-none text-[14px] leading-6 text-gray-700 bg-[#f9f9f9] p-4 rounded-md border border-gray-100"
								dangerouslySetInnerHTML={{ __html: message }}
							/>
						</Section>

						<Hr className="border border-solid border-[#eaeaea] my-6 mx-0 w-full" />

						<Section>
							<div className="flex flex-col gap-1">
								<Text className="text-[#666666] text-[12px] leading-5 m-0">
									<strong>Source:</strong>{" "}
									{howYouFoundUs?.replace(/_/g, " ") ||
										"Not specified"}
								</Text>
								<Text className="text-[#666666] text-[12px] leading-5 m-0">
									<strong>Newsletter Subscription:</strong>{" "}
									{subscribeToNewsletter ? "✅ Yes" : "❌ No"}
								</Text>
							</div>
						</Section>

						{/* --- Footer / Unsubscribe Section --- */}
						<Section className="mt-8 text-center">
							<Text className="text-[#999999] text-[11px] uppercase tracking-wider mb-2">
								Sent via {config.TITLE} Contact System
							</Text>

							<Text className="text-[#999999] text-[11px]">
								No longer wish to receive these emails?{" "}
								<Link
									href={unsubscribeUrl}
									className="text-blue-600 underline"
								>
									Unsubscribe here
								</Link>
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	)
}

export const ContactEmailHTML = async (props: ContactEmailProps) => {
	return await render(<ContactEmail {...props} />)
}
