'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Camera, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, XCircle, Loader2, X, AlertTriangle, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

interface VerifiedProduct {
    sku: string;
    name: string;
    category: string;
    totalParts: number;
}

export default function ScanPage() {
    const { user } = useAuth();
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

    // Scan Mode Toggle State
    const [scanMode, setScanMode] = useState<'upload' | 'camera'>('upload');

    // Modal & Verification State
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifiedProduct, setVerifiedProduct] = useState<VerifiedProduct | null>(null);
    const [action, setAction] = useState<'IN' | 'OUT'>('IN');
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [manualSku, setManualSku] = useState('');

    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    // Live Camera Effect (Fixed Strict Mode Double-Mount Bug)
    useEffect(() => {
        if (scanMode === 'camera' && !isVerifying) {
            if (!scannerRef.current) {
                scannerRef.current = new Html5QrcodeScanner("reader", {
                    qrbox: { width: 300, height: 150 },
                    fps: 5,
                }, false);

                scannerRef.current.render((decodedText) => {
                    // On Success: Stop camera, switch to upload mode, open modal
                    if (scannerRef.current) {
                        scannerRef.current.clear().catch(console.error);
                        scannerRef.current = null;
                    }
                    setScanMode('upload');
                    handleProductLookup(decodedText);
                }, () => { }); // Ignore background read errors
            }
        }

        // Cleanup function
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
        };
    }, [scanMode, isVerifying]);

    // Handle File Upload Scanning
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus({ type: null, message: '' });

        // Use a hidden div to process the image in the background
        const html5QrCode = new Html5Qrcode("hidden-reader");
        try {
            const decodedText = await html5QrCode.scanFile(file, false);
            handleProductLookup(decodedText);
        } catch (err) {
            setStatus({ type: 'error', message: 'Could not detect a valid barcode in that image.' });
        }
    };

    const handleProductLookup = async (skuToLookup: string) => {
        if (!skuToLookup) return;
        setStatus({ type: null, message: '' });

        try {
            const res = await api.get(`/products/${skuToLookup}`);
            if (res.data.success) {
                setVerifiedProduct(res.data.product);
                setIsVerifying(true);
                setManualSku('');
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: error.response?.data?.message || 'Product not found.' });
        }
    };

    const handleConfirmTransaction = async (e: React.FormEvent) => {
        e.preventDefault();

        // FIX: If the user is an Admin (warehouse_id is null), default them to Warehouse 1 (Main HQ)
        const targetWarehouseId = user?.warehouse_id || 1;

        if (!verifiedProduct) {
            setStatus({ type: 'error', message: 'Missing product details.' });
            return;
        }

        setIsSubmitting(true);
        setStatus({ type: null, message: '' });

        try {
            const res = await api.post('/inventory/scan', {
                sku: verifiedProduct.sku,
                warehouse_id: targetWarehouseId,
                action,
                quantity
            });

            if (res.data.success) {
                // Success! Set the message and close the modal
                setStatus({ type: 'success', message: `Successfully logged ${quantity} units ${action}.` });
                closeModal();
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: error.response?.data?.message || 'Failed to process transaction.' });
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setIsVerifying(false);
        setVerifiedProduct(null);
        setQuantity(1);
        setIsSubmitting(false);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 mt-4">
            <header className="text-center">
                <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 rounded-full mb-4">
                    <Camera className="h-8 w-8 text-indigo-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventory Scanner</h1>
                <p className="text-slate-500 mt-2">Upload a barcode image or use your device camera to log items.</p>
            </header>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">

                {/* Status Messages */}
                <AnimatePresence>
                    {status.type && !isVerifying && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: '2rem' }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className={`overflow-hidden rounded-xl p-4 flex items-center ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}
                        >
                            {status.type === 'success' ? <CheckCircle2 className="h-6 w-6 mr-3 flex-shrink-0" /> : <XCircle className="h-6 w-6 mr-3 flex-shrink-0" />}
                            <p className="font-medium">{status.message}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* THE TOGGLE SWITCH */}
                {!isVerifying && (
                    <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
                        <button
                            type="button" onClick={() => setScanMode('upload')}
                            className={`flex-1 flex items-center justify-center py-3 rounded-lg font-medium transition-all ${scanMode === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <UploadCloud className="w-5 h-5 mr-2" /> Upload Image
                        </button>
                        <button
                            type="button" onClick={() => setScanMode('camera')}
                            className={`flex-1 flex items-center justify-center py-3 rounded-lg font-medium transition-all ${scanMode === 'camera' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Camera className="w-5 h-5 mr-2" /> Live Camera
                        </button>
                    </div>
                )}

                {/* Hidden Div required for File Scanning */}
                <div id="hidden-reader" className="hidden"></div>

                {/* MODE: UPLOAD FILE */}
                {scanMode === 'upload' && !isVerifying && (
                    <div className="space-y-6">
                        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:bg-slate-50 transition-colors relative">
                            <input
                                type="file" accept="image/*" onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-1">Click or drag a barcode image</h3>
                            <p className="text-sm text-slate-500">Supports PNG, JPG, and JPEG</p>
                        </div>

                        <div className="flex items-center text-slate-400 my-4">
                            <div className="flex-1 border-t border-slate-200"></div>
                            <span className="px-4 text-sm font-medium">OR ENTER MANUALLY</span>
                            <div className="flex-1 border-t border-slate-200"></div>
                        </div>

                        <div className="flex gap-3">
                            <input
                                type="text" value={manualSku} onChange={(e) => setManualSku(e.target.value.toUpperCase())}
                                placeholder="Type SKU (e.g., SKDS-123456)"
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                                onKeyDown={(e) => e.key === 'Enter' && handleProductLookup(manualSku)}
                            />
                            <button
                                onClick={() => handleProductLookup(manualSku)} disabled={!manualSku}
                                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium disabled:opacity-50"
                            >
                                Lookup
                            </button>
                        </div>
                    </div>
                )}

                {/* MODE: LIVE CAMERA */}
                {scanMode === 'camera' && !isVerifying && (
                    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-900 relative">
                        <div id="reader" className="w-full"></div>
                    </div>
                )}
            </motion.div>

            {/* VERIFICATION POPUP MODAL */}
            <AnimatePresence>
                {isVerifying && verifiedProduct && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-900">Verify Scan</h2>
                                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleConfirmTransaction} className="p-6 space-y-6">
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-indigo-950 text-lg">{verifiedProduct.name}</h3>
                                        <span className="bg-white text-indigo-700 text-xs font-bold px-2 py-1 rounded shadow-sm">
                                            {verifiedProduct.sku}
                                        </span>
                                    </div>
                                    <p className="text-sm text-indigo-700/80 mb-3">{verifiedProduct.category}</p>

                                    <div className="flex items-center text-sm font-medium text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                                        <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                                        Reminder: This item consists of {verifiedProduct.totalParts} total parts per unit.
                                    </div>
                                </div>

                                <div className="flex p-1 bg-slate-100 rounded-xl">
                                    <button
                                        type="button" onClick={() => setAction('IN')}
                                        className={`flex-1 flex items-center justify-center py-2.5 rounded-lg font-medium transition-all ${action === 'IN' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <ArrowDownToLine className="w-4 h-4 mr-2" /> Stock IN
                                    </button>
                                    <button
                                        type="button" onClick={() => setAction('OUT')}
                                        className={`flex-1 flex items-center justify-center py-2.5 rounded-lg font-medium transition-all ${action === 'OUT' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <ArrowUpFromLine className="w-4 h-4 mr-2" /> Stock OUT
                                    </button>
                                </div>

                                {status.type === 'error' && (
                                    <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
                                        {status.message}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Number of Units</label>
                                    <input
                                        type="number" min="1" required value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
                                        className="w-full text-lg px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <button
                                    type="submit" disabled={isSubmitting}
                                    className={`w-full flex items-center justify-center py-3.5 rounded-xl text-white font-medium transition-all ${action === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                                        } disabled:opacity-50`}
                                >
                                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : `Confirm ${action}`}
                                </button>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}