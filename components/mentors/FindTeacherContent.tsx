"use client";

import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { MentorMatchWizard } from "@/components/marketing/MentorMatchWizard";
import { HorizontalTeacherCard } from "@/components/marketing/HorizontalTeacherCard";
import { ShieldCheck, Search, SlidersHorizontal, ChevronDown, X, ArrowUp, Filter, Star, Globe, Languages, Users, Zap, Award, Clock } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { PackagesList } from "@/components/mentors/PackagesList";


import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TopicTicker } from "@/components/marketing/TopicTicker";
import { FeaturedMentorCarousel } from "@/components/marketing/FeaturedMentorCarousel";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { FeaturedMentor } from "@/app/data/marketing/get-marketing-data";

export interface TeacherWithProfile {
    id: string;
    name: string;
    image: string;
    headline: string;
    rating: number;
    reviewCount: number;
    hourlyRate: number;
    teaches: string[];
    speaks: string[];
    description: string;
    country: string;
    gender: string;
    experience: number;
    isVerified: boolean;
    availability: any;
}

interface FindTeacherContentProps {
    teachers: TeacherWithProfile[];
    featuredMentors: FeaturedMentor[];
    categories?: any[]; // Array of categories with children
    allLanguages?: string[];
    packages?: any[];
    currency?: { code: string; symbol: string; factor: number };
}

