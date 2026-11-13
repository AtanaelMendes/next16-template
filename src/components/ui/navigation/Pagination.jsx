import { cn } from '@/assets/utils'
import {
	faChevronLeft,
	faChevronRight,
	faAngleDoubleLeft,
	faAngleDoubleRight,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState, useEffect } from 'react'

const buttonBase = 'inline-flex items-center justify-center border border-border bg-surface text-content-secondary transition-colors hover:bg-hover hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:z-10 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-disabled disabled:text-disabled-content'

export const Pagination = ({
	data,
	itemsPerPage = 50,
	callBackChangePage,
	showPaginator = false,
	showItemCountSelector = false,
	size = 'md',
}) => {
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPageState, setItemsPerPageState] = useState(itemsPerPage)
	const [totalPages, setTotalPages] = useState(Math.ceil(data.length / itemsPerPageState))
	const pageRange = 5

	useEffect(() => {
		setTotalPages(Math.ceil(data.length / itemsPerPageState))
		setCurrentPage(1)
		callBackChangePage?.(data.length > 0 ? data.slice(0, itemsPerPageState) : [])
	}, [data, itemsPerPageState, callBackChangePage])

	const handleClick = page => {
		setCurrentPage(page)
		const startIndex = (page - 1) * itemsPerPageState
		const endIndex = startIndex + itemsPerPageState
		callBackChangePage?.(data.slice(startIndex, endIndex))
	}

	const getSizeClasses = () => {
		switch (size) {
			case 'sm':
				return 'h-6 px-2 text-xs'
			case 'lg':
				return 'h-12 px-4 text-lg'
			default:
				return 'h-9 px-3 text-sm'
		}
	}

	const getIconSize = () => {
		switch (size) {
			case 'sm':
				return 8
			case 'lg':
				return 16
			default:
				return 12
		}
	}

	const getPageNumbers = () => {
		const startPage = Math.max(1, currentPage - Math.floor(pageRange / 2))
		const endPage = Math.min(totalPages, startPage + pageRange - 1)
		return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
	}

	return (
		<>
			{(showPaginator || showItemCountSelector) && (
				<div className='flex flex-wrap gap-2 justify-between items-center mb-4'>
					{showPaginator && (
						<span className='text-sm text-content-secondary'>
							Mostrando {itemsPerPageState * (currentPage - 1) + 1} a{' '}
							{Math.min(itemsPerPageState * currentPage, data.length)} de {data.length} itens
						</span>
					)}
					{showItemCountSelector && (
						<div className='flex items-center'>
							<label
								htmlFor='itemsPerPage'
								className='text-sm text-content-secondary mr-2'
							>
								Itens por página:
							</label>
							<select
								id='itemsPerPage'
								value={itemsPerPageState}
								onChange={event => setItemsPerPageState(Number(event.target.value))}
								className='border border-input-border bg-input text-content rounded-md p-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-focus'
							>
								{[10, 20, 50, 100].map(size => (
									<option key={size} value={size}>
										{size}
									</option>
								))}
							</select>
						</div>
					)}
				</div>
			)}
			{totalPages > 1 && (
				<nav aria-label='Paginação'>
					<ul className='inline-flex -space-x-px'>
						{currentPage > 1 && (
							<>
								<li>
									<button
										type='button'
										onClick={() => handleClick(1)}
										aria-label='Primeira página'
										className={cn(buttonBase, 'rounded-s-lg', getSizeClasses())}
									>
										<FontAwesomeIcon
											icon={faAngleDoubleLeft}
											width={getIconSize()}
											height={getIconSize()}
										/>
									</button>
								</li>
								<li>
									<button
										type='button'
										onClick={() => handleClick(currentPage - 1)}
										aria-label='Página anterior'
										className={cn(buttonBase, getSizeClasses())}
									>
										<FontAwesomeIcon
											icon={faChevronLeft}
											width={getIconSize()}
											height={getIconSize()}
										/>
									</button>
								</li>
							</>
						)}
						{getPageNumbers().map(page => (
							<li key={page}>
								<button
									type='button'
									onClick={() => handleClick(page)}
									aria-label={`Página ${page}`}
									aria-current={currentPage === page ? 'page' : undefined}
									className={cn(
										buttonBase,
										getSizeClasses(),
										currentPage === page
											? 'bg-selected text-selected-content font-semibold border-primary'
											: ''
									)}
								>
									{page}
								</button>
							</li>
						))}
						{currentPage < totalPages && (
							<>
								<li>
									<button
										type='button'
										onClick={() => handleClick(currentPage + 1)}
										aria-label='Próxima página'
										className={cn(buttonBase, getSizeClasses())}
									>
										<FontAwesomeIcon
											icon={faChevronRight}
											width={getIconSize()}
											height={getIconSize()}
										/>
									</button>
								</li>
								<li>
									<button
										type='button'
										onClick={() => handleClick(totalPages)}
										aria-label='Última página'
										className={cn(buttonBase, 'rounded-e-lg', getSizeClasses())}
									>
										<FontAwesomeIcon
											icon={faAngleDoubleRight}
											width={getIconSize()}
											height={getIconSize()}
										/>
									</button>
								</li>
							</>
						)}
					</ul>
				</nav>
			)}
		</>
	)
}
