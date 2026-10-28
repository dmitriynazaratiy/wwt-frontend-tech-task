import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'

export const App = () => {
	const { t } = useTranslation('filter')
	const [isOpen, setIsOpen] = useState(false)
	return (
		<main className="relative flex min-h-dvh flex-col items-center justify-center gap-8 bg-white p-6 text-center text-grey-500">
			{/*
				Demo only, not part of the design. The page is otherwise plain white,
				so this coloured element is the only way to see the modal backdrop's
				frosted-glass blur.
			*/}
			<div className="absolute top-4 left-4 rounded-2xl bg-brand-200 px-4 py-2 text-body-5 text-white">
				{t('demoElement')}
			</div>
			<h1 className="text-headline-4 md:text-headline-1">{t('pageTitle')}</h1>
			<Button
				size="responsive"
				onClick={() => setIsOpen(true)}
			>
				{t('open')}
			</Button>
			<Modal
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				title={t('title')}
				closeLabel={t('close')}
			>
				<p className="text-left text-body-6 text-grey-300">
					{t('placeholder')}
				</p>
			</Modal>
		</main>
	)
}
