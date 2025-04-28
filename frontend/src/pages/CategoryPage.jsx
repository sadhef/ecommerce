import { useEffect } from "react";
import { useProductStore } from "../stores/useProductStore";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";

const CategoryPage = () => {
	const { fetchProductsByCategory, products, loading, error } = useProductStore();

	const { category } = useParams();

	useEffect(() => {
		if (category) {
			fetchProductsByCategory(category);
		}
	}, [fetchProductsByCategory, category]);

	// Format category name for display (capitalize first letter)
	const displayCategory = category ? category.charAt(0).toUpperCase() + category.slice(1) : '';

	return (
		<div className='min-h-screen'>
			<div className='relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				<motion.h1
					className='text-center text-4xl sm:text-5xl font-bold text-emerald-400 mb-8'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					{displayCategory}
				</motion.h1>

				{loading && (
					<div className="flex justify-center py-8">
						<LoadingSpinner />
					</div>
				)}

				{error && (
					<motion.div
						className="bg-gray-800 p-6 rounded-lg shadow-lg text-center"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
					>
						<p className="text-red-400">{error}</p>
						<button 
							onClick={() => fetchProductsByCategory(category)}
							className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded"
						>
							Try Again
						</button>
					</motion.div>
				)}

				{!loading && !error && (
					<motion.div
						className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center'
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
					>
						{(!products || products.length === 0) && (
							<div className="col-span-full text-center py-12">
								<h2 className='text-3xl font-semibold text-gray-300'>
									No products found in this category
								</h2>
								<p className="text-gray-400 mt-4">
									Check back later or explore other categories.
								</p>
							</div>
						)}

						{products && products.length > 0 && products.map((product) => (
							<ProductCard key={product._id} product={product} />
						))}
					</motion.div>
				)}
			</div>
		</div>
	);
};
export default CategoryPage;