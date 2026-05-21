'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Plus, Package, Loader2, X, Download, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Barcode from 'react-barcode';

// Define the shape of a Product based on our MongoDB schema
interface Product {
    _id: string;
    sku: string;
    name: string;
    category: string;
    description: string;
    totalParts: number;
    createdAt: string;
}

export default function ProductsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    
    // Form State
    const [formData, setFormData] = useState({ name: '', category: '', description: '', totalParts: 1 });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // SVG Reference for downloading
    const barcodeRef = useRef<HTMLDivElement>(null);

    // Security: Kick out non-admins immediately
    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [user, router]);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            if (res.data.success) {
                setProducts(res.data.products);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await api.post('/products', formData);
            if (res.data.success) {
                fetchProducts();
                setIsAddModalOpen(false);
                setFormData({ name: '', category: '', description: '', totalParts: 1 });
            }
        } catch (error) {
            console.error('Error creating product:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Function to convert the SVG barcode to a PNG and trigger a download
    const handleDownloadBarcode = () => {
        if (!barcodeRef.current || !selectedProduct) return;
        
        const svgElement = barcodeRef.current.querySelector('svg');
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width + 40; // Add padding
            canvas.height = img.height + 40;
            
            // Fill white background
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 20, 20); // Draw image with padding
                
                // Trigger download
                const pngFile = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.download = `${selectedProduct.sku}-barcode.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            }
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    if (user?.role !== 'admin') return null; // Prevent flash of content

    return (
        <div className="space-y-6 relative h-[calc(100vh-4rem)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
                        <Package className="mr-2 h-6 w-6 text-indigo-600" />
                        Product Catalog
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage design assets, track part counts, and generate barcodes.</p>
                </div>
                
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">Product / SKU</th>
                                <th className="px-6 py-4 font-medium">Category</th>
                                <th className="px-6 py-4 font-medium">Parts</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-2" />
                                        Loading catalog...
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        No products found.
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{product.name}</div>
                                            <div className="font-mono text-xs text-indigo-600 mt-1">{product.sku}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                                                {product.category || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-700">{product.totalParts} pcs</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setSelectedProduct(product)}
                                                className="inline-flex items-center px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-xs font-medium"
                                            >
                                                <QrCode className="h-4 w-4 mr-1.5" />
                                                Barcode
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD PRODUCT MODAL */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-100"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-900">Catalog New Item</h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                                    <input 
                                        type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                        <input 
                                            type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Total Parts (per unit)</label>
                                        <input 
                                            type="number" min="1" required value={formData.totalParts} onChange={(e) => setFormData({...formData, totalParts: Number(e.target.value)})}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button 
                                        type="submit" disabled={isSubmitting}
                                        className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-white bg-slate-900 hover:bg-slate-800 transition-all"
                                    >
                                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save & Generate SKU'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* BARCODE DOWNLOADER MODAL */}
            <AnimatePresence>
                {selectedProduct && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-6 text-center">
                                <h3 className="text-xl font-bold text-slate-900 mb-1">{selectedProduct.name}</h3>
                                <p className="text-sm text-slate-500 mb-6">Contains {selectedProduct.totalParts} individual parts</p>
                                
                                {/* The Barcode Canvas container */}
                                <div ref={barcodeRef} className="flex justify-center bg-white p-4 rounded-xl mb-6">
                                    <Barcode 
                                        value={selectedProduct.sku} 
                                        format="CODE128"
                                        width={2}
                                        height={100}
                                        displayValue={true}
                                        font="monospace"
                                        textAlign="center"
                                        textPosition="bottom"
                                        textMargin={8}
                                        background="#ffffff"
                                        lineColor="#0f172a"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setSelectedProduct(null)}
                                        className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button 
                                        onClick={handleDownloadBarcode}
                                        className="flex-1 flex justify-center items-center py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}