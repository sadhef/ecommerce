import { motion } from "framer-motion";
import { Trash, Star, AlertTriangle } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useState } from "react";
import toast from "react-hot-toast";

const ProductsList = () => {
	const { deleteProduct, toggleFeaturedProduct, products, loading, error } = useProductStore();
	const [deleteConfirm, setDeleteConfirm] = useState(null); // Stores ID of product being deleted
	
	// Handle delete with confirmation
	const handleDeleteClick = (productId) => {
		if (deleteConfirm === productId) {
			// User confirmed deletion
			handleDeleteProduct(productId);
			setDeleteConfirm(null);
		} else {
			// First click - show confirmation
			setDeleteConfirm(productId);
			
			// Auto-reset after 5 seconds
			setTimeout(() => {
				setDeleteConfirm(null);
			}, 5000);
		}
	};
	
	// Actually delete the product
	const handleDeleteProduct = async (productId) => {
		try {
			const success = await deleteProduct(productId);
			if (success) {
				toast.success("Product deleted successfully");
			}
		} catch (err) {
			console.error("Error deleting product:", err);
			toast.error("Failed to delete product");
		}
	};
	
	// Handle toggle featured
	const handleToggleFeatured = async (productId) => {
		try {
			await toggleFeaturedProduct(productId);
		} catch (err) {
			console.error("Error toggling featured status:", err);
			toast.error("Failed to update product");
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B9C]"></div>
			</div>
		);
	}
	
	if (error) {
		return (
			<div className="bg-red-900/20 p-6 rounded-lg text-center">
				<AlertTriangle className="h-12 w-12 mx-auto text-red-400 mb-4" />
				<h3 className="text-xl font-medium text-red-300">Error loading products</h3>
				<p className="text-pink-200 mt-2">{error}</p>
				<button 
					onClick={() => window.location.reload()}
					className="mt-4 bg-[#E84D8A] hover:bg-[#FF6B9C] text-white px-4 py-2 rounded-md"
				>
					Try Again
				</button>
			</div>
		);
	}
	
	if (!products || products.length === 0) {
		return (
			<div className="bg-[#3D2A33] shadow-lg rounded-lg p-8 text-center">
				<h3 className="text-xl font-medium text-pink-100">No products found</h3>
				<p className="text-pink-200 mt-2">Create some products to see them here.</p>
			</div>
		);
	}

	return (
		<motion.div
			className='bg-[#3D2A33] shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8 }}
		>
			<div className="overflow-x-auto">
				<table className='min-w-full divide-y divide-[#FF6B9C]/30'>
					<thead className='bg-[#2D1C24]'>
						<tr>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-pink-100 uppercase tracking-wider'
							>
								Product
							</th>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-pink-100 uppercase tracking-wider'
							>
								Price
							</th>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-pink-100 uppercase tracking-wider'
							>
								Category
							</th>

							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-pink-100 uppercase tracking-wider'
							>
								Featured
							</th>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-pink-100 uppercase tracking-wider'
							>
								Actions
							</th>
						</tr>
					</thead>

					<tbody className='bg-[#3D2A33] divide-y divide-[#FF6B9C]/30'>
						{products.map((product) => (
							<tr key={product._id} className='hover:bg-[#2D1C24]'>
								<td className='px-6 py-4 whitespace-nowrap'>
									<div className='flex items-center'>
										<div className='flex-shrink-0 h-10 w-10'>
											<img
												className='h-10 w-10 rounded-full object-cover'
												src={product.image || 'https://placehold.co/100x100?text=No+Image'}
												alt={product.name}
												onError={(e) => {
													e.target.onerror = null;
													e.target.src = 'https://placehold.co/100x100?text=Error';
												}}
											/>
										</div>
										<div className='ml-4'>
											<div className='text-sm font-medium text-white'>{product.name}</div>
										</div>
									</div>
								</td>
								<td className='px-6 py-4 whitespace-nowrap'>
									<div className='text-sm text-pink-100'>${product.price.toFixed(2)}</div>
								</td>
								<td className='px-6 py-4 whitespace-nowrap'>
									<div className='text-sm text-pink-100'>{product.category}</div>
								</td>
								<td className='px-6 py-4 whitespace-nowrap'>
									<button
										onClick={() => handleToggleFeatured(product._id)}
										className={`p-1 rounded-full ${
											product.isFeatured ? "bg-yellow-400 text-gray-900" : "bg-[#2D1C24] text-pink-100"
										} hover:bg-yellow-500 transition-colors duration-200`}
										title={product.isFeatured ? "Remove from featured" : "Add to featured"}
									>
										<Star className='h-5 w-5' />
									</button>
								</td>
								<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
									<button
										onClick={() => handleDeleteClick(product._id)}
										className={`${
											deleteConfirm === product._id 
												? "bg-red-600 text-white px-2 py-1 rounded" 
												: "text-red-400 hover:text-red-300"
										}`}
										title={deleteConfirm === product._id ? "Click again to confirm" : "Delete product"}
									>
										<Trash className='h-5 w-5' />
										{deleteConfirm === product._id && <span className="ml-1">Confirm</span>}
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