import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import CartItem from "../components/CartItem";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import OrderSummary from "../components/OrderSummary";
import GiftCouponCard from "../components/GiftCouponCard";

const CartPage = () => {
	const { cart } = useCartStore();

	return (
		<div className='relative py-8 md:py-16'>
			{/* Decorative background elements */}
			<div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
				<div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-b from-pink-500/20 to-purple-500/10 rounded-bl-full blur-3xl"></div>
				<div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-pink-500/10 to-purple-500/5 rounded-tr-full blur-3xl"></div>
			</div>
			
			<div className='mx-auto max-w-screen-xl px-4 2xl:px-0'>
				<div className='mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8'>
					<motion.div
						className='mx-auto w-full flex-none lg:max-w-2xl xl:max-w-4xl'
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						{cart.length === 0 ? (
							<EmptyCartUI />
						) : (
							<div className='space-y-6'>
								{cart.map((item) => (
									<CartItem key={item._id} item={item} />
								))}
							</div>
						)}
						{cart.length > 0 && <PeopleAlsoBought />}
					</motion.div>

					{cart.length > 0 && (
						<motion.div
							className='mx-auto mt-6 max-w-4xl flex-1 space-y-6 lg:mt-0 lg:w-full'
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5, delay: 0.4 }}
						>
							<OrderSummary />
							<GiftCouponCard />
						</motion.div>
					)}
				</div>
			</div>
		</div>
	);
};

export default CartPage;

const EmptyCartUI = () => (
	<motion.div
		className='flex flex-col items-center justify-center space-y-4 py-16 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 px-8'
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
	>
		<div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
			<ShoppingCart className='h-12 w-12 text-pink-400' />
		</div>
		<h3 className='text-2xl font-semibold text-white'>Your cart is empty</h3>
		<p className='text-gray-400 text-center'>Looks like you {"haven't"} added anything to your cart yet.</p>
		<Link
			className='mt-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 
			px-6 py-2.5 text-white transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/30 
			transform hover:-translate-y-1 font-medium flex items-center'
			to='/'
		>
			Start Shopping
		</Link>
	</motion.div>
);