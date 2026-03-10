import React from 'react'
import { Header } from '../_components/Header'
import { Footer } from '../_components/Footer'

export default function StoreLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<>
			<Header />
            {children}
			<Footer />
		</>
	)
}
