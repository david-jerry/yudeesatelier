import { config } from "@/config"
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Text,
	Tailwind,
	Section,
	render,
} from "@react-email/components"

export interface BetterAuthResetPasswordEmailProps {
	username?: string
	token?: string
}

export const ResetPasswordEmail = ({
	username,
	token,
}: BetterAuthResetPasswordEmailProps) => {
	const previewText = `Reset your password`
	return (
		<Html>
			<Head />
			<Preview> {previewText} </Preview>
			<Tailwind>
				<Body className="bg-white my-auto mx-auto font-sans px-2">
					<Container className="border border-solid border-[#eaeaea] rounded my-10 mx-auto p-5 max-w-116.25">
						<Heading className="text-black text-[24px] font-normal text-center p-0 my-7.5 mx-0">
							Reset your <strong> {config.TITLE} </strong>{" "}
							password
						</Heading>
						<Text className="text-black text-[14px] leading-6">
							Hello {username},
						</Text>
						<Text className="text-black text-[14px] leading-6">
							We received a request to reset your password for
							your {config.TITLE} account.If you didn&apos;t make
							this request, you can safely ignore this email.
						</Text>

						<Section className="text-center mt-8 mb-8">
							<Button
								className="bg-[#000000] rounded-xl text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
								href={`${config.BASE_URL}/auth/password-reset?token=${token}`}
							>
								Reset Password
							</Button>
						</Section>
						<Text className="text-black text-[14px] leading-6">
							Or copy and paste this URL into your browser:{" "}
							<Link
								href={`${config.BASE_URL}/auth/password-reset?token=${token}`}
								className="text-blue-600 no-underline"
							>
								{`${config.BASE_URL}/auth/password-reset?token=${token}`}
							</Link>
						</Text>
						<Hr className="border border-solid border-[#eaeaea] my-6.5 mx-0 w-full" />
						<Text className="text-[#666666] text-[12px] leading-6">
							If you didn&apos;t request a password reset, please
							ignore this email or contact support if you have
							concerns.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	)
}

export const ResetPasswordEmailHTML = async ({
	username,
	token,
}: BetterAuthResetPasswordEmailProps) => {
	return await render(
		<ResetPasswordEmail
			username={username}
			token={token}
		/>
	)
}
