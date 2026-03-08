"use client";

import React, { useState } from "react";
import { DollarSign, Eye, Video, TrendingUp } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { motion } from "framer-motion";

const revenueData = [
    { name: "Jan", value: 45000 },
    { name: "Feb", value: 52000 },
    { name: "Mar", value: 48000 },
    { name: "Apr", value: 70000 },
    { name: "May", value: 85000 },
    { name: "Jun", value: 105000 },
];

const categoryData = [
    { name: "Electronics", value: 35, color: "#8B5CF6" }, // Purple
    { name: "Fashion", value: 25, color: "#3B82F6" }, // Blue
    { name: "Food & Bev", value: 20, color: "#D946EF" }, // Pink
    { name: "Fitness", value: 12, color: "#22C55E" }, // Green
    { name: "Other", value: 8, color: "#EAB308" }, // Yellow
];

export default function AnalyticsDashboard() {
    const [timeRange, setTimeRange] = useState("30d");

    return (
        <div className="flex-1 w-full bg-[#0a0a0a] min-h-screen text-white overflow-y-auto overflow-x-hidden p-8 font-sans">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 w-full max-w-7xl mx-auto gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Analytics
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Performance insights and trends
                    </p>
                </div>

                {/* Time Filters */}
                <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-white/5">
                    {["7d", "30d", "90d", "1y"].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${timeRange === range
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto space-y-6">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Revenue Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#111111] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-teal-500/30 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-teal-400" />
                            </div>
                            <span className="text-teal-400 text-xs font-semibold flex items-center bg-teal-500/10 px-2 py-1 rounded-full">
                                ↗ +23.1%
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">$128.4K</h3>
                        <p className="text-gray-500 text-sm">Revenue</p>
                    </motion.div>

                    {/* Placements Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#111111] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Eye className="w-5 h-5 text-purple-400" />
                            </div>
                            <span className="text-teal-400 text-xs font-semibold flex items-center bg-teal-500/10 px-2 py-1 rounded-full">
                                ↗ +18.2%
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">347</h3>
                        <p className="text-gray-500 text-sm">Placements</p>
                    </motion.div>

                    {/* Videos Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[#111111] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Video className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-teal-400 text-xs font-semibold flex items-center bg-teal-500/10 px-2 py-1 rounded-full">
                                ↗ +12.5%
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">1,284</h3>
                        <p className="text-gray-500 text-sm">Videos</p>
                    </motion.div>

                    {/* Demand Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-[#111111] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-yellow-500/30 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-yellow-400" />
                            </div>
                            <span className="text-teal-400 text-xs font-semibold flex items-center bg-teal-500/10 px-2 py-1 rounded-full">
                                ↗ +5.2%
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">89%</h3>
                        <p className="text-gray-500 text-sm">Demand</p>
                    </motion.div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-[#111111] border border-white/5 rounded-2xl p-6 lg:col-span-2 flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-semibold tracking-wider text-gray-400">REVENUE</h3>
                            <span className="text-xs text-gray-500">Last 6 months</span>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#666"
                                        tick={{ fill: '#666', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#666"
                                        tick={{ fill: '#666', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => \`$\${value / 1000}K\`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: number) => [\`$\${value.toLocaleString()}\`, 'Revenue']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#8B5CF6"
                                        strokeWidth={3}
                                        dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4, stroke: '#1a1a1a' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Category Pie Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                        className="bg-[#111111] border border-white/5 rounded-2xl p-6 flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-semibold tracking-wider text-gray-400">BY CATEGORY</h3>
                        </div>
                        <div className="h-[240px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={\`cell-\${index}\`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: number) => [\`\${value}%\`, 'Share']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Custom Legend */}
                        <div className="mt-2 space-y-3">
                            {categoryData.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-gray-300">{item.name}</span>
                                    </div>
                                    <span className="text-gray-500">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
