import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader, AlertTriangle } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { toast } from "react-hot-toast";

const categories = ["jeans", "t-shirts", "shoes", "glasses", "jackets", "suits", "bags"];

const CreateProductForm = () => {
	const [newProduct, setNewProduct] = useState({
		name: "",
		description: "",
		price: "",
		category: "",
		image: "",
	});
	const [imageError, setImageError] = useState("");
	const [imageLoading, setImageLoading] = useState(false);

	const { createProduct, loading } = useProductStore();

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		// Validate required fields
		if (!newProduct.name || !newProduct.description || !newProduct.price || !newProduct.category) {
			toast.error("Please fill in all required fields");
			return;
		}

		try {
			await createProduct(newProduct);
			setNewProduct({ name: "", description: "", price: "", category: "", image: "" });
			setImageError("");
		} catch (error) {
			console.error("Error creating product:", error);
			toast.error("Failed to create product. Please try again.");
		}
	};

	const handleImageChange = (e) => {
		setImageError("");
		const file = e.target.files[0];
		
		if (!file) return;
		
		// Validate file is an image
		if (!file.type.match('image.*')) {
			setImageError("Please select an image file");
			return;
		}
		
		// Validate file size (limit to 1MB)
		if (file.size > 1024 * 1024) {
			setImageError("Image size should be less than 1MB");
			return;
		}
		
		setImageLoading(true);
		
		const reader = new FileReader();
		
		reader.onloadend = () => {
			setNewProduct({ ...newProduct, image: reader.result });
			setImageLoading(false);
		};
		
		reader.onerror = () => {
			setImageError("Failed to read the image file");
			setImageLoading(false);
		};
		
		reader.readAsDataURL(file); // base64
	};

	return (
		<motion.div
			className='bg-[#3D2A33] shadow-lg rounded-lg p-8 mb-8 max-w-xl mx-auto'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8 }}
		>
			<h2 className='text-2xl font-semibold mb-6 text-[#FFA5C3]'>Create New Product</h2>

			<form onSubmit={handleSubmit} className='space-y-4'>
				<div>
					<label htmlFor='name' className='block text-sm font-medium text-pink-100'>
						Product Name <span className="text-red-400">*</span>
					</label>
					<input
						type='text'
						id='name'
						name='name'
						value={newProduct.name}
						onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
						className='mt-1 block w-full bg-[#2D1C24] border border-[#FF6B9C]/30 rounded-md shadow-sm py-2
						 px-3 text-white focus:outline-none focus:ring-2
						focus:ring-[#FF6B9C] focus:border-[#FF6B9C]'
						required
					/>
				</div>

				<div>
					<label htmlFor='description' className='block text-sm font-medium text-pink-100'>
						Description <span className="text-red-400">*</span>
					</label>
					<textarea
						id='description'
						name='description'
						value={newProduct.description}
						onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
						rows='3'
						className='mt-1 block w-full bg-[#2D1C24] border border-[#FF6B9C]/30 rounded-md shadow-sm
						 py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B9C] 
						 focus:border-[#FF6B9C]'
						required
					/>
				</div>

				<div>
					<label htmlFor='price' className='block text-sm font-medium text-pink-100'>
						Price <span className="text-red-400">*</span>
					</label>
					<input
						type='number'
						id='price'
						name='price'
						value={newProduct.price}
						onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
						step='0.01'
						className='mt-1 block w-full bg-[#2D1C24] border border-[#FF6B9C]/30 rounded-md shadow-sm 
						py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B9C]
						 focus:border-[#FF6B9C]'
						required
					/>
				</div>

				<div>
					<label htmlFor='category' className='block text-sm font-medium text-pink-100'>
						Category <span className="text-red-400">*</span>
					</label>
					<select
						id='category'
						name='category'
						value={newProduct.category}
						onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
						className='mt-1 block w-full bg-[#2D1C24] border border-[#FF6B9C]/30 rounded-md
						 shadow-sm py-2 px-3 text-white focus:outline-none 
						 focus:ring-2 focus:ring-[#FF6B9C] focus:border-[#FF6B9C]'
						required
					>
						<option value=''>Select a category</option>
						{categories.map((category) => (
							<option key={category} value={category}>
								{category}
							</option>
						))}
					</select>
				</div>

				<div className='mt-1'>
					<label className='block text-sm font-medium text-pink-100'>
						Product Image
					</label>
					<div className="flex flex-col">
						<div className="flex items-center mt-2">
							<input 
								type='file' 
								id='image' 
								className='sr-only' 
								accept='image/*' 
								onChange={handleImageChange} 
							/>
							<label
								htmlFor='image'
								className='cursor-pointer bg-[#2D1C24] py-2 px-3 border border-[#FF6B9C]/30 rounded-md shadow-sm text-sm leading-4 font-medium text-pink-100 hover:bg-[#3D2A33] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B9C]'
							>
								{imageLoading ? <Loader className='h-5 w-5 inline-block mr-2 animate-spin' /> : <Upload className='h-5 w-5 inline-block mr-2' />}
								Upload Image
							</label>
							{newProduct.image && !imageLoading && <span className='ml-3 text-sm text-pink-200'>Image uploaded</span>}
						</div>
						
						{imageError && (
							<div className="flex items-center mt-2 text-red-400 text-sm">
								<AlertTriangle className="h-4 w-4 mr-1" />
								{imageError}
							</div>
						)}
						
						{newProduct.image && !imageLoading && (
							<div className="mt-3 w-24 h-24 rounded-md overflow-hidden border border-[#FF6B9C]/30">
								<img 
									src={newProduct.image} 
									alt="Product preview" 
									className="w-full h-full object-cover" 
								/>
							</div>
						)}
					</div>
					<p className="text-xs text-pink-200 mt-1">
						Image is optional. Products can be created without an image.
					</p>
				</div>

				<button
					type='submit'
					className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md 
					shadow-sm text-sm font-medium text-white bg-[#E84D8A] hover:bg-[#FF6B9C] 
					focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B9C] disabled:opacity-50'
					disabled={loading || imageLoading}
				>
					{loading ? (
						<>
							<Loader className='mr-2 h-5 w-5 animate-spin' aria-hidden='true' />
							Creating...
						</>
					) : (
						<>
							<PlusCircle className='mr-2 h-5 w-5' />
							Create Product
						</>
					)}
				</button>
			</form>
		</motion.div>
	);
};
export default CreateProductForm;