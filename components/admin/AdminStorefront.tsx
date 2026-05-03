import React, { useState, useEffect } from 'react';
import { db } from '@/services/firebase';
import { Product } from '@/types';
import Icon from '@/components/common/Icon';
import firebase from 'firebase/compat/app';

const AdminStorefront: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    // Review Moderation State
    const [managingReviewsFor, setManagingReviewsFor] = useState<Product | null>(null);
    const [dummyReview, setDummyReview] = useState({ userId: '', authorName: '', rating: 5, comment: '', imagesStr: '' });
    const [statsOverride, setStatsOverride] = useState({
        reviewCount: 0,
        ratingAvg: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });

    const openReviewManager = (p: Product) => {
        setManagingReviewsFor(p);
        setStatsOverride({
            reviewCount: p.reviewCount || 0,
            ratingAvg: p.ratingAvg || 0,
            distribution: p.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        });
        setDummyReview({ userId: '', authorName: '', rating: 5, comment: '', imagesStr: '' });
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const snap = await db.collection('products').get();
            setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        } catch (e) {
            console.error("Failed to fetch products", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        try {
            const data = { ...editingProduct };
            if (!data.id) {
                // Creates a new product
                data.createdAt = firebase.firestore.FieldValue.serverTimestamp() as any;
                data.ratingAvg = 0;
                data.reviewCount = 0;
                await db.collection('products').add(data);
            } else {
                // Updates an existing one
                await db.collection('products').doc(data.id).update(data);
            }
            setIsProductModalOpen(false);
            setEditingProduct(null);
            fetchProducts();
        } catch (err) {
            console.error("Failed to save product", err);
            alert("Failed to save product");
        }
    };

    const handleInjectReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!managingReviewsFor || !dummyReview.userId || !dummyReview.authorName) return;

        try {
            const reviewRef = db.collection('products').doc(managingReviewsFor.id).collection('reviews').doc();
            
            await reviewRef.set({
                id: reviewRef.id,
                productId: managingReviewsFor.id,
                userId: dummyReview.userId,
                authorName: dummyReview.authorName,
                rating: Number(dummyReview.rating),
                comment: dummyReview.comment,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                isVerifiedPurchase: true,
                images: dummyReview.imagesStr ? dummyReview.imagesStr.split(',').map(s => s.trim()).filter(Boolean) : []
            });

            // Update product aggregations
            const newCount = (managingReviewsFor.reviewCount || 0) + 1;
            const newAvg = (((managingReviewsFor.ratingAvg || 0) * (managingReviewsFor.reviewCount || 0)) + Number(dummyReview.rating)) / newCount;

            await db.collection('products').doc(managingReviewsFor.id).update({
                reviewCount: newCount,
                ratingAvg: newAvg
            });

            alert('Review injected successfully!');
            setDummyReview({ userId: '', authorName: '', rating: 5, comment: '', imagesStr: '' });
            fetchProducts();
        } catch (err) {
            console.error("Failed to inject review", err);
            alert("Failed to inject review");
        }
    };

    const handleSaveStats = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!managingReviewsFor) return;

        try {
            await db.collection('products').doc(managingReviewsFor.id).update({
                reviewCount: Number(statsOverride.reviewCount),
                ratingAvg: Number(statsOverride.ratingAvg),
                ratingDistribution: {
                    5: Number(statsOverride.distribution[5]),
                    4: Number(statsOverride.distribution[4]),
                    3: Number(statsOverride.distribution[3]),
                    2: Number(statsOverride.distribution[2]),
                    1: Number(statsOverride.distribution[1])
                }
            });
            alert('Stats updated successfully!');
            fetchProducts();
            setManagingReviewsFor(null);
        } catch (err) {
            console.error("Failed to update stats", err);
            alert("Failed to update stats");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#1e293b]/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">Store Products</h2>
                    <p className="text-sm text-slate-400">Manage digital and physical store inventory</p>
                </div>
                <button
                    onClick={() => {
                        setEditingProduct({ isPublished: false, type: 'digital', stock: 10, images: [], variants: [] });
                        setIsProductModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                    <Icon name="plus" className="w-5 h-5" />
                    Add Product
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map(p => (
                        <div key={p.id} className="bg-[#1e293b]/50 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col">
                            <div className="h-40 bg-slate-800 relative">
                                {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-600"><Icon name="image" className="w-10 h-10" /></div>}
                                <span className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 text-[10px] rounded uppercase font-bold tracking-wider">{p.type}</span>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg text-white mb-1">{p.name}</h3>
                                <p className="text-brand-primary font-bold mb-3">₹{p.price}</p>
                                <p className="text-xs text-slate-400 mb-4 line-clamp-2">{p.description}</p>
                                
                                <div className="mt-auto flex justify-between gap-2 border-t border-white/10 pt-4">
                                    <button 
                                        onClick={() => { setEditingProduct(p); setIsProductModalOpen(true); }}
                                        className="text-xs flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded font-medium transition"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => openReviewManager(p)}
                                        className="text-xs flex-1 bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 py-2 rounded font-medium transition"
                                    >
                                        Reviews ({p.reviewCount || 0})
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* PRODUCT MODAL */}
            {isProductModalOpen && editingProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl my-8">
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h2 className="text-xl font-bold">{editingProduct.id ? 'Edit Product' : 'New Product'}</h2>
                            <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-white">
                                <Icon name="x" className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Product Name</label>
                                    <input required type="text" value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price (₹)</label>
                                    <input required type="number" value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Original Price (optional)</label>
                                    <input type="number" value={editingProduct.originalPrice || ''} onChange={e => setEditingProduct({...editingProduct, originalPrice: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Type</label>
                                    <select value={editingProduct.type || 'digital'} onChange={e => setEditingProduct({...editingProduct, type: e.target.value as any})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5">
                                        <option value="digital">Digital (Instant Unlock)</option>
                                        <option value="physical">Physical (Requires Address)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Stock</label>
                                    <input required type="number" value={editingProduct.stock || ''} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea required rows={6} value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5" placeholder="Detailed product description..." />
                                </div>
                                <div className="col-span-2 border border-slate-700 rounded-xl p-4 bg-slate-800/50">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-sm font-medium">Image URLs</label>
                                        <button type="button" onClick={() => setEditingProduct({...editingProduct, images: [...(editingProduct.images || []), '']})} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">Add Image</button>
                                    </div>
                                    <div className="space-y-2">
                                        {(editingProduct.images || []).map((img, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input type="text" value={img} onChange={e => { const newImgs = [...(editingProduct.images || [])]; newImgs[i] = e.target.value; setEditingProduct({...editingProduct, images: newImgs}); }} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2" placeholder="https://..." />
                                                <button type="button" onClick={() => { const newImgs = [...(editingProduct.images || [])]; newImgs.splice(i, 1); setEditingProduct({...editingProduct, images: newImgs}); }} className="p-2 text-red-400 hover:bg-red-400/10 rounded"><Icon name="trash-2" className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-span-2 border border-slate-700 rounded-xl p-4 bg-slate-800/50">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-sm font-medium">Variants (Label & Price)</label>
                                        <button type="button" onClick={() => setEditingProduct({...editingProduct, variants: [...(editingProduct.variants || []), { label: '', price: editingProduct.price || 0 }]})} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">Add Variant</button>
                                    </div>
                                    <div className="space-y-2">
                                        {(editingProduct.variants || []).map((v, i) => (
                                            <div key={i} className="flex gap-2 items-center">
                                                <input type="text" value={v.label} onChange={e => { const newVars = [...(editingProduct.variants || [])]; newVars[i].label = e.target.value; setEditingProduct({...editingProduct, variants: newVars}); }} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2" placeholder="e.g. 256GB, Large..." />
                                                <input type="number" value={v.price} onChange={e => { const newVars = [...(editingProduct.variants || [])]; newVars[i].price = Number(e.target.value); setEditingProduct({...editingProduct, variants: newVars}); }} className="w-32 bg-slate-800 border border-slate-700 rounded-lg p-2" placeholder="Price" />
                                                <button type="button" onClick={() => { const newVars = [...(editingProduct.variants || [])]; newVars.splice(i, 1); setEditingProduct({...editingProduct, variants: newVars}); }} className="p-2 text-red-400 hover:bg-red-400/10 rounded"><Icon name="trash-2" className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-span-2 flex items-center gap-3">
                                    <input type="checkbox" id="isPublished" checked={editingProduct.isPublished || false} onChange={e => setEditingProduct({...editingProduct, isPublished: e.target.checked})} className="w-5 h-5 rounded border-slate-700 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-900 bg-slate-800" />
                                    <label htmlFor="isPublished" className="font-medium cursor-pointer">Published (Visible in Store)</label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-5 py-2.5 text-slate-300 hover:text-white font-medium">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-lg shadow-blue-500/20 text-white">Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* REVIEWS INJECTION MODAL */}
            {managingReviewsFor && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                 <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl my-8">
                     <div className="flex justify-between items-center p-6 border-b border-slate-800">
                         <h2 className="text-xl font-bold">Stats & Reviews: {managingReviewsFor.name}</h2>
                         <button onClick={() => setManagingReviewsFor(null)} className="text-slate-400 hover:text-white">
                             <Icon name="x" className="w-6 h-6" />
                         </button>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                         {/* Stats Override Form */}
                         <form onSubmit={handleSaveStats} className="p-6 space-y-4">
                             <div className="flex items-center gap-2 mb-2">
                                 <Icon name="bar-chart-2" className="w-5 h-5 text-emerald-400" />
                                 <h3 className="font-bold text-white">Override Global Stats</h3>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-sm font-medium mb-1">Total Reviews</label>
                                     <input required type="number" value={statsOverride.reviewCount} onChange={e => setStatsOverride({...statsOverride, reviewCount: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5" />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-medium mb-1">Avg Rating</label>
                                     <input required type="number" step="0.1" min="1" max="5" value={statsOverride.ratingAvg} onChange={e => setStatsOverride({...statsOverride, ratingAvg: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5" />
                                 </div>
                             </div>

                             <div className="space-y-2 mt-4">
                                 <label className="block text-sm font-medium">Rating Distribution</label>
                                 {[5,4,3,2,1].map(stars => (
                                     <div key={stars} className="flex items-center gap-2">
                                         <span className="text-xs w-12 text-slate-400">{stars} Stars</span>
                                         <input type="number" value={statsOverride.distribution[stars as keyof typeof statsOverride.distribution]} onChange={e => setStatsOverride({...statsOverride, distribution: {...statsOverride.distribution, [stars]: Number(e.target.value)}})} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-1.5 px-3 text-sm" placeholder="Count" />
                                     </div>
                                 ))}
                             </div>

                             <div className="flex justify-end pt-4 border-t border-slate-800">
                                 <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium shadow-lg shadow-emerald-500/20 text-white flex gap-2 w-full justify-center"><Icon name="save" className="w-5 h-5"/> Save Stats</button>
                             </div>
                         </form>

                         {/* Reviews Injection Form */}
                         <form onSubmit={handleInjectReview} className="p-6 space-y-4">
                             <div className="flex items-center gap-2 mb-2">
                                 <Icon name="message-square" className="w-5 h-5 text-purple-400" />
                                 <h3 className="font-bold text-white">Inject a Review</h3>
                             </div>
                             <div>
                                 <label className="block text-sm font-medium mb-1">Pseudo User ID</label>
                                 <input required type="text" value={dummyReview.userId} onChange={e => setDummyReview({...dummyReview, userId: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5" placeholder="e.g. dummy-user-123" />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium mb-1">Author Name</label>
                                 <input required type="text" value={dummyReview.authorName} onChange={e => setDummyReview({...dummyReview, authorName: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5" placeholder="e.g. John Doe" />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium mb-1">Star Rating (1-5)</label>
                                 <input required type="number" min="1" max="5" value={dummyReview.rating} onChange={e => setDummyReview({...dummyReview, rating: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5" />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium mb-1">Review Comment</label>
                                 <textarea required rows={4} value={dummyReview.comment} onChange={e => setDummyReview({...dummyReview, comment: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5" placeholder="This product is amazing because..." />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium mb-1">Attached Images (Comma separated URLs)</label>
                                 <input type="text" value={dummyReview.imagesStr} onChange={e => setDummyReview({...dummyReview, imagesStr: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5" placeholder="https://img1.jpg, https://img2.jpg" />
                             </div>
                             <div className="flex justify-end pt-4 border-t border-slate-800">
                                 <button type="submit" className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium shadow-lg shadow-purple-500/20 text-white flex gap-2 w-full justify-center"><Icon name="edit-3" className="w-5 h-5"/> Inject Review</button>
                             </div>
                         </form>
                     </div>
                 </div>
             </div>
            )}
        </div>
    );
};

export default AdminStorefront;
