const LoadingSpinner = () => {
	return (
		<div className='flex items-center justify-center min-h-screen bg-[#2D1C24]'>
			<div className='relative'>
				<div className='w-20 h-20 border-pink-200 border-2 rounded-full' />
				<div className='w-20 h-20 border-[#FF6B9C] border-t-2 animate-spin rounded-full absolute left-0 top-0' />
				<div className='sr-only'>Loading</div>
			</div>
		</div>
	);
};

export default LoadingSpinner;