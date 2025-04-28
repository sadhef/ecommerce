import { motion } from "framer-motion";
import { Trash, Star } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import LoadingSpinner from "../components/LoadingSpinner";

const ProductsList = () => {
	const { deleteProduct, toggleFeaturedProduct, products, loading, error } = useProductStore();

	// Handle loading state
	if (loading) {
		return (
			<div className="flex justify-center items-center p-8">
				<LoadingSpinner />
			</div>
		);
	}

	// Handle error state
	if (error) {
		return (
			<div className="bg-gray-800 shadow-lg rounded-lg p-8 max-w-4xl mx-auto text-center">
				<p className="text-red-400">{error}</p>
				<button
					onClick={() => window.location.reload()}
					className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded"
				>
					Retry
				</button>
			</div>
		);
	}

	// If products is undefined or empty
	if (!products || products.length === 0) {
		return (
			<motion.div
				className="bg-gray-800 shadow-lg rounded-lg p-8 max-w-4xl mx-auto text-center"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
			>
				<h2 className="text-2xl text-emerald-400 mb-4">No Products Found</h2>
				<p className="text-gray-300 mb-4">There are no products available at the moment.</p>
				<p className="text-gray-400">Try adding some products using the Create Product tab.</p>
			</motion.div>
		);
	}

	return (
		<motion.div
			className='bg-gray-800 shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8 }}
		>
			<div className="overflow-x-auto">
				<table className='min-w-full divide-y divide-gray-700'>
					<thead className='bg-gray-700'>
						<tr>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
							>
								Product
							</th>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
							>
								Price
							</th>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
							>
								Category
							</th>

							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
							>
								Featured
							</th>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
							>
								Actions
							</th>
						</tr>
					</thead>

					<tbody className='bg-gray-800 divide-y divide-gray-700'>
						{products.map((product) => (
							<tr key={product._id} className='hover:bg-gray-700'>
								<td className='px-6 py-4 whitespace-nowrap'>
									<div className='flex items-center'>
										<div className='flex-shrink-0 h-10 w-10'>
											<img
												className='h-10 w-10 rounded-full object-cover'
												src={product.image}
												alt={product.name}
												onError={(e) => {
													e.target.onerror = null;
													e.target.src = '/placeholder-product.jpg'; // Fallback image
												}}
											/>
										</div>
										<div className='ml-4'>
											<div className='text-sm font-medium text-white'>{product.name}</div>
										</div>
									</div>
								</td>
								<td className='px-6 py-4 whitespace-nowrap'>
									<div className='text-sm text-gray-300'>
										${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
									</div>
								</td>
								<td className='px-6 py-4 whitespace-nowrap'>
									<div className='text-sm text-gray-300'>{product.category}</div>
								</td>
								<td className='px-6 py-4 whitespace-nowrap'>
									<button
										onClick={() => toggleFeaturedProduct(product._id)}
										className={`p-1 rounded-full ${
											product.isFeatured ? "bg-yellow-400 text-gray-900" : "bg-gray-600 text-gray-300"
										} hover:bg-yellow-500 transition-colors duration-200`}
									>
										<Star className='h-5 w-5' />
									</button>
								</td>
								<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
									<button
										onClick={() => deleteProduct(product._id)}
										className='text-red-400 hover:text-red-300'
									>
										<Trash className='h-5 w-5' />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</motion.div>
	);
};
export default ProductsList;