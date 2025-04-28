import { Link } from "react-router-dom";

const CategoryItem = ({ category, compact = false }) => {
	// Compact version for the home screen grid
	if (compact) {
		return (
			<Link to={"/category" + category.href} className="block">
				<div className='relative overflow-hidden rounded-lg group shadow-md transition-transform duration-300 hover:scale-105'>
					<div className='h-40 w-full'>
						<div className='absolute inset-0 bg-gradient-to-b from-transparent to-[#2D1C24] opacity-70 z-10 rounded-lg' />
						<img
							src={category.imageUrl}
							alt={category.name}
							className='w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 rounded-lg'
							loading='lazy'
						/>
						<div className='absolute bottom-0 left-0 right-0 p-3 z-20 text-center'>
							<h3 className='text-white text-lg font-bold'>{category.name}</h3>
						</div>
					</div>
				</div>
			</Link>
		);
	}

	// Original full-size version for category pages
	return (
		<div className='relative overflow-hidden h-96 w-full rounded-lg group'>
			<Link to={"/category" + category.href}>
				<div className='w-full h-full cursor-pointer'>
					<div className='absolute inset-0 bg-gradient-to-b from-transparent to-[#2D1C24] opacity-50 z-10' />
					<img
						src={category.imageUrl}
						alt={category.name}
						className='w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110'
						loading='lazy'
					/>
					<div className='absolute bottom-0 left-0 right-0 p-4 z-20'>
						<h3 className='text-white text-2xl font-bold mb-2'>{category.name}</h3>
						<p className='text-pink-100 text-sm'>Explore {category.name}</p>
					</div>
				</div>
			</Link>
		</div>
	);
};

export default CategoryItem;