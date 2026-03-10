import {config} from "@/config"
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

interface BetterAuthVerifyEmailProps {
	username: string
	verifyLink: string
}

export const VerifyEmail = ({
	username,
	verifyLink,
}: BetterAuthVerifyEmailProps) => {
	const previewText = `Verify your email address`
	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind>
				<Body className="bg-white my-auto mx-auto font-sans px-2">
					<Container className="border border-solid border-[#eaeaea] rounded my-10 mx-auto p-5 max-w-116.25">
						<Heading className="text-black text-[24px] font-normal text-center p-0 my-7.5 mx-0">
							Verify your <strong>Email</strong> account
						</Heading>
						<Text className="text-black text-[14px] leading-6">
							Hello {username},
						</Text>
						<Text className="text-black text-[14px] leading-6">
							Welcome to {config.TITLE}! Please verify your email
							address to activate your account. If you
							didn&lsquo;t create this account, you can safely
							ignore this email.
						</Text>
						<Section className="text-center mt-8 mb-8">
							<Button
								className="bg-[#000000] rounded-xl text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
								href={verifyLink}
							>
								Verify Email
							</Button>
						</Section>
						<Text className="text-black text-[14px] leading-6">
							Or copy and paste this URL into your browser:{" "}
							<Link
								href={verifyLink}
								className="text-blue-600 no-underline"
							>
								{verifyLink}
							</Link>
						</Text>
						<Hr className="border border-solid border-[#eaeaea] my-6.5 mx-0 w-full" />
						<Text className="text-[#666666] text-[12px] leading-6">
							If you didn&lsquo;t create this account, please
							ignore this email or contact support if you have
							concerns.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	)
}

export const VerifyEmailHTML = async ({
	username,
	verifyLink,
}: BetterAuthVerifyEmailProps) => {
	return await render(
		<VerifyEmail
			username={username}
			verifyLink={verifyLink}
		/>
	)
}
