import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../ui/LoadingSpinner';

const themeYellow = '#fcd116';
const themeBlue = '#2563eb';

interface GalleryImage {
	id: string;
	image_url: string;
	title: string;
	description?: string;
	display_order: number;
	is_active: boolean;
}

const Gallery: React.FC = () => {
	const [selected, setSelected] = useState<string | null>(null);
	const [images, setImages] = useState<GalleryImage[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadImages();
	}, []);

	const loadImages = async () => {
		setLoading(true);
		try {
			const { data, error } = await supabase
				.from('gallery_images')
				.select('*')
				.eq('is_active', true)
				.order('display_order');

			if (error) {
				console.error('Error loading gallery images:', error);
				// Fallback to default images if database fails
				setImages([
					{ id: '1', image_url: 'https://www.ssaami.ac.in/home-photos/1-1024.jpeg', title: 'School Photo 1', display_order: 1, is_active: true },
					{ id: '2', image_url: 'https://www.ssaami.ac.in/home-photos/2-1024.jpeg', title: 'School Photo 2', display_order: 2, is_active: true },
					{ id: '3', image_url: 'https://www.ssaami.ac.in/home-photos/3-1024.jpeg', title: 'School Photo 3', display_order: 3, is_active: true },
					{ id: '4', image_url: 'https://www.ssaami.ac.in/home-photos/4-1024.jpeg', title: 'School Photo 4', display_order: 4, is_active: true },
					{ id: '5', image_url: 'https://www.ssaami.ac.in/home-photos/5-1024.jpeg', title: 'School Photo 5', display_order: 5, is_active: true },
					{ id: '6', image_url: 'https://www.ssaami.ac.in/home-photos/6-1024.jpeg', title: 'School Photo 6', display_order: 6, is_active: true },
					{ id: '7', image_url: 'https://www.ssaami.ac.in/home-photos/7-1024.jpeg', title: 'School Photo 7', display_order: 7, is_active: true },
					{ id: '8', image_url: 'https://www.ssaami.ac.in/home-photos/8-1024.jpeg', title: 'School Photo 8', display_order: 8, is_active: true },
				]);
			} else {
				setImages(data || []);
			}
		} catch (err) {
			console.error('Unexpected error loading images:', err);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<LoadingSpinner />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 pt-24 pb-16 px-4">
			<div className="max-w-7xl mx-auto">
				<div className="text-center mb-16">
					<div className="flex items-center justify-center gap-4 mb-4">
						<img
							src="/assest/logo.png"
							alt="Logo"
							className="h-16 w-16 rounded-full shadow-xl border-4 border-yellow-400 bg-white"
						/>
					</div>
					<h2 className="text-5xl md:text-6xl font-extrabold mb-4">
						<span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-blue-600 bg-clip-text text-transparent">
							School Gallery
						</span>
					</h2>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto">
						Explore the vibrant moments and memories from our school community
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{images.map((img, idx) => (
						<div
							key={img.id}
							className="group relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
							onClick={() => setSelected(img.image_url)}
						>
							<div className="aspect-square overflow-hidden bg-gray-100">
								<img
									src={img.image_url}
									alt={img.title}
									className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
								/>
							</div>
							<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
								<div className="absolute bottom-0 left-0 right-0 p-4">
									<h3 className="text-white font-bold text-lg mb-1">{img.title}</h3>
									{img.description && (
										<p className="text-white/90 text-sm line-clamp-2">{img.description}</p>
									)}
								</div>
							</div>
							<div
								className="absolute top-3 right-3 w-2 h-2 rounded-full"
								style={{ backgroundColor: idx % 2 === 0 ? themeYellow : themeBlue }}
							/>
						</div>
					))}
				</div>
			</div>

			{/* Modal for selected image */}
			{selected && (
				<div
					className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
					onClick={() => setSelected(null)}
				>
					<div
						className="bg-white rounded-3xl p-4 md:p-8 max-w-5xl w-full relative shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg z-10"
							onClick={() => setSelected(null)}
						>
							<span className="text-2xl leading-none">&times;</span>
						</button>
						<div className="rounded-2xl overflow-hidden bg-gray-100">
							<img
								src={selected}
								alt="Selected"
								className="w-full max-h-[70vh] object-contain"
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Gallery;
