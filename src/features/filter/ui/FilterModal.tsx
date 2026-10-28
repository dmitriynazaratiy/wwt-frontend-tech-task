import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FilterItem } from '@shared/api/types/Filter'
import { Checkbox } from '@shared/ui/Checkbox'
import { Divider } from '@shared/ui/Divider'
import { LinkButton } from '@shared/ui/LinkButton'
import { Modal, ModalApplyButton } from '@shared/ui/Modal'

import { useFilterItems } from '../api/useFilterItems'
import { useFilterStore } from '../model/filterStore'
import {
	FilterSelection,
	toSearchRequest,
	toSelection,
	toggleOption
} from '../model/selection'

export interface FilterModalProps {
	isOpen: boolean
	onClose: () => void
}

interface FilterSectionProps {
	item: FilterItem
	selection: FilterSelection
	onToggle: (optionId: string, isChecked: boolean) => void
}

// Figma fills three columns top to bottom, which multi-column layout does on
// its own. Columns have no row gap, so each option carries its 16px spacing
// and the container cancels the last one.
const FilterSection = ({ item, selection, onToggle }: FilterSectionProps) => {
	const ticked = selection[item.id] ?? []
	return (
		<div className="py-8">
			<fieldset>
				<legend className="mb-6 text-headline-5">{item.name}</legend>
				<div className="flex flex-col gap-4 md:-mb-4 md:block md:columns-3 md:gap-x-8">
					{item.options.map(option => (
						<div
							key={option.id}
							className="flex md:break-inside-avoid md:pb-4"
						>
							<Checkbox
								label={option.name}
								description={option.description}
								checked={ticked.includes(option.id)}
								onChange={event => onToggle(option.id, event.target.checked)}
							/>
						</div>
					))}
				</div>
			</fieldset>
		</div>
	)
}

/**
 * Filter modal with its confirmation dialog. Edits a draft copied from the
 * applied filters on every open; the store changes only when the user
 * confirms "Apply new filter".
 */
export const FilterModal = ({ isOpen, onClose }: FilterModalProps) => {
	const { t } = useTranslation('filter')
	const { data: items, isPending, isError } = useFilterItems()
	const appliedFilters = useFilterStore(state => state.appliedFilters)
	const applyFilters = useFilterStore(state => state.applyFilters)
	const [selection, setSelection] = useState<FilterSelection>({})
	const [isConfirmOpen, setIsConfirmOpen] = useState(false)
	const [wasOpen, setWasOpen] = useState(isOpen)

	// Pre-fill on every open and drop the confirmation on every close
	if (isOpen !== wasOpen) {
		setWasOpen(isOpen)
		if (isOpen) {
			setSelection(toSelection(appliedFilters))
		} else {
			setIsConfirmOpen(false)
		}
	}

	const footer = (
		<div className="flex w-full flex-col items-center gap-4 md:grid md:grid-cols-footer">
			<ModalApplyButton
				className="w-55 md:col-start-2 md:w-auto"
				onClick={() => {
					setIsConfirmOpen(true)
					return false
				}}
				disabled={!items}
			/>
			<LinkButton
				className="md:justify-self-end"
				onClick={() => setSelection({})}
			>
				{t('clearAll')}
			</LinkButton>
		</div>
	)

	return (
		<>
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				title={t('title')}
				closeLabel={t('close')}
				footer={footer}
			>
				{isPending && (
					<p className="py-8 text-body-6 text-grey-300">{t('loading')}</p>
				)}
				{isError && (
					<p className="py-8 text-body-6 text-brand-300">{t('loadError')}</p>
				)}
				{/* The modal's header and footer dividers frame the groups; only
				    the gaps between groups need their own divider */}
				{items?.map((item, index) => (
					<div key={item.id}>
						{index > 0 && <Divider />}
						<FilterSection
							item={item}
							selection={selection}
							onToggle={(optionId, isChecked) =>
								setSelection(current =>
									toggleOption(current, item.id, optionId, isChecked)
								)
							}
						/>
					</div>
				))}
			</Modal>
			<Modal
				isOpen={isConfirmOpen}
				onClose={() => setIsConfirmOpen(false)}
				title={t('confirmTitle')}
				variant="compact"
				applyLabel={t('applyNewFilter')}
				cancelLabel={t('useOldFilter')}
				onApply={() => {
					applyFilters(toSearchRequest(items ?? [], selection))
					onClose()
				}}
				onCancel={onClose}
			>
				<div className="h-8 md:h-confirm-gap" />
			</Modal>
		</>
	)
}
