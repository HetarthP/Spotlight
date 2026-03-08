"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card-v2";
import { Button } from "@/components/ui/button";
import VideoPlayer from "@/components/ui/video-player";
import DiagnosticVideoPlayer, { DiagnosticVideoPlayerRef } from "@/components/ui/diagnostic-video-player";
import {
    ChevronLeft,
    Send,
    Scan,
    DollarSign,
    Target,
    Target as TargetIcon,
    AlertCircle,
    Activity,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function VideoAnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const videoId = params.id as string;

    const [analysis, setAnalysis] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMediaReady, setIsMediaReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const playerRef = useRef<DiagnosticVideoPlayerRef>(null);

    const [brandContext, setBrandContext] = useState({
        brand_name: "Tim Hortons",
        industry: "Coffee & Food",
        budget: "$100,000",
        target_demo: "All demographics",
        tone: "Warm, welcoming, iconic",
        goals: "Seamless product integration in high-visibility content",
        product_image_url: "/tims.png"
    });

    // Hardcoded Strategic Slots as requested
    const HARDCODED_SLOTS = [
        {
            id: "slot-1",
            timestamp: "0:05",
            start_time: 5,
            description: "Prime real estate on the coffee table next to Pam. High visibility and neutral background for perfect inpainting.",
            category: "TABLETOP",
            revenue_est: "$450",
            fit_rating: 9,
            accuracy_rating: 95
        },
        {
            id: "slot-2",
            timestamp: "4:24",
            start_time: 264,
            description: "Natural holding position for a coffee cup during the dialogue. Movement is predictable, allowing for stable occlusion tracking.",
            category: "HANDHELD",
            revenue_est: "$1,200",
            fit_rating: 10,
            accuracy_rating: 98
        },
        {
            id: "slot-3",
            timestamp: "7:14",
            start_time: 434,
            description: "Wide shot background placement. Perfect for subtle brand reinforcement without distracting from the main action.",
            category: "BACKGROUND",
            revenue_est: "$750",
            fit_rating: 8,
            accuracy_rating: 92
        }
    ];

    // Served directly from Next.js public folder for instant loading
    const VIDEO_SRC = "/espresso.mp4";
    const API_VIDEO_SRC = "http://localhost:8000/api/video-stream/espresso.mp4";

    useEffect(() => {
        async function fetchAnalysis() {
            try {
                // Fetch from the real backend analyzer 
                const response = await fetch("http://localhost:8000/api/render/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        video_url: API_VIDEO_SRC,
                        product_image_url: brandContext.product_image_url,
                        user_id: "auth0|default"
                    })
                });

                // Even if fetch fails, we follow the user's request to show the hardcoded slots
                let data = null;
                if (response.ok) {
                    data = await response.json();
                }

                // Enforce 3-second buffering screen for UX (Reduced from 5s)
                setTimeout(() => {
                    setAnalysis(data || { detected_slots: HARDCODED_SLOTS, summary: { total_slots: 3, est_revenue: "$2,400", avg_confidence: "95%" } });
                    setIsLoading(false);
                    setIsMediaReady(true);
                    setError(null); // Clear error since we are hardcoding the success path
                }, 3000);

            } catch (error: any) {
                console.warn("API Fetch failed, using hardcoded slots as fallback:", error);

                setTimeout(() => {
                    setAnalysis({
                        detected_slots: HARDCODED_SLOTS,
                        summary: { total_slots: 3, est_revenue: "$2,400", avg_confidence: "95%" }
                    });
                    setIsLoading(false);
                    setIsMediaReady(true);
                    setError(null);
                }, 3000);
            }
        }
        fetchAnalysis();
    }, [videoId]);

    const handleSlotClick = (slot: any) => {
        setActiveSlotId(slot.id);
        if (playerRef.current) {
            playerRef.current.seekToTime(slot.start_time);
        }
    };

    const currentSlots = analysis?.detected_slots || HARDCODED_SLOTS;
    const summary = analysis?.summary || { total_slots: 3, est_revenue: "$2,400", avg_confidence: "95%" };
    const showLoading = (isLoading || !isMediaReady) && !error;

    return (
        <DashboardLayout>
            {/* 1. Loader Overlay */}
            {showLoading && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black gap-4 animate-in fade-in duration-500">
                    <div className="relative w-24 h-24">
                        <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
                        <div className="absolute inset-2 rounded-full border-b-2 border-teal-500 animate-spin-slow" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-mono text-indigo-400 animate-pulse uppercase">Gemini</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-white font-bold text-lg mb-1 tracking-tight">ANALYZING SCENES...</p>
                        <p className="text-gray-500 font-mono text-[10px] animate-pulse uppercase tracking-[0.2em]">
                            Locating Strategic Ad Placements
                        </p>
                    </div>
                </div>
            )}

            {/* 2. Main UI */}
            <div className={cn(
                "relative min-h-screen w-full bg-[#050505] text-white p-8 overflow-x-hidden transition-opacity duration-1000",
                showLoading ? "opacity-0" : "opacity-100"
            )}>
                {/* Header */}
                <button
                    onClick={() => router.push("/library")}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Library</span>
                </button>

                <div className="max-w-[1640px] mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold tracking-tight">Espresso Scene Diagnostic</h1>
                                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    ALIGNED
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase tracking-wider font-mono">Gemini 1.5 Pro</span>
                                <span className="w-1 h-1 rounded-full bg-gray-700" />
                                <span>Real-time Strategic Scan Completed</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end mr-4">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mb-1">Target Product</span>
                                <span className="text-sm font-bold text-teal-400">{brandContext.brand_name}</span>
                            </div>
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 p-1 bg-white/5 shadow-2xl">
                                <img src={brandContext.product_image_url} className="w-full h-full object-contain" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Main Player Area */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="relative rounded-2xl overflow-hidden border border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.8)] bg-black">
                                <DiagnosticVideoPlayer
                                    ref={playerRef}
                                    src={VIDEO_SRC}
                                    onCanPlay={() => setIsMediaReady(true)}
                                    onLoadedMetadata={() => setIsMediaReady(true)}
                                    onTimeUpdate={(t) => setCurrentTime(t)}
                                />
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="p-5 bg-white/[0.02] border-white/[0.05] flex items-center gap-4 hover:bg-white/[0.04] transition-colors group">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10 group-hover:scale-110 transition-transform">
                                        <Scan className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold">{summary.total_slots}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Detected Slots</p>
                                    </div>
                                </Card>
                                <Card className="p-5 bg-white/[0.02] border-white/[0.05] flex items-center gap-4 hover:bg-white/[0.04] transition-colors group">
                                    <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/10 group-hover:scale-110 transition-transform">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold">{summary.est_revenue}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Est. Revenue</p>
                                    </div>
                                </Card>
                                <Card className="p-5 bg-white/[0.02] border-white/[0.05] flex items-center gap-4 hover:bg-white/[0.04] transition-colors group">
                                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/10 group-hover:scale-110 transition-transform">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold">{summary.avg_confidence}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Diag. Confidence</p>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                    <TargetIcon className="w-3.5 h-3.5 text-emerald-500" />
                                    Strategic Opportunities
                                </h2>
                                <Button size="sm" className="bg-white/5 hover:bg-white/10 text-[10px] uppercase font-bold tracking-widest border border-white/10 px-4">
                                    Export All
                                </Button>
                            </div>

                            <div className="space-y-4 overflow-y-auto pr-1 max-h-[720px] custom-scrollbar">
                                <AnimatePresence>
                                    {currentSlots.map((slot: any, idx: number) => (
                                        <motion.div
                                            key={slot.id}
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => handleSlotClick(slot)}
                                        >
                                            <Card className={cn(
                                                "p-5 transition-all cursor-pointer border-white/[0.05] group relative overflow-hidden",
                                                activeSlotId === slot.id
                                                    ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                                                    : "bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                                            )}>
                                                <div className={cn(
                                                    "absolute left-0 top-0 bottom-0 w-1 transition-colors",
                                                    activeSlotId === slot.id ? "bg-emerald-500" : "bg-white/5 group-hover:bg-white/20"
                                                )} />

                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                                            {slot.timestamp}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{slot.category}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs font-black text-white">{slot.revenue_est}</span>
                                                        <span className="text-[8px] text-gray-500 uppercase font-bold">Val</span>
                                                    </div>
                                                </div>

                                                <h3 className="text-[14px] font-bold mb-3 leading-snug group-hover:text-emerald-300 transition-colors">
                                                    {slot.description}
                                                </h3>

                                                <div className="flex items-center gap-6 mb-4">
                                                    <div className="flex-1">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="text-[8px] text-gray-500 uppercase font-black tracking-tighter">Context Fit</span>
                                                            <span className="text-[8px] text-emerald-400 font-bold">{slot.fit_rating}/10</span>
                                                        </div>
                                                        <div className="flex gap-0.5 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                            {[...Array(10)].map((_, i) => (
                                                                <div key={i} className={cn("flex-1", i < slot.fit_rating ? "bg-emerald-500" : "bg-transparent")} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="text-[8px] text-gray-500 uppercase font-black tracking-tighter">Confidence</span>
                                                            <span className="text-[8px] text-indigo-400 font-bold">{slot.accuracy_rating}%</span>
                                                        </div>
                                                        <div className="flex gap-0.5 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                            {[...Array(10)].map((_, i) => (
                                                                <div key={i} className={cn("flex-1", i < (slot.accuracy_rating / 10) ? "bg-indigo-500" : "bg-transparent")} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                    <span className="text-[9px] text-gray-500 italic">Click to preview scene</span>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 text-[9px] uppercase tracking-[0.2em] text-white hover:bg-emerald-500 hover:text-black font-black p-0 px-4 transition-all"
                                                    >
                                                        Queue
                                                    </Button>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <Card className="p-5 bg-emerald-500/5 border-emerald-500/20 group hover:bg-emerald-500/10 transition-colors">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <AlertCircle className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-emerald-400 font-black mb-1 uppercase tracking-widest">Diagnostic Recommendation</p>
                                        <p className="text-[12px] text-gray-400 leading-relaxed font-medium">
                                            "Targeting neutral surfaces near {brandContext.brand_name} brand assets to minimize occlusion artifacting and maximize visual saliency."
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(-360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1a1a1a;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #222;
                }
                .shadow-3xl {
                    shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
            `}</style>
        </DashboardLayout>
    );
}
