import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FilterModal, useFilterStore } from '@features/filter'
import { Button } from '@shared/ui/Button'

export const App = () => {
	const { t } = useTranslation('filter')
	const [isOpen, setIsOpen] = useState(false)
	const appliedFilters = useFilterStore(state => state.appliedFilters)
	const selectedFiltersId = useId()
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
			<section
				aria-labelledby={selectedFiltersId}
				className="w-full max-w-modal text-left"
			>
				<h2
					id={selectedFiltersId}
					className="text-headline-5"
				>
					{t('selectedFilters')}
				</h2>
				<pre className="mt-4 overflow-x-auto rounded-2xl bg-grey-100 p-4 text-body-7">
					{JSON.stringify(appliedFilters, null, 2)}
				</pre>
			</section>
			<FilterModal
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
			/>
		</main>
	)
}