export function FindTeacherContent({ 
    teachers, 
    featuredMentors, 
    categories = [], 
    allLanguages = [], 
    packages = [],
    currency = { code: "USD", symbol: "$", factor: 1 }
}: FindTeacherContentProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
    const [categorySearch, setCategorySearch] = useState("");
    const [subcategorySearch, setSubcategorySearch] = useState("");
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isSubcategoryOpen, setIsSubcategoryOpen] = useState(false);

    const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
    const [sortBy, setSortBy] = useState("popularity");
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // New Filters
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
    const [selectedGender, setSelectedGender] = useState<string | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [minRating, setMinRating] = useState<number | null>(null);
    const [experienceRange, setExperienceRange] = useState<[number, number]>([0, 30]);
    const [isOnlineOnly, setIsOnlineOnly] = useState(false);

    const [languageSearch, setLanguageSearch] = useState("");
    const [countrySearch, setCountrySearch] = useState("");
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const [isCountryOpen, setIsCountryOpen] = useState(false);

    const availabilityOptions = ["Instant Booking", "Free Trial", "Weekends"];

    // Filter and search logic
    const filteredTeachers = useMemo(() => {
        // Handle case when teachers is undefined or null
        if (!teachers || !Array.isArray(teachers)) {
            return [];
        }

        const filtered = teachers.filter(teacher => {
            // Search filter
            const matchesSearch = searchQuery === "" ||
                teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                teacher.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                teacher.teaches.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

            // Category filter
            const matchesCategory = !selectedCategory ||
                teacher.teaches.some(t => t.toLowerCase() === selectedCategory.toLowerCase());

            // Subcategory filter
            const matchesSubCategory = !selectedSubCategory ||
                teacher.teaches.some(t => t.toLowerCase() === selectedSubCategory.toLowerCase());

            // Price filter
            const isMaxPrice = priceRange[1] === 10000;
            const matchesPrice = teacher.hourlyRate >= priceRange[0] && (isMaxPrice ? true : teacher.hourlyRate <= priceRange[1]);

            // New filters
            const matchesLanguage = !selectedLanguage || teacher.speaks.some(s => s.toLowerCase() === selectedLanguage.toLowerCase());
            const matchesGender = !selectedGender || teacher.gender?.toLowerCase() === selectedGender.toLowerCase();
            const matchesCountry = !selectedCountry || teacher.country?.toLowerCase() === selectedCountry.toLowerCase();
            const matchesRating = !minRating || teacher.rating >= minRating;
            const matchesExperience = teacher.experience >= experienceRange[0] && teacher.experience <= experienceRange[1];
            
            // Online status is a bit tricky, for now we match any teacher if not toggled, 
            // otherwise we'd need real-time data or a flag. Assuming isVerified for "Online" for demo if toggled.
            const matchesOnline = !isOnlineOnly || teacher.isVerified; 

            return matchesSearch && matchesCategory && matchesSubCategory && matchesPrice && matchesLanguage && 
                   matchesGender && matchesCountry && matchesRating && matchesExperience && matchesOnline;
        });

        // Sorting Logic
        return filtered.sort((a, b) => {
            switch (sortBy) {
                case "price-low":
                    return a.hourlyRate - b.hourlyRate;
                case "price-high":
                    return b.hourlyRate - a.hourlyRate;
                case "rating":
                    return b.rating - a.rating;
                case "newest":
                    return 0;
                case "popularity":
                default:
                    return b.reviewCount - a.reviewCount; // Popularity by review count
            }
        });
    }, [searchQuery, selectedCategory, selectedSubCategory, priceRange, sortBy, teachers, 
        selectedLanguage, selectedGender, selectedCountry, minRating, experienceRange, isOnlineOnly]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, selectedSubCategory, priceRange, sortBy, 
        selectedLanguage, selectedGender, selectedCountry, minRating, experienceRange, isOnlineOnly]);

    // Paginated results
    const paginatedTeachers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTeachers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTeachers, currentPage]);

    const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);

    // Scroll detection
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const toggleAvailability = (opt: string) => {
        setSelectedAvailability(prev =>
            prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
        );
    };

    const clearAllFilters = () => {
        setSearchQuery("");
        setSelectedCategory(null);
        setSelectedSubCategory(null);
        setSelectedAvailability([]);
        setPriceRange([0, 10000]);
        setSelectedLanguage(null);
        setSelectedGender(null);
        setSelectedCountry(null);
        setMinRating(null);
        setExperienceRange([0, 30]);
        setIsOnlineOnly(false);
    };

    const activeFiltersCount = (selectedCategory ? 1 : 0) + 
                             (selectedSubCategory ? 1 : 0) + 
                             (selectedLanguage ? 1 : 0) + 
                             (selectedGender ? 1 : 0) + 
                             (selectedCountry ? 1 : 0) + 
                             (minRating ? 1 : 0) + 
                             (isOnlineOnly ? 1 : 0) + 
                             selectedAvailability.length;

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#0f172a] font-sans text-slate-900 dark:text-slate-50 pb-20">
            {/* Hero Section with Blue Theme */}
            <div className="bg-white dark:bg-[#1e293b] pt-32 pb-24 relative overflow-hidden transition-colors duration-300 ease-in-out border-b border-slate-200 dark:border-slate-800">
                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                }}></div>

                {/* Blue Glow Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">

                    {/* Top Badge - Blue */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-8 backdrop-blur-sm"
                    >
                        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Access Top 1% Global Talent
                    </motion.div>

                    {/* Main Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight"
                    >
                        Find Your Perfect <br />
                        <span className="relative inline-block text-blue-600 dark:text-blue-400">
                            Mentor
                            <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-200 dark:text-blue-800 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                            </svg>
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed"
                    >
                        Connect with industry experts from top companies for 1-on-1 guidance,
                        code reviews, and career advice.
                    </motion.p>

                    {/* Search Bar - Blue Accent */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="relative max-w-2xl mx-auto"
                    >
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
                            <div className="relative flex items-center bg-white dark:bg-[#0f172a] rounded-full border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-2xl shadow-blue-900/5 p-2 transition-all">
                                <Search className="w-6 h-6 text-slate-400 dark:text-slate-500 ml-4" />
                                <Input
                                    type="text"
                                    placeholder="Search by skill, company, or name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 text-base h-12 focus-visible:ring-0 focus-visible:ring-offset-0 px-4"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                )}
                                <Button className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all shadow-lg shadow-blue-600/20">
                                    Search
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Trust Indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm font-medium text-slate-500 dark:text-slate-400"
                    >
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                            Verified Experts
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                            Secure Payments
                        </div>
                        <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-blue-500 fill-blue-500 dark:text-blue-400 dark:fill-blue-400" />
                            4.9/5 Average Rating
                        </div>
                    </motion.div>

                    {/* Active Filter Chips */}
                    <AnimatePresence>
                        {(activeFiltersCount > 0 || searchQuery) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-8 flex flex-wrap items-center justify-center gap-2"
                            >
                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 mr-2">Active Filters:</span>
                                {selectedCategory && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-200 cursor-pointer gap-1 pl-3 pr-2 py-1.5"
                                        onClick={() => setSelectedCategory(null)}
                                    >
                                        Category: {selectedCategory}
                                        <X className="h-3 w-3" />
                                    </Badge>
                                )}
                                {selectedSubCategory && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-200 cursor-pointer gap-1 pl-3 pr-2 py-1.5"
                                        onClick={() => setSelectedSubCategory(null)}
                                    >
                                        SubCategory: {selectedSubCategory}
                                        <X className="h-3 w-3" />
                                    </Badge>
                                )}
                                {selectedLanguage && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800 hover:bg-indigo-200 cursor-pointer gap-1 pl-3 pr-2 py-1.5"
                                        onClick={() => setSelectedLanguage(null)}
                                    >
                                        Language: {selectedLanguage}
                                        <X className="h-3 w-3" />
                                    </Badge>
                                )}
                                {selectedCountry && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-200 cursor-pointer gap-1 pl-3 pr-2 py-1.5"
                                        onClick={() => setSelectedCountry(null)}
                                    >
                                        Country: {selectedCountry}
                                        <X className="h-3 w-3" />
                                    </Badge>
                                )}
                                {selectedGender && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-200 cursor-pointer gap-1 pl-3 pr-2 py-1.5"
                                        onClick={() => setSelectedGender(null)}
                                    >
                                        Gender: {selectedGender}
                                        <X className="h-3 w-3" />
                                    </Badge>
                                )}
                                {minRating && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-200 cursor-pointer gap-1 pl-3 pr-2 py-1.5"
                                        onClick={() => setMinRating(null)}
                                    >
                                        Rating: {minRating}+ Stars
                                        <X className="h-3 w-3" />
                                    </Badge>
                                )}
                                {isOnlineOnly && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800 hover:bg-rose-200 cursor-pointer gap-1 pl-3 pr-2 py-1.5"
                                        onClick={() => setIsOnlineOnly(false)}
                                    >
                                        Online Now
                                        <X className="h-3 w-3" />
                                    </Badge>
                                )}
                                {activeFiltersCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearAllFilters}
                                        className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                    >
                                        Clear All
                                    </Button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="container mx-auto px-6 max-w-7xl py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Sidebar Filters */}
                    <div className="lg:col-span-3 hidden lg:block space-y-6">
                        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 sticky top-24 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                    <SlidersHorizontal className="w-5 h-5 text-blue-600" /> Filters
                                </h3>
                                {activeFiltersCount > 0 && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={clearAllFilters}
                                        className="text-xs font-semibold text-blue-600 hover:underline"
                                    >
                                        Reset ({activeFiltersCount})
                                    </motion.button>
                                )}
                            </div>

                            {/* Filter Groups */}
                            <div className="space-y-6">
                                {/* Online Now Toggle */}
                                <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Online Now</span>
                                    </div>
                                    <Switch 
                                        checked={isOnlineOnly}
                                        onCheckedChange={setIsOnlineOnly}
                                    />
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                {/* Categories / Profile Filter */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Award className="w-4 h-4 text-blue-500" /> Subject / Category
                                    </h4>

                                    <Popover open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
                                        <PopoverTrigger asChild>
                                            <div
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm flex items-center justify-between cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                                            >
                                                <span className={selectedCategory ? "text-slate-900 dark:text-white font-medium" : "text-slate-500 dark:text-slate-400"}>
                                                    {selectedCategory || "Select Subject"}
                                                </span>
                                                <ChevronDown className="h-4 w-4 text-slate-400" />
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[280px] p-0" align="start">
                                            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                                                <Input
                                                    placeholder="Search subjects..."
                                                    value={categorySearch}
                                                    onChange={(e) => setCategorySearch(e.target.value)}
                                                    className="h-9 border-none bg-slate-50 dark:bg-slate-800 focus-visible:ring-0"
                                                />
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto p-1">
                                                {categories
                                                    .filter((cat: any) => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
                                                    .map((cat: any, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => {
                                                                if (selectedCategory === cat.name) {
                                                                    setSelectedCategory(null);
                                                                    setSelectedSubCategory(null);
                                                                } else {
                                                                    setSelectedCategory(cat.name);
                                                                    setSelectedSubCategory(null);
                                                                    if (cat.children && cat.children.length > 0) {
                                                                        setTimeout(() => setIsSubcategoryOpen(true), 100);
                                                                    }
                                                                }
                                                                setIsCategoryOpen(false);
                                                            }}
                                                            className={cn(
                                                                "flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer transition-colors",
                                                                selectedCategory === cat.name
                                                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200"
                                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                                            )}
                                                        >
                                                            {cat.name}
                                                            {selectedCategory === cat.name && <Check className="h-4 w-4" />}
                                                        </div>
                                                    ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    {/* Subcategory Dropdown - Only if parent has children */}
                                    {selectedCategory && (categories.find((c: any) => c.name === selectedCategory) as any)?.children?.length > 0 && (
                                        <Popover open={isSubcategoryOpen} onOpenChange={setIsSubcategoryOpen}>
                                            <PopoverTrigger asChild>
                                                <div
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm flex items-center justify-between cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors animate-in fade-in slide-in-from-top-2"
                                                >
                                                    <span className={selectedSubCategory ? "text-slate-900 dark:text-white font-medium" : "text-slate-500 dark:text-slate-400"}>
                                                        {selectedSubCategory || "Select Subcategory"}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[280px] p-0" align="start">
                                                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                                                    <Input
                                                        placeholder="Search subcategories..."
                                                        value={subcategorySearch}
                                                        onChange={(e) => setSubcategorySearch(e.target.value)}
                                                        className="h-9 border-none bg-slate-50 dark:bg-slate-800 focus-visible:ring-0"
                                                    />
                                                </div>
                                                <div className="max-h-[300px] overflow-y-auto p-1">
                                                    {(categories.find((c: any) => c.name === selectedCategory) as any)?.children
                                                        .filter((sub: any) => sub.name.toLowerCase().includes(subcategorySearch.toLowerCase()))
                                                        .map((sub: any, idx: number) => (
                                                            <div
                                                                key={idx}
                                                                onClick={() => {
                                                                    setSelectedSubCategory(sub.name === selectedSubCategory ? null : sub.name);
                                                                    setIsSubcategoryOpen(false);
                                                                }}
                                                                className={cn(
                                                                    "flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer transition-colors",
                                                                    selectedSubCategory === sub.name
                                                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200"
                                                                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                                                )}
                                                            >
                                                                {sub.name}
                                                                {selectedSubCategory === sub.name && <Check className="h-4 w-4" />}
                                                            </div>
                                                        ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                {/* Languages Filter */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Languages className="w-4 h-4 text-indigo-500" /> Language of Instruction
                                    </h4>

                                    <Popover open={isLanguageOpen} onOpenChange={setIsLanguageOpen}>
                                        <PopoverTrigger asChild>
                                            <div
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm flex items-center justify-between cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
                                            >
                                                <span className={selectedLanguage ? "text-slate-900 dark:text-white font-medium" : "text-slate-500 dark:text-slate-400"}>
                                                    {selectedLanguage || "Select Language"}
                                                </span>
                                                <ChevronDown className="h-4 w-4 text-slate-400" />
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[280px] p-0" align="start">
                                            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                                                <Input
                                                    placeholder="Search languages..."
                                                    value={languageSearch}
                                                    onChange={(e) => setLanguageSearch(e.target.value)}
                                                    className="h-9 border-none bg-slate-50 dark:bg-slate-800 focus-visible:ring-0"
                                                />
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto p-1">
                                                {allLanguages
                                                    .filter(lang => lang.toLowerCase().includes(languageSearch.toLowerCase()))
                                                    .map((lang, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => {
                                                                setSelectedLanguage(lang === selectedLanguage ? null : lang);
                                                                setIsLanguageOpen(false);
                                                            }}
                                                            className={cn(
                                                                "flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer transition-colors",
                                                                selectedLanguage === lang
                                                                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-200"
                                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                                            )}
                                                        >
                                                            {lang}
                                                            {selectedLanguage === lang && <Check className="h-4 w-4" />}
                                                        </div>
                                                    ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                {/* Country Filter */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-emerald-500" /> Country
                                    </h4>

                                    <Popover open={isCountryOpen} onOpenChange={setIsCountryOpen}>
                                        <PopoverTrigger asChild>
                                            <div
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm flex items-center justify-between cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
                                            >
                                                <span className={selectedCountry ? "text-slate-900 dark:text-white font-medium" : "text-slate-500 dark:text-slate-400"}>
                                                    {selectedCountry || "Select Country"}
                                                </span>
                                                <ChevronDown className="h-4 w-4 text-slate-400" />
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[280px] p-0" align="start">
                                            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                                                <Input
                                                    placeholder="Search countries..."
                                                    value={countrySearch}
                                                    onChange={(e) => setCountrySearch(e.target.value)}
                                                    className="h-9 border-none bg-slate-50 dark:bg-slate-800 focus-visible:ring-0"
                                                />
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto p-1">
                                                {Array.from(new Set(teachers.map(t => t.country)))
                                                    .filter(c => c && c.toLowerCase().includes(countrySearch.toLowerCase()))
                                                    .map((country, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => {
                                                                setSelectedCountry(country === selectedCountry ? null : country);
                                                                setIsCountryOpen(false);
                                                            }}
                                                            className={cn(
                                                                "flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer transition-colors",
                                                                selectedCountry === country
                                                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200"
                                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                                            )}
                                                        >
                                                            {country}
                                                            {selectedCountry === country && <Check className="h-4 w-4" />}
                                                        </div>
                                                    ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                {/* Gender Filter */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-purple-500" /> Gender
                                    </h4>
                                    <RadioGroup 
                                        value={selectedGender || "all"} 
                                        onValueChange={(val) => setSelectedGender(val === "all" ? null : val)}
                                        className="flex flex-col gap-2"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="all" id="g-all" />
                                            <Label htmlFor="g-all" className="text-sm font-normal cursor-pointer">All</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="Male" id="g-male" />
                                            <Label htmlFor="g-male" className="text-sm font-normal cursor-pointer">Male</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="Female" id="g-female" />
                                            <Label htmlFor="g-female" className="text-sm font-normal cursor-pointer">Female</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                {/* Experience Filter */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-orange-500" /> Experience (Years)
                                    </h4>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-xs flex-1 text-center font-medium">{experienceRange[0]}y</div>
                                        <span className="text-slate-400">-</span>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-xs flex-1 text-center font-medium">{experienceRange[1]}y+</div>
                                    </div>
                                    <Slider
                                        defaultValue={[0, 30]}
                                        max={30}
                                        step={1}
                                        value={experienceRange}
                                        onValueChange={(val) => setExperienceRange(val as [number, number])}
                                        className="py-4"
                                    />
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                {/* Ratings Filter */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Star className="w-4 h-4 text-amber-500" /> Minimum Rating
                                    </h4>
                                    <div className="flex flex-col gap-2">
                                        {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                                            <div 
                                                key={rating}
                                                onClick={() => setMinRating(minRating === rating ? null : rating)}
                                                className={cn(
                                                    "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border",
                                                    minRating === rating 
                                                        ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" 
                                                        : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
                                                )}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star 
                                                            key={i} 
                                                            className={cn(
                                                                "w-3 h-3", 
                                                                i < Math.floor(rating) ? "text-amber-500 fill-amber-500" : "text-slate-300"
                                                            )} 
                                                        />
                                                    ))}
                                                    <span className="text-xs font-semibold ml-1">{rating}+</span>
                                                </div>
                                                {minRating === rating && <Check className="w-3 h-3 text-amber-600" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                {/* Price Range */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                        Hourly Rate <ChevronDown className="w-4 h-4 text-slate-400" />
                                    </h4>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-sm flex-1 text-center font-medium">{currency.symbol}{priceRange[0]}</div>
                                        <span className="text-slate-400">-</span>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-sm flex-1 text-center font-medium">{currency.symbol}{priceRange[1]}+</div>
                                    </div>
                                    <Slider
                                        defaultValue={[0, 10000]}
                                        max={10000}
                                        step={100}
                                        value={priceRange}
                                        onValueChange={(val) => setPriceRange(val as [number, number])}
                                        className="py-4"
                                    />
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                {/* Availability */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                        Availability <ChevronDown className="w-4 h-4 text-slate-400" />
                                    </h4>
                                    <div className="space-y-2">
                                        {availabilityOptions.map(opt => (
                                            <motion.div
                                                key={opt}
                                                className="flex items-center space-x-2"
                                                whileHover={{ x: 2 }}
                                            >
                                                <Checkbox
                                                    id={opt}
                                                    checked={selectedAvailability.includes(opt)}
                                                    onCheckedChange={() => toggleAvailability(opt)}
                                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                />
                                                <Label
                                                    htmlFor={opt}
                                                    className="text-sm font-normal text-slate-600 dark:text-slate-400 cursor-pointer"
                                                >
                                                    {opt}
                                                </Label>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Teacher Lists */}
                    <div className="lg:col-span-9 space-y-6">
                        <PackagesList packages={packages} currency={currency} />

                        {/* Mobile Filter Button */}
                        <div className="lg:hidden">
                            <Button
                                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                                variant="outline"
                                className="w-full justify-between bg-white dark:bg-[#1e293b]"
                            >
                                <span className="flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                                </span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
                            </Button>
                        </div>

                        {/* Sort Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
                        >
                            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                Showing <span className="text-slate-900 dark:text-white font-bold">
                                    {filteredTeachers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredTeachers.length)}
                                </span> of {filteredTeachers.length} Professional Mentors
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500">Sort By:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    // @ts-ignore
                                    suppressHydrationWarning
                                    className="bg-slate-50 dark:bg-slate-800 border-none text-sm font-semibold rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-blue-600"
                                >
                                    <option value="popularity">Popularity</option>
                                    <option value="newest">Newest</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="rating">Rating: High to Low</option>
                                </select>
                            </div>
                        </motion.div>

                        {/* List */}
                        <AnimatePresence mode="popLayout">
                            {paginatedTeachers.length > 0 ? (
                                <div className="flex flex-col gap-6">
                                    {paginatedTeachers.map((teacher, index) => (
                                        <motion.div
                                            key={teacher.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <HorizontalTeacherCard teacher={teacher} currency={currency} />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-20"
                                >
                                    <div className="text-6xl mb-4">🔍</div>
                                    <h3 className="text-2xl font-bold mb-2">No mentors found</h3>
                                    <p className="text-slate-500 mb-4">Try adjusting your filters or search query</p>
                                    <Button onClick={clearAllFilters} variant="outline">
                                        Clear All Filters
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Pagination Visual */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-12 gap-2">
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    {'<'}
                                </Button>
                                
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <Button 
                                        key={i + 1}
                                        variant={currentPage === i + 1 ? "default" : "outline"}
                                        size="icon"
                                        className={currentPage === i + 1 ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </Button>
                                ))}
                                
                                <Button 
                                    variant="outline" 
                                    size="icon"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    {'>'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Scroll to Top Button */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        onClick={scrollToTop}
                        className="fixed bottom-8 right-8 p-4 bg-blue-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:bg-blue-700 hover:scale-110 transition-all z-50"
                    >
                        <ArrowUp className="h-6 w-6" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
