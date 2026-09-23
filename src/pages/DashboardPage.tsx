import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi';
import { jobApi } from '../api/jobApi';
import { productApi } from '../api/productApi';
import { professionalApi } from '../api/professionalApi';
import { payoutApi, type PayoutRecord, type CreatorPayoutDetails } from '../api/payoutApi';
import type { Booking } from '../types/booking';
import type { JobRequest } from '../types/job';
import type { Product } from '../types/product';
import type { ProfessionalProfile } from '../types/professional';
import { useAuthStore } from '../store/authStore';
import { 
  LayoutDashboard,
  Calendar, 
  Radio, 
  MapPin, 
  MessageSquare, 
  Loader2,
  TrendingUp,
  Eye,
  Star,
  ShoppingBag,
  Package,
  CreditCard,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  ShieldCheck,
  Film,
  Trash2,
  Smartphone,
  Plus,
  Tv,
  Scale,
  FileText,
  AlertTriangle,
  Image as ImageIcon,
  UploadCloud,
  ZoomIn,
  Link as LinkIcon,
  User,
  UtensilsCrossed,
  Search,
  Edit3
} from 'lucide-react';
import type { VideoReelItem, MenuDishItem } from '../types/professional';
import { authApi } from '../api/authApi';
import { ShootContractModal } from '../components/ShootContractModal';
import { PhotoProofingModal } from '../components/PhotoProofingModal';
import { CallSheetModal } from '../components/CallSheetModal';
import { cloudStorageApi } from '../api/cloudStorageApi';
import { ImageLightboxModal } from '../components/ImageLightboxModal';
import { isCustomAvatar } from '../utils/avatarUtils';
import { CustomSelect } from '../components/CustomSelect';
import { ProductCard } from '../components/ProductCard';

type ProTab = 'overview' | 'bookings' | 'sales_rentals' | 'listings' | 'jobboard' | 'availability' | 'earnings' | 'client';

export const DashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading, activeRole, setActiveRole } = useAuthStore();
  const navigate = useNavigate();

  const isProRole = user?.role === 'professional' || activeRole === 'professional';
  const paramTab = searchParams.get('tab') as ProTab | null;
  const initialTab: ProTab = paramTab || (isProRole ? 'overview' : 'client');

  const [activeTab, setActiveTab] = useState<ProTab>(initialTab);
  const [proProfile, setProProfile] = useState<ProfessionalProfile | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  // Caterer & Home Baker archetype detection
  const isBaker = Boolean(
    proProfile?.categories?.some(c =>
      c.toLowerCase().includes('baker') ||
      c.toLowerCase().includes('bake') ||
      c.toLowerCase().includes('cake') ||
      c.toLowerCase().includes('pastry')
    )
  );

  const isCaterer = Boolean(
    isBaker ||
    proProfile?.categories?.some(c =>
      c.toLowerCase().includes('cater') ||
      c.toLowerCase().includes('chef') ||
      c.toLowerCase().includes('food') ||
      c.toLowerCase().includes('culinary')
    )
  );

  // Swiggy-style catering menu filters
  const [swiggyCategoryFilter, setSwiggyCategoryFilter] = useState<string>('All');
  const [swiggyVegOnly, setSwiggyVegOnly] = useState<boolean>(false);
  const [swiggySearchQuery, setSwiggySearchQuery] = useState<string>('');

  const filteredDishes = useMemo(() => {
    const dishes = proProfile?.menuItems || [];
    return dishes.filter((dish) => {
      if (swiggyCategoryFilter !== 'All' && dish.category !== swiggyCategoryFilter) {
        return false;
      }
      const isVeg = dish.dietaryTags?.some(t => t === 'Veg' || t === 'Jain' || t === 'Vegan');
      if (swiggyVegOnly && !isVeg) {
        return false;
      }
      if (swiggySearchQuery.trim()) {
        const q = swiggySearchQuery.toLowerCase();
        const matchName = dish.name.toLowerCase().includes(q);
        const matchDesc = dish.description ? dish.description.toLowerCase().includes(q) : false;
        const matchCat = dish.category.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [proProfile?.menuItems, swiggyCategoryFilter, swiggyVegOnly, swiggySearchQuery]);

  const vegDishesCount = useMemo(() => {
    return (proProfile?.menuItems || []).filter(d => 
      d.dietaryTags?.some(t => t === 'Veg' || t === 'Jain' || t === 'Vegan')
    ).length;
  }, [proProfile?.menuItems]);

  const nonVegDishesCount = useMemo(() => {
    return (proProfile?.menuItems || []).filter(d => 
      d.dietaryTags?.includes('Non-Veg')
    ).length;
  }, [proProfile?.menuItems]);

  // Data states
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [clientJobs, setClientJobs] = useState<JobRequest[]>([]);
  const [proJobBoard, setProJobBoard] = useState<JobRequest[]>([]);
  const [proBookings, setProBookings] = useState<Booking[]>([]);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [creatorAccount, setCreatorAccount] = useState<CreatorPayoutDetails | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Availability calendar state
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  // Modals state
  const [showListGearModal, setShowListGearModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [payoutInProgress, setPayoutInProgress] = useState(false);

  // Video Reel Modal state (Direct File Upload Only - Instagram Reels style)
  const [showReelModal, setShowReelModal] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [generatedThumbnailBlob, setGeneratedThumbnailBlob] = useState<Blob | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<string | null>(null);
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelCategory, setNewReelCategory] = useState('Cinematography');
  const [newReelIsShort, setNewReelIsShort] = useState(true);
  const [savingReel, setSavingReel] = useState(false);

  // Catering Menu Dish Modal state
  const [showDishModal, setShowDishModal] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState<MenuDishItem['category']>('Starter');
  const [dishPrice, setDishPrice] = useState<number>(250);
  const [dishDietaryTags, setDishDietaryTags] = useState<MenuDishItem['dietaryTags']>(['Veg']);
  const [dishDescription, setDishDescription] = useState('');
  const [dishImageUrl, setDishImageUrl] = useState('');
  const [dishMinQuantity, setDishMinQuantity] = useState('');
  const [dishUnit, setDishUnit] = useState('');
  const [dishPrepTime, setDishPrepTime] = useState('');
  const [uploadingDishImage, setUploadingDishImage] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [savingDish, setSavingDish] = useState(false);
  const dishFileInputRef = useRef<HTMLInputElement>(null);

  // Portfolio Photos Modal & Upload state
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [portfolioUploadProgress, setPortfolioUploadProgress] = useState<string | null>(null);
  const [showAddPhotoUrlModal, setShowAddPhotoUrlModal] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Lightbox state for previewing full images
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // New product form
  const [newGearTitle, setNewGearTitle] = useState('');
  const [newGearCategory, setNewGearCategory] = useState('Cameras');
  const [newGearType, setNewGearType] = useState<'rental' | 'sale'>('rental');
  const [newGearPrice, setNewGearPrice] = useState<number>(0);
  const [newGearCondition, setNewGearCondition] = useState('Brand New');
  const [newGearImage, setNewGearImage] = useState('');
  const [newGearDesc, setNewGearDesc] = useState('');

  // Payout account form
  const [payoutUpi, setPayoutUpi] = useState('');
  const [payoutAccNum, setPayoutAccNum] = useState('');
  const [payoutIfsc, setPayoutIfsc] = useState('');
  const [payoutHolder, setPayoutHolder] = useState('');

  // Shoot Contract Modal State
  const [selectedContractBooking, setSelectedContractBooking] = useState<Booking | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);

  // Camqrew Vault (Photo Proofing) Modal State
  const [selectedVaultBooking, setSelectedVaultBooking] = useState<Booking | null>(null);
  const [showVaultModal, setShowVaultModal] = useState(false);

  // Digital Call Sheet Modal State
  const [selectedCallSheetBooking, setSelectedCallSheetBooking] = useState<Booking | null>(null);
  const [showCallSheetModal, setShowCallSheetModal] = useState(false);

  // Account Deletion State
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeletingAccount(true);
    setDeleteAccountError('');
    try {
      await authApi.deleteAccount();
      navigate('/');
    } catch (err: any) {
      setDeleteAccountError(err.message || 'Failed to delete account.');
      setDeletingAccount(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !user) {
      navigate('/login?redirect=/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (paramTab) {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Pro Profile and Dashboard Data
  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch Client Bookings & Jobs
      const [cBookings, cJobs] = await Promise.all([
        bookingApi.getCustomerBookings().catch(() => []),
        jobApi.getClientJobs(user.id).catch(() => []),
      ]);
      setCustomerBookings(cBookings);
      setClientJobs(cJobs);

      // 2. If Professional, fetch pro profile, pro bookings, open leads, listings & payouts
      if (isProRole) {
        try {
          const profile = await professionalApi.getProfileById(user.id);
          setProProfile(profile);
          if (profile.blockedDates && Array.isArray(profile.blockedDates)) {
            setBlockedDates(profile.blockedDates);
          }
        } catch {
          // Provide clean zero defaults for new creator
          const fallbackPro: ProfessionalProfile = {
            id: user.id,
            userId: user.id,
            name: user.name || 'Creative Studio',
            title: 'Creative Professional',
            avatar: user.avatar || '',
            bannerImage: '',
            verified: false,
            rating: 0,
            reviewCount: 0,
            experienceYears: 0,
            ratePerDay: 0,
            bio: '',
            city: '',
            state: '',
            district: '',
            locations: [],
            categories: [],
            equipment: [],
            certifications: [],
            portfolio: [],
            services: [],
            reviews: [],
            weeklyAvailability: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false },
            blockedDates: [],
            totalEarnings: 0,
            views: 0
          };
          setProProfile(fallbackPro);
        }

        const [openJobs, pBookings, products, payoutHistory, acc] = await Promise.all([
          jobApi.getOpenJobs(undefined, user.id).catch(() => []),
          bookingApi.getProfessionalBookings().catch(() => []),
          productApi.getUserProducts().catch(() => []),
          payoutApi.getPayoutHistory().catch(() => []),
          payoutApi.getCreatorAccount().catch(() => null),
        ]);

        setProJobBoard(openJobs);
        setProBookings(pBookings);
        setUserProducts(products);
        setPayouts(payoutHistory);

        if (acc) {
          setCreatorAccount(acc);
          setPayoutUpi(acc.upiId);
          setPayoutAccNum(acc.accountNumber);
          setPayoutIfsc(acc.ifscCode);
          setPayoutHolder(acc.accountHolderName);
        }
      }
    } catch (err) {
      console.warn('Dashboard data fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboardData();
    }
  }, [isAuthenticated, user, isProRole]);

  const handleTabChange = (tab: ProTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleAcceptLead = async (jobId: string) => {
    if (!user) return;
    setActionLoading(jobId);
    try {
      await jobApi.acceptJob(jobId, user.id);
      showToast('Lead Accepted! The client has been notified to review your profile and confirm booking.');
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to accept lead');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    setActionLoading(`accept-${bookingId}`);
    try {
      await bookingApi.acceptBooking(bookingId);
      showToast('Booking request accepted! Client notified for milestone escrow payment.');
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to accept booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to decline this booking request?')) return;
    setActionLoading(`decline-${bookingId}`);
    try {
      await bookingApi.declineBooking(bookingId);
      showToast('Booking request declined.');
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to decline booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectVideoFile = (file: File) => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|mkv|avi|3gp)$/i.test(file.name);
    if (!isVideo) {
      alert('Please select a valid video file (.mp4, .mov, .webm, .m4v)');
      return;
    }
    if (file.size > 300 * 1024 * 1024) {
      alert('Video file size exceeds the 300MB limit. Please compress or select a smaller clip.');
      return;
    }
    setSelectedVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(objectUrl);
    setGeneratedThumbnailBlob(null);

    if (!newReelTitle) {
      setNewReelTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    // Capture first frame poster and check aspect ratio
    const tempVid = document.createElement('video');
    tempVid.preload = 'metadata';
    tempVid.src = objectUrl;
    tempVid.muted = true;
    tempVid.playsInline = true;

    tempVid.onloadedmetadata = () => {
      setNewReelIsShort(tempVid.videoHeight >= tempVid.videoWidth);
      tempVid.currentTime = Math.min(1.0, (tempVid.duration || 2) / 3);
    };

    tempVid.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = tempVid.videoWidth || 720;
        canvas.height = tempVid.videoHeight || 1280;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempVid, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) setGeneratedThumbnailBlob(blob);
          }, 'image/jpeg', 0.85);
        }
      } catch (e) {
        console.warn('Could not generate thumbnail frame:', e);
      }
    };
  };

  const handleAddVideoReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideoFile) {
      alert('Please choose a video file (.mp4, .mov, .webm) to upload.');
      return;
    }

    setSavingReel(true);
    try {
      setVideoUploadProgress('Uploading video to Camqrew Reels...');
      const uploadRes = await cloudStorageApi.uploadVideo(selectedVideoFile, 'reels');

      let finalThumb: string | undefined = undefined;
      if (generatedThumbnailBlob) {
        try {
          setVideoUploadProgress('Generating reel cover poster...');
          const thumbFile = new File([generatedThumbnailBlob], `thumb_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const thumbRes = await cloudStorageApi.uploadImage(thumbFile, 'portfolio');
          finalThumb = thumbRes.url;
        } catch (thumbErr) {
          console.warn('Thumbnail upload skipped:', thumbErr);
        }
      }

      setVideoUploadProgress('Publishing reel to creator profile...');
      const newReel: VideoReelItem = {
        id: 'reel_' + Date.now(),
        title: newReelTitle.trim() || selectedVideoFile.name.replace(/\.[^/.]+$/, ''),
        url: uploadRes.url,
        type: 'direct',
        embedUrl: uploadRes.url,
        thumbnailUrl: finalThumb,
        category: newReelCategory || 'Cinematography',
        isShort: newReelIsShort,
      };

      const existingReels = proProfile?.videoReels || [];
      const updatedReels = [newReel, ...existingReels];

      await professionalApi.updateProfile({ videoReels: updatedReels });
      setProProfile(prev => prev ? { ...prev, videoReels: updatedReels } : null);
      showToast('🎉 Reel successfully published to your creator profile!');

      // Reset state
      setSelectedVideoFile(null);
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
        setVideoPreviewUrl(null);
      }
      setGeneratedThumbnailBlob(null);
      setVideoUploadProgress(null);
      setShowReelModal(false);
      setNewReelTitle('');
    } catch (err: any) {
      alert(err.message || 'Failed to upload video reel');
    } finally {
      setSavingReel(false);
      setVideoUploadProgress(null);
    }
  };

  const handleDeleteVideoReel = async (reelId: string) => {
    if (!confirm('Are you sure you want to remove this video reel from your public profile?')) return;
    try {
      const existingReels = proProfile?.videoReels || [];
      const updatedReels = existingReels.filter(r => r.id !== reelId);
      await professionalApi.updateProfile({ videoReels: updatedReels });
      setProProfile(prev => prev ? { ...prev, videoReels: updatedReels } : null);
      showToast('Video reel removed from profile.');
    } catch (err: any) {
      alert(err.message || 'Failed to remove reel');
    }
  };

  // Catering & Bakery Menu Dish Handlers
  const handleOpenAddDish = () => {
    setEditingDishId(null);
    setDishName('');
    setDishCategory(isBaker ? 'Cakes' : 'Starter');
    setDishPrice(isBaker ? 450 : 250);
    setDishDietaryTags(['Veg']);
    setDishDescription('');
    setDishImageUrl('');
    setDishMinQuantity(isBaker ? '0.5 Kg' : '');
    setDishUnit(isBaker ? 'Kg' : 'plate');
    setDishPrepTime(isBaker ? '24 Hours Notice' : '');
    setShowImageUrlInput(false);
    setShowDishModal(true);
  };

  const handleOpenEditDish = (dish: MenuDishItem) => {
    setEditingDishId(dish.id);
    setDishName(dish.name);
    setDishCategory(dish.category);
    setDishPrice(dish.pricePerPlate);
    setDishDietaryTags(dish.dietaryTags || ['Veg']);
    setDishDescription(dish.description || '');
    setDishImageUrl(dish.imageUrl || '');
    setDishMinQuantity(dish.minQuantity || '');
    setDishUnit(dish.unit || (isBaker ? 'Kg' : 'plate'));
    setDishPrepTime(dish.prepTime || '');
    setShowImageUrlInput(Boolean(dish.imageUrl && !dish.imageUrl.includes('supabase')));
    setShowDishModal(true);
  };

  const handleDishImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    setUploadingDishImage(true);
    try {
      const res = await cloudStorageApi.uploadImage(file, 'portfolio');
      setDishImageUrl(res.url);
      showToast('Dish photo uploaded successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to upload dish image');
    } finally {
      setUploadingDishImage(false);
    }
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) {
      alert(isBaker ? 'Please enter an item name.' : 'Please enter a dish name.');
      return;
    }
    if (!dishPrice || Number(dishPrice) <= 0) {
      alert('Please enter a valid price.');
      return;
    }

    setSavingDish(true);
    try {
      const existingDishes = proProfile?.menuItems || [];
      let updatedDishes: MenuDishItem[];

      if (editingDishId) {
        updatedDishes = existingDishes.map((d) =>
          d.id === editingDishId
            ? {
                ...d,
                name: dishName.trim(),
                category: dishCategory,
                pricePerPlate: Number(dishPrice),
                dietaryTags: dishDietaryTags.length > 0 ? dishDietaryTags : ['Veg'],
                description: dishDescription.trim() || undefined,
                imageUrl: dishImageUrl.trim() || undefined,
                minQuantity: dishMinQuantity.trim() || undefined,
                unit: dishUnit.trim() || undefined,
                prepTime: dishPrepTime.trim() || undefined,
              }
            : d
        );
      } else {
        const newDish: MenuDishItem = {
          id: 'dish_' + Date.now(),
          name: dishName.trim(),
          category: dishCategory,
          pricePerPlate: Number(dishPrice),
          dietaryTags: dishDietaryTags.length > 0 ? dishDietaryTags : ['Veg'],
          description: dishDescription.trim() || undefined,
          imageUrl: dishImageUrl.trim() || undefined,
          minQuantity: dishMinQuantity.trim() || undefined,
          unit: dishUnit.trim() || undefined,
          prepTime: dishPrepTime.trim() || undefined,
          isAvailable: true,
        };
        updatedDishes = [newDish, ...existingDishes];
      }

      await professionalApi.updateProfile({ menuItems: updatedDishes });
      setProProfile((prev) => (prev ? { ...prev, menuItems: updatedDishes } : null));
      showToast(editingDishId ? (isBaker ? 'Item updated successfully!' : 'Dish updated successfully!') : (isBaker ? '🎉 New bake item added to your menu!' : '🎉 New dish added to your catering menu!'));
      setShowDishModal(false);
      setEditingDishId(null);
      setDishName('');
      setDishPrice(250);
      setDishDietaryTags(['Veg']);
      setDishDescription('');
      setDishImageUrl('');
      setDishMinQuantity('');
      setDishUnit('');
      setDishPrepTime('');
      setShowImageUrlInput(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save menu dish');
    } finally {
      setSavingDish(false);
    }
  };

  const handleToggleDishAvailability = async (dishId: string) => {
    try {
      const existingDishes = proProfile?.menuItems || [];
      const updatedDishes = existingDishes.map((d) =>
        d.id === dishId ? { ...d, isAvailable: !d.isAvailable } : d
      );
      await professionalApi.updateProfile({ menuItems: updatedDishes });
      setProProfile((prev) => (prev ? { ...prev, menuItems: updatedDishes } : null));
      showToast('Dish status updated.');
    } catch (err: any) {
      alert(err.message || 'Failed to update dish');
    }
  };

  const handleDeleteDish = async (dishId: string) => {
    if (!confirm('Are you sure you want to remove this dish from your catering menu?')) return;
    try {
      const existingDishes = proProfile?.menuItems || [];
      const updatedDishes = existingDishes.filter((d) => d.id !== dishId);
      await professionalApi.updateProfile({ menuItems: updatedDishes });
      setProProfile((prev) => (prev ? { ...prev, menuItems: updatedDishes } : null));
      showToast('Dish removed from menu.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete dish');
    }
  };

  // Portfolio Photos handlers
  const handleUploadPortfolioFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      alert('Please select valid image files (JPG, PNG, WEBP, etc.).');
      return;
    }

    setUploadingPortfolio(true);
    setPortfolioUploadProgress(`Uploading 1 of ${fileArray.length}...`);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < fileArray.length; i++) {
        setPortfolioUploadProgress(`Uploading ${i + 1} of ${fileArray.length}...`);
        const res = await cloudStorageApi.uploadImage(fileArray[i], 'portfolio');
        uploadedUrls.push(res.url);
      }

      const existingPortfolio = proProfile?.portfolio || [];
      const updatedPortfolio = [...uploadedUrls, ...existingPortfolio];

      await professionalApi.updateProfile({ portfolio: updatedPortfolio });
      setProProfile(prev => prev ? { ...prev, portfolio: updatedPortfolio } : null);
      showToast(`🎉 Successfully added ${fileArray.length} photo${fileArray.length > 1 ? 's' : ''} to your portfolio!`);
    } catch (err: any) {
      console.error('Failed to upload portfolio images:', err);
      alert(err.message || 'Failed to upload portfolio images. Please try again.');
    } finally {
      setUploadingPortfolio(false);
      setPortfolioUploadProgress(null);
    }
  };

  const handleAddPhotoByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;

    setActionLoading('add-photo-url');
    try {
      const existingPortfolio = proProfile?.portfolio || [];
      const updatedPortfolio = [newPhotoUrl.trim(), ...existingPortfolio];

      await professionalApi.updateProfile({ portfolio: updatedPortfolio });
      setProProfile(prev => prev ? { ...prev, portfolio: updatedPortfolio } : null);
      showToast('🎉 Image successfully added to your portfolio!');
      setShowAddPhotoUrlModal(false);
      setNewPhotoUrl('');
    } catch (err: any) {
      alert(err.message || 'Failed to save portfolio photo');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePortfolioPhoto = async (photoUrl: string) => {
    if (!confirm('Are you sure you want to remove this photo from your portfolio?')) return;
    try {
      const existingPortfolio = proProfile?.portfolio || [];
      const updatedPortfolio = existingPortfolio.filter(p => p !== photoUrl);

      await professionalApi.updateProfile({ portfolio: updatedPortfolio });
      setProProfile(prev => prev ? { ...prev, portfolio: updatedPortfolio } : null);
      showToast('Portfolio photo removed.');
    } catch (err: any) {
      alert(err.message || 'Failed to remove photo');
    }
  };

  // Toggle date in Availability Calendar
  const handleToggleDate = (dateStr: string) => {
    setBlockedDates((prev) => {
      const isBlocked = prev.includes(dateStr);
      const next = isBlocked ? prev.filter((d) => d !== dateStr) : [...prev, dateStr];
      showToast(isBlocked ? `Marked ${dateStr} as Available` : `Marked ${dateStr} as Blocked / Booked`);
      return next;
    });
  };

  // List gear submission
  const handleCreateGear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGearTitle.trim()) return;
    setActionLoading('create-gear');

    try {
      const created = await productApi.createProduct({
        name: newGearTitle,
        category: newGearCategory,
        type: newGearType,
        price: newGearPrice,
        rentalPricePerDay: newGearType === 'rental' ? newGearPrice : undefined,
        condition: newGearCondition as any,
        image: newGearImage,
        description: newGearDesc,
        inStock: true,
      });

      setUserProducts((prev) => [created, ...prev]);
      setShowListGearModal(false);
      setNewGearTitle('');
      setNewGearDesc('');
      showToast('Gear successfully listed to Camqrew Store!');
    } catch (err: any) {
      alert(err.message || 'Failed to list equipment');
    } finally {
      setActionLoading(null);
    }
  };

  // Instant Payout Request
  const handleRequestInstantPayout = async () => {
    const clearedBalance = proBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
      - payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
    const availableAmount = Math.max(0, clearedBalance);

    if (availableAmount <= 0) {
      alert('You currently have ₹0 cleared balance available for payout.');
      return;
    }
    if (!creatorAccount?.upiId) {
      alert('Please link your UPI ID before requesting a payout.');
      setShowAccountModal(true);
      return;
    }

    setPayoutInProgress(true);
    try {
      const record = await payoutApi.requestInstantPayout(availableAmount, 'upi');
      setPayouts((prev) => [record, ...prev]);
      showToast(`Payout sent! ₹${availableAmount.toLocaleString('en-IN')} transferred to ${creatorAccount.upiId}`);
    } catch (err: any) {
      alert(err.message || 'Payout transfer failed');
    } finally {
      setPayoutInProgress(false);
    }
  };

  // Save creator payout account
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      upiId: payoutUpi,
      accountNumber: payoutAccNum,
      ifscCode: payoutIfsc,
      accountHolderName: payoutHolder,
    };
    await payoutApi.saveCreatorAccount(updated);
    setCreatorAccount(updated);
    setShowAccountModal(false);
    showToast('Payout account details updated successfully!');
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const days: { day: number; dateStr: string; isBlocked: boolean; isToday: boolean }[] = [];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        isBlocked: blockedDates.includes(dateStr),
        isToday: dateStr === todayStr,
      });
    }

    return { firstDay, daysInMonth, days };
  }, [calendarYear, calendarMonth, blockedDates]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (isLoading || (!isAuthenticated && !user)) {
    return (
      <div className="container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Loader2 size={36} className="animate-spin" color="var(--accent, #3fb668)" />
        <p style={{ color: 'var(--text-muted, #888)', fontSize: '14px' }}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page container" style={{ paddingBottom: 60, minHeight: '80vh' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="dashboard-toast">
          <CheckCircle2 size={16} color="#3fb668" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── TOP HERO HEADER: PRO STUDIO DASHBOARD ── */}
      <div className="pro-dashboard-header-card card">
        <div className="pro-header-profile-col">
          <div className="pro-avatar-wrapper">
            {isCustomAvatar(user?.avatar || proProfile?.avatar) ? (
              <img 
                src={user?.avatar || proProfile?.avatar} 
                alt={user?.name} 
                className="pro-header-avatar"
              />
            ) : (
              <div className="pro-header-avatar pro-header-avatar-placeholder">
                <User size={36} />
              </div>
            )}
            {proProfile?.verified && (
              <span className="pro-verified-badge" title="Verified Creator">
                <ShieldCheck size={14} color="#ffffff" />
              </span>
            )}
          </div>

          <div className="pro-header-details">
            <div className="pro-studio-tag-row">
              <span className="pro-studio-tag">
                <span className="live-dot" /> PRO STUDIO DASHBOARD
              </span>
              <button 
                className={`availability-toggle-btn ${isAvailable ? 'is-available' : 'is-busy'}`}
                onClick={() => setIsAvailable((prev) => !prev)}
                title="Click to toggle studio availability status"
              >
                <span className="status-circle" />
                {isAvailable ? 'Available for Shoots' : 'Busy / On Shoot'}
              </button>
            </div>

            <h1 className="pro-header-name">{user?.name || proProfile?.name || 'Creative Studio'}</h1>
            <p className="pro-header-title">
              {proProfile?.title || 'Visual Storyteller & Creator'} • 📍 {proProfile?.city || 'Mumbai'}, {proProfile?.state || 'Maharashtra'}
            </p>

            <div className="pro-meta-pills">
              <span className="meta-pill rating-pill">
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                <strong>{proProfile?.rating ? proProfile.rating.toFixed(1) : '0.0'}</strong> ({proProfile?.reviewCount || 0} reviews)
              </span>
              <span className="meta-pill">
                Rate: <strong>₹{(proProfile?.ratePerDay || 0).toLocaleString('en-IN')}/day</strong>
              </span>
              <span className="meta-pill">
                Experience: <strong>{proProfile?.experienceYears || 0} Years</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Action Buttons */}
        <div className="pro-header-actions">
          {user && (
            <Link 
              to={`/creators/${user.id}`} 
              className="btn btn-outline btn-sm"
              target="_blank"
              title="View your public booking page as seen by clients"
            >
              <ExternalLink size={14} /> Public Profile
            </Link>
          )}

          {isCaterer ? (
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleOpenAddDish}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <UtensilsCrossed size={14} /> {isBaker ? '+ Add Bake / Item' : '+ Add Menu Dish'}
            </button>
          ) : (
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setShowListGearModal(true)}
            >
              <Package size={14} /> + List Gear
            </button>
          )}

          {/* Quick role switch for testing or multi-role users */}
          <button 
            className="btn btn-ghost btn-sm role-switch-btn"
            onClick={() => {
              const nextRole = isProRole ? 'customer' : 'professional';
              setActiveRole(nextRole);
              showToast(`Switched view to ${nextRole === 'professional' ? 'Creator Mode' : 'Client Mode'}`);
            }}
            title="Toggle between Creator Studio and Client View"
          >
            {isProRole ? '⇄ Client Mode' : '⇄ Creator Mode'}
          </button>
        </div>
      </div>

      {/* ── NAVIGATION TABS BAR ── */}
      <div className="pro-tabs-container">
        <button
          className={`pro-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          <LayoutDashboard size={15} /> Overview
        </button>

        <button
          className={`pro-tab-item ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => handleTabChange('bookings')}
        >
          <Calendar size={15} /> Service Bookings ({proBookings.length})
        </button>

        <button
          className={`pro-tab-item ${activeTab === 'sales_rentals' ? 'active' : ''}`}
          onClick={() => handleTabChange('sales_rentals')}
        >
          <ShoppingBag size={15} /> {isCaterer ? (isBaker ? 'Bakery Orders' : 'Menu Orders') : 'Sales & Rentals'}
        </button>

        <button
          className={`pro-tab-item ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => handleTabChange('listings')}
        >
          {isCaterer ? (
            <>
              <UtensilsCrossed size={15} /> {isBaker ? 'Bakes & Food Menu' : 'Food Menu & Prices'} ({proProfile?.menuItems?.length || 0})
            </>
          ) : (
            <>
              <Package size={15} /> My Gear Store ({userProducts.length})
            </>
          )}
        </button>

        <button
          className={`pro-tab-item ${activeTab === 'jobboard' ? 'active' : ''}`}
          onClick={() => handleTabChange('jobboard')}
        >
          <Radio size={15} /> Broadcast Job Board ({proJobBoard.length})
        </button>

        <button
          className={`pro-tab-item ${activeTab === 'availability' ? 'active' : ''}`}
          onClick={() => handleTabChange('availability')}
        >
          <Clock size={15} /> Availability Calendar
        </button>

        <button
          className={`pro-tab-item ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => handleTabChange('earnings')}
        >
          <CreditCard size={15} /> Payouts & Earnings
        </button>

        <button
          className={`pro-tab-item client-tab ${activeTab === 'client' ? 'active' : ''}`}
          onClick={() => handleTabChange('client')}
        >
          ⇄ Client Bookings ({customerBookings.length})
        </button>
      </div>

      {/* ── TAB CONTENT ── */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading your creator studio dashboard...</p>
        </div>
      ) : (
        <>
          {/* ═════════════════════════════════════════════════════════
              TAB 1: STUDIO OVERVIEW (MATCHING MOBILE APP OVERVIEW)
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="tab-overview-content">
              {/* 4 Stat Cards */}
              <div className="pro-stats-grid">
                <div className="pro-stat-card card">
                  <div className="stat-icon-wrap emerald">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <span className="stat-label">Total Studio Earnings</span>
                    <h3 className="stat-number">₹{(proProfile?.totalEarnings || 0).toLocaleString('en-IN')}</h3>
                    <span className="stat-subtext">Verified escrow releases</span>
                  </div>
                </div>

                <div className="pro-stat-card card">
                  <div className="stat-icon-wrap blue">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <span className="stat-label">This Month Bookings</span>
                    <h3 className="stat-number">{proBookings.length} Shoots</h3>
                    <span className="stat-subtext">Active & confirmed schedule</span>
                  </div>
                </div>

                <div className="pro-stat-card card">
                  <div className="stat-icon-wrap purple">
                    <Eye size={20} />
                  </div>
                  <div>
                    <span className="stat-label">Profile Views</span>
                    <h3 className="stat-number">{(proProfile?.views || 0).toLocaleString('en-IN')}</h3>
                    <span className="stat-subtext">30-day client impressions</span>
                  </div>
                </div>

                <div className="pro-stat-card card">
                  <div className="stat-icon-wrap amber">
                    <Star size={20} fill="#f59e0b" color="#f59e0b" />
                  </div>
                  <div>
                    <span className="stat-label">Average Client Rating</span>
                    <h3 className="stat-number">{proProfile?.rating ? `${proProfile.rating.toFixed(1)} ★` : '0.0 ★'}</h3>
                    <span className="stat-subtext">From {proProfile?.reviewCount || 0} verified reviews</span>
                  </div>
                </div>
              </div>

              {/* Revenue & Category Breakdown Charts Grid */}
              <div className="pro-charts-row">
                {/* Monthly Revenue Bar Chart */}
                <div className="card pro-chart-card">
                  <div className="chart-header">
                    <div>
                      <h3 className="chart-title">Monthly Revenue Trend</h3>
                      <p className="chart-subtitle">Escrow payouts received in 2026</p>
                    </div>
                    <span className="chart-highlight-pill">₹{(proProfile?.totalEarnings || 0).toLocaleString('en-IN')} total</span>
                  </div>

                  <div className="revenue-bars-wrap">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((m) => (
                      <div key={m} className="revenue-bar-col">
                        <div className="revenue-bar-track">
                          <div 
                            className="revenue-bar-fill"
                            style={{ height: '0%' }}
                            title={`${m}: ₹0`}
                          />
                        </div>
                        <span className="bar-label">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bookings by Category Card */}
                <div className="card pro-chart-card">
                  <div className="chart-header">
                    <div>
                      <h3 className="chart-title">Bookings by Category</h3>
                      <p className="chart-subtitle">Distribution of creative services</p>
                    </div>
                    <span className="chart-highlight-pill">{proBookings.length} Total Shoots</span>
                  </div>

                  {proBookings.length === 0 ? (
                    <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Calendar size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>No shoot bookings recorded yet</p>
                    </div>
                  ) : (
                    <div className="category-breakdown-list">
                      {proBookings.slice(0, 5).map((b, idx) => (
                        <div key={idx} className="cat-breakdown-item">
                          <div className="cat-breakdown-meta">
                            <div className="cat-name-dot">
                              <span className="cat-dot" style={{ background: '#3fb668' }} />
                              <span className="cat-name">{b.serviceTitle || 'Shoot Service'}</span>
                            </div>
                            <span className="cat-stats">
                              <strong>₹{b.totalAmount?.toLocaleString('en-IN')}</strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Studio Action Cards */}
              <h3 className="section-heading" style={{ marginTop: 28, marginBottom: 16 }}>
                Studio Management Shortcuts
              </h3>
              <div className="quick-actions-grid">
                <div 
                  className="quick-action-card card clickable"
                  onClick={() => handleTabChange('availability')}
                >
                  <div className="action-icon emerald"><Clock size={20} /></div>
                  <h4>Manage Availability</h4>
                  <p>Block shoot dates and sync your production calendar</p>
                  <span className="action-arrow">Open Calendar →</span>
                </div>

                {isCaterer ? (
                  <div 
                    className="quick-action-card card clickable"
                    onClick={() => handleTabChange('listings')}
                  >
                    <div className="action-icon emerald"><UtensilsCrossed size={20} /></div>
                    <h4>Food Menu & Prices</h4>
                    <p>Manage catering dishes, per-plate pricing, veg/non-veg tags, and live menu availability</p>
                    <span className="action-arrow">Open Menu Manager →</span>
                  </div>
                ) : (
                  <div 
                    className="quick-action-card card clickable"
                    onClick={() => setShowListGearModal(true)}
                  >
                    <div className="action-icon blue"><Package size={20} /></div>
                    <h4>Sell or Rent Your Gear</h4>
                    <p>List idle cameras and lenses on Camqrew Store for passive income</p>
                    <span className="action-arrow">List New Equipment →</span>
                  </div>
                )}

                <div 
                  className="quick-action-card card clickable"
                  onClick={() => handleTabChange('jobboard')}
                >
                  <div className="action-icon purple"><Radio size={20} /></div>
                  <h4>Broadcast Leads Pool</h4>
                  <p>Review and pitch open shoot requirements in your district</p>
                  <span className="action-arrow">View {proJobBoard.length} Open Leads →</span>
                </div>

                <div 
                  className="quick-action-card card clickable"
                  onClick={() => handleTabChange('earnings')}
                >
                  <div className="action-icon amber"><CreditCard size={20} /></div>
                  <h4>Instant UPI Payouts</h4>
                  <p>Withdraw cleared escrow balances directly to your bank account</p>
                  <span className="action-arrow">Request Payout →</span>
                </div>
              </div>

              {/* ── PORTFOLIO PHOTOS & GALLERY MANAGER ── */}
              <div 
                className={`card pro-portfolio-manager-card ${isDraggingOver ? 'dragging-over' : ''}`} 
                style={{ marginTop: 28 }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleUploadPortfolioFiles(e.dataTransfer.files);
                  }
                }}
              >
                <div className="section-header-inline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 className="section-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ImageIcon size={20} color="var(--accent, #3fb668)" />
                      My Portfolio Photos & Gallery
                      <span className="badge-sub" style={{ fontSize: 12, padding: '2px 8px' }}>
                        {proProfile?.portfolio?.length || 0} photos
                      </span>
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                      Upload high-resolution photography, stills, and creative lookbooks to showcase on your public booking profile.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      id="portfolio-file-upload-input"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      disabled={uploadingPortfolio}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleUploadPortfolioFiles(e.target.files);
                          e.target.value = '';
                        }
                      }}
                    />
                    <label
                      htmlFor="portfolio-file-upload-input"
                      className={`btn btn-primary btn-sm ${uploadingPortfolio ? 'disabled' : ''}`}
                      style={{ cursor: uploadingPortfolio ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }}
                    >
                      {uploadingPortfolio ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>{portfolioUploadProgress || 'Uploading...'}</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={14} />
                          <span>+ Upload Photos</span>
                        </>
                      )}
                    </label>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowAddPhotoUrlModal(true)}
                      disabled={uploadingPortfolio}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <LinkIcon size={14} />
                      <span>+ Add by URL</span>
                    </button>
                  </div>
                </div>

                {/* Uploading progress notification banner */}
                {uploadingPortfolio && (
                  <div className="portfolio-upload-progress-banner" style={{ background: 'rgba(63, 182, 104, 0.12)', border: '1px solid rgba(63, 182, 104, 0.3)', padding: '10px 16px', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Loader2 size={16} className="animate-spin" color="var(--accent, #3fb668)" />
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                      {portfolioUploadProgress || 'Uploading photos to Supabase Storage...'}
                    </span>
                  </div>
                )}

                {/* Drag and drop overlay hint */}
                {isDraggingOver && (
                  <div className="portfolio-drag-overlay" style={{ border: '2px dashed var(--accent, #3fb668)', borderRadius: 12, padding: 24, textAlign: 'center', background: 'rgba(63, 182, 104, 0.08)', marginBottom: 16 }}>
                    <UploadCloud size={32} color="var(--accent, #3fb668)" style={{ margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--accent, #3fb668)' }}>Drop photos here to upload directly</p>
                  </div>
                )}

                {(!proProfile?.portfolio || proProfile.portfolio.length === 0) ? (
                  <div className="empty-portfolio-box" style={{ textAlign: 'center', padding: '40px 20px', border: '1.5px dashed rgba(255,255,255,0.12)', borderRadius: 12 }}>
                    <ImageIcon size={38} className="empty-portfolio-icon" style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                    <h4 style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--text-primary)' }}>No portfolio photos uploaded yet</h4>
                    <p style={{ margin: '0 auto 16px', maxWidth: 460, fontSize: 13, color: 'var(--text-secondary)' }}>
                      Drag and drop images here, or upload your favorite client shoots, editorial photos, and commercial stills.
                    </p>
                    <label
                      htmlFor="portfolio-file-upload-input"
                      className="btn btn-primary btn-sm"
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <UploadCloud size={14} /> Upload First Photo
                    </label>
                  </div>
                ) : (
                  <div className="pro-dashboard-portfolio-grid">
                    {proProfile.portfolio.map((photoUrl, idx) => (
                      <div key={idx} className="pro-portfolio-item-card">
                        <div 
                          className="pro-portfolio-img-container"
                          onClick={() => {
                            setLightboxIndex(idx);
                            setLightboxOpen(true);
                          }}
                        >
                          <img 
                            src={photoUrl} 
                            alt={`Portfolio ${idx + 1}`} 
                            className="pro-portfolio-thumb-img" 
                            loading="lazy" 
                          />
                          <div className="pro-portfolio-overlay-hover">
                            <span className="pro-portfolio-zoom-btn" title="View Fullscreen">
                              <ZoomIn size={18} />
                            </span>
                          </div>
                        </div>

                        <div className="pro-portfolio-item-footer">
                          <span className="pro-portfolio-idx-badge">Photo {idx + 1}</span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              className="pro-portfolio-action-btn view"
                              onClick={() => {
                                setLightboxIndex(idx);
                                setLightboxOpen(true);
                              }}
                              title="Preview high-res image"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              type="button"
                              className="pro-portfolio-action-btn delete"
                              onClick={() => handleDeletePortfolioPhoto(photoUrl)}
                              title="Delete photo from portfolio"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── SHOWREELS & VIDEO REELS MANAGER ── */}
              <div className="card pro-reels-manager-card" style={{ marginTop: 28 }}>
                <div className="section-header-inline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 className="section-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Film size={20} color="var(--accent, #3fb668)" />
                      My Video Reels & Showreels
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                      Upload high-definition reels & vertical video clips (MP4, MOV, WebM) directly to your profile, exactly like Instagram Reels.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Link
                      to="/reels"
                      className="btn btn-outline btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      title="View how your reels appear in the full-screen discovery feed"
                    >
                      <Film size={14} /> Open Reels Feed ↗
                    </Link>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelectedVideoFile(null);
                        setVideoPreviewUrl(null);
                        setGeneratedThumbnailBlob(null);
                        setNewReelTitle('');
                        setNewReelIsShort(true);
                        setShowReelModal(true);
                      }}
                    >
                      <Plus size={14} /> + Upload Video Reel
                    </button>
                  </div>
                </div>

                {(!proProfile?.videoReels || proProfile.videoReels.length === 0) ? (
                  <div className="empty-reels-box">
                    <Film size={36} className="empty-reels-icon" />
                    <h4>No video reels added yet</h4>
                    <p>Upload real video files, cinematic teasers, and 9:16 vertical reels to showcase your work to clients.</p>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowReelModal(true)}
                      style={{ marginTop: 12 }}
                    >
                      <Plus size={14} /> Upload First Reel
                    </button>
                  </div>
                ) : (
                  <div className="pro-dashboard-reels-grid">
                    {proProfile.videoReels.map((reel) => (
                      <div key={reel.id} className="pro-dashboard-reel-card">
                        <div className="pro-reel-thumb-container">
                          {reel.thumbnailUrl ? (
                            <img 
                              src={reel.thumbnailUrl} 
                              alt={reel.title} 
                              className="pro-reel-thumb-img"
                            />
                          ) : (reel.type === 'direct' || reel.url?.includes('.mp4')) ? (
                            <video 
                              src={reel.url || reel.embedUrl}
                              preload="metadata"
                              muted
                              playsInline
                              className="pro-reel-thumb-img"
                              style={{ objectFit: 'cover', background: '#000' }}
                            />
                          ) : (
                            <img 
                              src="https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=800" 
                              alt={reel.title} 
                              className="pro-reel-thumb-img"
                            />
                          )}
                          <span className="pro-reel-type-pill">
                            {reel.isShort ? '9:16 Reel' : '16:9 Cinema'}
                          </span>
                        </div>
                        <div className="pro-reel-details">
                          <h4 className="pro-reel-card-title">{reel.title}</h4>
                          <span className="pro-reel-category-pill">{reel.category || 'Cinematography'}</span>
                          <div className="pro-reel-footer-row">
                            <a 
                              href={reel.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="pro-reel-external-link"
                            >
                              <ExternalLink size={12} /> View Video
                            </a>
                            <button 
                              type="button"
                              className="pro-reel-delete-btn"
                              onClick={() => handleDeleteVideoReel(reel.id)}
                              title="Delete reel"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── CATERING & BAKERY MENU MANAGER ── */}
              {isCaterer && (
                <div className="card pro-menu-manager-card" style={{ marginTop: 28 }}>
                  <div className="section-header-inline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h3 className="section-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <UtensilsCrossed size={20} color="var(--accent, #3fb668)" />
                        {isBaker ? 'Cakes, Bakes & Food Menu' : 'Catering Menu & Dishes'}
                        <span className="badge-sub" style={{ fontSize: 12, padding: '2px 8px' }}>
                          {proProfile?.menuItems?.length || 0} {isBaker ? 'items' : 'dishes'}
                        </span>
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {isBaker 
                          ? 'List your signature cakes, baked goods, and foods with minimum batch quantities so clients can order directly.'
                          : 'List your signature dishes and catering items so clients can select what they need and receive an instant quotation.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleTabChange('listings')}
                      >
                        Open Full Menu Manager →
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleOpenAddDish}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Plus size={14} /> {isBaker ? '+ Add Bake / Item' : '+ Add Dish'}
                      </button>
                    </div>
                  </div>

                  {(!proProfile?.menuItems || proProfile.menuItems.length === 0) ? (
                    <div className="empty-portfolio-box" style={{ textAlign: 'center', padding: '40px 20px', border: '1.5px dashed rgba(255,255,255,0.12)', borderRadius: 12 }}>
                      <UtensilsCrossed size={38} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                      <h4 style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--text-primary)' }}>No dishes added to your menu yet</h4>
                      <p style={{ margin: '0 auto 16px', maxWidth: 460, fontSize: 13, color: 'var(--text-secondary)' }}>
                        Add starters, main courses, desserts, and live counters with per-plate pricing so customers can calculate quotations without contacting you.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleOpenAddDish}
                      >
                        <Plus size={14} /> Add First Dish
                      </button>
                    </div>
                  ) : (
                    <div className="pro-dashboard-dishes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                      {proProfile.menuItems.map((dish) => {
                        const isGreen = dish.dietaryTags?.some(t => t === 'Veg' || t === 'Jain' || t === 'Vegan');
                        return (
                          <div key={dish.id} className="pro-dish-card card" style={{ padding: '14px 16px', background: 'var(--surface-elevated, #161a1f)', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                  <span 
                                    style={{ 
                                      display: 'inline-block',
                                      width: 10,
                                      height: 10,
                                      borderRadius: '50%',
                                      backgroundColor: isGreen ? '#22c55e' : '#ef4444',
                                      flexShrink: 0
                                    }} 
                                    title={isGreen ? 'Vegetarian' : 'Non-Vegetarian'} 
                                  />
                                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{dish.name}</h4>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '4px 0 6px' }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(63, 182, 104, 0.15)', color: 'var(--accent, #3fb668)' }}>
                                    {dish.category}
                                  </span>
                                  {dish.minQuantity && (
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                                      Min: {dish.minQuantity}
                                    </span>
                                  )}
                                  {dish.prepTime && (
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                      <Clock size={10} /> Prep: {dish.prepTime}
                                    </span>
                                  )}
                                  {dish.dietaryTags?.map(t => (
                                    <span key={t} style={{ 
                                      fontSize: 10, 
                                      fontWeight: 700, 
                                      padding: '2px 6px', 
                                      borderRadius: 4, 
                                      background: (t === 'Veg' || t === 'Jain' || t === 'Vegan') ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                      color: (t === 'Veg' || t === 'Jain' || t === 'Vegan') ? '#16a34a' : '#dc2626'
                                    }}>
                                      {t}
                                    </span>
                                  ))}
                                </div>
                                {dish.description && (
                                  <p style={{ margin: '4px 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                    {dish.description}
                                  </p>
                                )}
                                <div style={{ marginTop: 8 }}>
                                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent, #3fb668)' }}>
                                    ₹{dish.pricePerPlate.toLocaleString('en-IN')}
                                  </span>
                                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                                    /{dish.unit || (isBaker ? 'kg' : 'plate')}
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                {dish.imageUrl && (
                                  <img 
                                    src={dish.imageUrl} 
                                    alt={dish.name} 
                                    style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-color, #e5e7eb)', flexShrink: 0 }} 
                                  />
                                )}
                                <button
                                  type="button"
                                  className={`dish-status-toggle-btn ${dish.isAvailable ? 'live' : 'hidden'}`}
                                  onClick={() => handleToggleDishAvailability(dish.id)}
                                  title="Click to toggle visibility on public profile"
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: 12,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: dish.isAvailable ? 'rgba(34, 197, 94, 0.15)' : 'rgba(150, 150, 150, 0.15)',
                                    color: dish.isAvailable ? '#22c55e' : 'var(--text-muted)'
                                  }}
                                >
                                  {dish.isAvailable ? '● Live' : '○ Hidden'}
                                </button>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-xs"
                                    onClick={() => handleOpenEditDish(dish)}
                                    title="Edit dish"
                                    style={{ fontSize: 11, padding: '2px 6px' }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-xs"
                                    onClick={() => handleDeleteDish(dish.id)}
                                    title="Delete dish"
                                    style={{ color: 'var(--danger, #ef4444)', padding: '2px 6px' }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── LEGAL, PRIVACY & DANGER ZONE ── */}
              <div className="card legal-danger-zone-card" style={{ marginTop: 28, borderColor: 'rgba(239,68,68,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                      <Scale size={18} color="var(--accent)" />
                      Legal, Compliance & Account Security
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                      Review our DPDP Act 2023 Privacy Policy, Milestone Escrow Rules, or manage your account data rights.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Link to="/terms" className="btn btn-outline btn-sm">
                      <FileText size={14} /> Legal Center
                    </Link>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm delete-account-trigger-btn"
                      style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                      onClick={() => setShowDeleteAccountModal(true)}
                    >
                      <Trash2 size={14} /> Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 2: SERVICE BOOKINGS
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'bookings' && (
            <div className="tab-bookings-content">
              <div className="tab-section-header">
                <div>
                  <h2 className="section-title">Incoming Service Bookings</h2>
                  <p className="section-subtitle">
                    Manage client bookings with 3-stage milestone escrow protection.
                  </p>
                </div>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => handleTabChange('availability')}
                >
                  <Clock size={14} /> Manage Calendar →
                </button>
              </div>

              {proBookings.length === 0 ? (
                <div className="card empty-state-card">
                  <Calendar size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                  <h3>No service bookings yet</h3>
                  <p>When clients book your services from your public profile, they will appear here with automated escrow milestones.</p>
                  <button 
                    className="btn btn-primary"
                    style={{ marginTop: 16 }}
                    onClick={() => handleTabChange('jobboard')}
                  >
                    Find Open Client Leads on Job Board
                  </button>
                </div>
              ) : (
                <div className="bookings-cards-list">
                  {proBookings.map((b) => (
                    <div key={b.id} className="card pro-booking-card">
                      <div className="booking-card-main">
                        <div className="booking-status-header">
                          <span className={`status-pill status-${b.status}`}>
                            {b.status.toUpperCase()}
                          </span>
                          <span className="booking-date-range">
                            📅 {b.startDate} to {b.endDate} ({b.daysCount} {b.daysCount === 1 ? 'day' : 'days'})
                          </span>
                        </div>

                        <h3 className="booking-service-title">{b.serviceTitle}</h3>

                        <div className="booking-client-info">
                          <div className="client-avatar-row">
                            <span className="client-avatar-text">{b.customerName ? b.customerName[0] : 'C'}</span>
                            <div>
                              <strong className="client-name">{b.customerName || 'Verified Client'}</strong>
                              <span className="client-meta">Client ID: {b.customerId.slice(0, 8)}...</span>
                            </div>
                          </div>
                          <span className="booking-location">
                            <MapPin size={13} /> {b.location || 'Shoot location specified in contract'}
                          </span>
                        </div>

                        {/* Milestone Escrow Status */}
                        <div className="escrow-milestone-strip">
                          <div className="milestone-step done">
                            <span className="step-dot" /> 30% Advance Escrow
                          </div>
                          <div className={`milestone-step ${b.status === 'confirmed' || b.status === 'completed' ? 'done' : 'pending'}`}>
                            <span className="step-dot" /> 40% Shoot Wrap
                          </div>
                          <div className={`milestone-step ${b.status === 'completed' ? 'done' : 'pending'}`}>
                            <span className="step-dot" /> 30% Deliverables
                          </div>
                        </div>
                      </div>

                      <div className="booking-card-side">
                        <div className="payout-amount-box">
                          <span className="payout-label">Payout in Escrow</span>
                          <strong className="payout-val">₹{b.totalAmount.toLocaleString('en-IN')}</strong>
                        </div>

                        <div className="booking-actions-row">
                          {b.status === 'pending' && (
                            <>
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleAcceptBooking(b.id)}
                                disabled={actionLoading === `accept-${b.id}`}
                              >
                                {actionLoading === `accept-${b.id}` ? <Loader2 size={14} className="animate-spin" /> : 'Accept Booking ✓'}
                              </button>
                              <button 
                                className="btn btn-outline btn-sm decline-btn"
                                onClick={() => handleDeclineBooking(b.id)}
                                disabled={actionLoading === `decline-${b.id}`}
                              >
                                Decline
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            className="btn btn-outline btn-sm contract-action-btn"
                            onClick={() => {
                              setSelectedContractBooking(b);
                              setShowContractModal(true);
                            }}
                            title="View and sign legal shoot contract"
                          >
                            <FileText size={14} /> Contract
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setSelectedVaultBooking(b);
                              setShowVaultModal(true);
                            }}
                            title="Open Camqrew Vault Photo Proofing Gallery"
                          >
                            <Camera size={14} /> Vault Gallery
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setSelectedCallSheetBooking(b);
                              setShowCallSheetModal(true);
                            }}
                            title="Open and broadcast Digital Call Sheet"
                          >
                            <FileText size={14} /> Call Sheet
                          </button>

                          <Link 
                            to={`/chat?userId=${b.customerId}`} 
                            className="btn btn-outline btn-sm"
                          >
                            <MessageSquare size={14} /> Message Client
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 3: SALES & RENTALS (OR MENU ORDERS FOR CATERERS)
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'sales_rentals' && (
            <div className="tab-sales-rentals-content">
              <div className="tab-section-header">
                <div>
                  <h2 className="section-title">
                    {isCaterer ? 'Food Menu & Catering Orders' : 'Equipment Sales & Rental Orders'}
                  </h2>
                  <p className="section-subtitle">
                    {isCaterer 
                      ? 'Incoming catering bookings and customized per-plate food orders.' 
                      : 'Incoming gear rental bookings and verified store sale orders.'}
                  </p>
                </div>
                {isCaterer ? (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={handleOpenAddDish}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <UtensilsCrossed size={14} /> + Add Menu Dish
                  </button>
                ) : (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowListGearModal(true)}
                  >
                    <Package size={14} /> + List More Gear
                  </button>
                )}
              </div>

              <div className="card empty-state-card">
                {isCaterer ? (
                  <>
                    <UtensilsCrossed size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                    <h3>No incoming catering orders yet</h3>
                    <p>Add your signature catering dishes and per-plate pricing in the Menu & Prices tab to receive instant quotations and bookings from clients.</p>
                    <button 
                      className="btn btn-primary" 
                      style={{ marginTop: 16 }}
                      onClick={() => handleTabChange('listings')}
                    >
                      Manage Food Menu & Prices
                    </button>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                    <h3>No incoming gear orders yet</h3>
                    <p>Post your cinema cameras, lenses, or lighting equipment for rent or sale to earn steady revenue between production shoots.</p>
                    <button 
                      className="btn btn-primary" 
                      style={{ marginTop: 16 }}
                      onClick={() => setShowListGearModal(true)}
                    >
                      List Equipment for Sale or Rent
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 4: LISTINGS & GEAR STORE (OR SWIGGY-STYLE FOOD MENU FOR CATERERS)
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'listings' && (
            <div className="tab-listings-content">
              {isCaterer ? (
                /* ─────────────────────────────────────────────────────
                   SWIGGY-STYLE FOOD MENU & PRICES DASHBOARD (CATERERS)
                   ───────────────────────────────────────────────────── */
                <div className="swiggy-menu-dashboard">
                  {/* Filter & Controls Bar */}
                  <div className="swiggy-filter-bar">
                    {/* Search box */}
                    <div className="swiggy-search-box">
                      <Search size={16} className="swiggy-search-icon" />
                      <input
                        type="text"
                        placeholder="Search menu dishes..."
                        className="swiggy-search-input"
                        value={swiggySearchQuery}
                        onChange={(e) => setSwiggySearchQuery(e.target.value)}
                      />
                      {swiggySearchQuery && (
                        <button
                          type="button"
                          onClick={() => setSwiggySearchQuery('')}
                          style={{
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: 14,
                            padding: 2,
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Category Filter Chips */}
                    <div className="swiggy-filter-chips-row">
                      {['All', 'Starter', 'Main Course', 'Dessert', 'Beverage', 'Live Counter', 'Other'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className={`swiggy-cat-chip ${swiggyCategoryFilter === cat ? 'active' : ''}`}
                          onClick={() => setSwiggyCategoryFilter(cat)}
                        >
                          {cat}
                        </button>
                      ))}

                      {/* Veg Only Toggle Button */}
                      <button
                        type="button"
                        className={`swiggy-veg-toggle-btn ${swiggyVegOnly ? 'active' : ''}`}
                        onClick={() => setSwiggyVegOnly((v) => !v)}
                        title="Filter vegetarian dishes only"
                      >
                        <div className="swiggy-fssai-box veg">
                          <div className="swiggy-fssai-dot veg" />
                        </div>
                        Veg Only
                      </button>
                    </div>

                    {/* Add Menu Dish Button */}
                    <button 
                      type="button"
                      className="btn btn-primary"
                      onClick={handleOpenAddDish}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, flexShrink: 0, marginLeft: 'auto' }}
                    >
                      <Plus size={15} /> Add Menu Dish
                    </button>
                  </div>

                  {/* Count & Dietary Summary Bar */}
                  <div className="swiggy-summary-bar">
                    <span>
                      Showing <strong>{filteredDishes.length}</strong> of {(proProfile?.menuItems || []).length} dishes
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: 600, fontSize: 12 }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                        {vegDishesCount} Veg
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#dc2626', fontWeight: 600, fontSize: 12 }}>
                        <span style={{ display: 'inline-block', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '7px solid #dc2626' }} />
                        {nonVegDishesCount} Non-Veg
                      </span>
                    </div>
                  </div>

                  {/* Dishes Grid or Empty State */}
                  {(!proProfile?.menuItems || proProfile.menuItems.length === 0) ? (
                    <div className="card empty-state-card" style={{ padding: '48px 24px' }}>
                      <UtensilsCrossed size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                      <h4 style={{ margin: '0 0 6px', fontSize: 17, color: 'var(--text-primary)' }}>
                        No dishes added to your menu yet
                      </h4>
                      <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', maxWidth: 440 }}>
                        Build your Swiggy-style catering menu with pricing per plate so clients can customize their wedding or event feasts and get instant quotations.
                      </p>
                      <button 
                        className="btn btn-primary"
                        onClick={handleOpenAddDish}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Plus size={16} /> Add First Menu Dish
                      </button>
                    </div>
                  ) : filteredDishes.length === 0 ? (
                    <div className="card empty-state-card" style={{ padding: '36px 20px' }}>
                      <p style={{ color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                        No dishes match your current search or category filter.
                      </p>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setSwiggyCategoryFilter('All');
                          setSwiggyVegOnly(false);
                          setSwiggySearchQuery('');
                        }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="swiggy-dishes-grid">
                      {filteredDishes.map((dish) => {
                        const isGreen = dish.dietaryTags?.some(t => t === 'Veg' || t === 'Jain' || t === 'Vegan');
                        return (
                          <div key={dish.id} className="swiggy-dish-card-modern">
                            <div>
                              <div className="swiggy-dish-card-split">
                                <div className="swiggy-dish-main-col">
                                  {/* Header: FSSAI Symbol + Dish Name */}
                                  <div className="swiggy-dish-header" style={{ marginBottom: 6 }}>
                                    <div className="swiggy-dish-title-group">
                                      <div className={`swiggy-fssai-box ${isGreen ? 'veg' : 'nonveg'}`} title={isGreen ? 'Vegetarian' : 'Non-Vegetarian'}>
                                        {isGreen ? (
                                          <div className="swiggy-fssai-dot veg" />
                                        ) : (
                                          <div className="swiggy-fssai-triangle" />
                                        )}
                                      </div>
                                      <h4 className="swiggy-dish-name">{dish.name}</h4>
                                    </div>
                                  </div>

                                  {/* Tags: Category & Dietary Badges */}
                                  <div className="swiggy-tags-row" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                    <span className="swiggy-tag-pill cat">{dish.category}</span>
                                    {dish.minQuantity && (
                                      <span className="swiggy-tag-pill" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)', fontWeight: 700 }}>
                                        Min: {dish.minQuantity}
                                      </span>
                                    )}
                                    {dish.prepTime && (
                                      <span 
                                        className="swiggy-tag-pill prep" 
                                        style={{ 
                                          background: 'rgba(59, 130, 246, 0.12)', 
                                          color: '#3b82f6', 
                                          borderColor: 'rgba(59, 130, 246, 0.25)', 
                                          fontWeight: 700, 
                                          display: 'inline-flex', 
                                          alignItems: 'center', 
                                          gap: 4 
                                        }}
                                        title="Preparation / Lead Notice"
                                      >
                                        <Clock size={11} /> Prep: {dish.prepTime}
                                      </span>
                                    )}
                                    {dish.dietaryTags?.map((tag) => {
                                      const tagIsVeg = tag === 'Veg' || tag === 'Jain' || tag === 'Vegan';
                                      return (
                                        <span key={tag} className={`swiggy-tag-pill ${tagIsVeg ? 'veg' : 'nonveg'}`}>
                                          {tag}
                                        </span>
                                      );
                                    })}
                                  </div>

                                  {/* Description (if present) */}
                                  {dish.description && (
                                    <p className="swiggy-dish-desc">{dish.description}</p>
                                  )}
                                </div>

                                {/* Right Visual Column: Dish Image or Standalone Stock Toggle */}
                                {dish.imageUrl ? (
                                  <div className="swiggy-dish-visual-col">
                                    <img src={dish.imageUrl} alt={dish.name} className="swiggy-dish-visual-img" />
                                    <button
                                      type="button"
                                      className={`swiggy-dish-img-stock-badge ${dish.isAvailable ? 'in-stock' : 'out-stock'}`}
                                      onClick={() => handleToggleDishAvailability(dish.id)}
                                      title="Click to toggle availability"
                                    >
                                      {dish.isAvailable ? '● IN STOCK' : '○ SOLD OUT'}
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className={`swiggy-stock-toggle-btn ${dish.isAvailable ? 'in-stock' : 'out-stock'}`}
                                    onClick={() => handleToggleDishAvailability(dish.id)}
                                    title="Click to toggle availability"
                                  >
                                    {dish.isAvailable ? '● IN STOCK' : '○ SOLD OUT'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Footer: Price per plate + Edit & Delete Actions */}
                            <div className="swiggy-dish-footer">
                              <div className="swiggy-dish-price-box">
                                <span className="swiggy-dish-price-val">₹{dish.pricePerPlate.toLocaleString('en-IN')}</span>
                                <span className="swiggy-dish-price-unit">/ plate</span>
                              </div>

                              <div className="swiggy-dish-action-btns">
                                <button
                                  type="button"
                                  className="swiggy-icon-action-btn"
                                  onClick={() => handleOpenEditDish(dish)}
                                  title="Edit dish details & price"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="swiggy-icon-action-btn delete"
                                  onClick={() => handleDeleteDish(dish.id)}
                                  title="Delete dish from menu"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* ─────────────────────────────────────────────────────
                   STANDARD CAMERA GEAR STORE (CREATORS / PHOTOGRAPHERS)
                   ───────────────────────────────────────────────────── */
                <>
                  {/* Quick Action Banner */}
                  <div className="list-gear-banner card">
                    <div className="list-gear-banner-content">
                      <div className="list-gear-icon-box">
                        <Camera size={26} color="#ffffff" />
                      </div>
                      <div>
                        <h3 className="banner-title">Rent Out Your Production Equipment</h3>
                        <p className="banner-subtitle">
                          Publish your cameras, cinema lenses, lighting, and gear for daily rental with insured escrow security deposits.
                        </p>
                      </div>
                    </div>
                    <button 
                      className="btn btn-primary list-now-btn"
                      onClick={() => setShowListGearModal(true)}
                    >
                      + List Equipment for Rent
                    </button>
                  </div>

                  {/* User Listings Grid */}
                  <h3 className="section-heading" style={{ marginTop: 28, marginBottom: 16 }}>
                    Your Listed Equipment ({userProducts.length})
                  </h3>

                  {userProducts.length === 0 ? (
                    <div className="card empty-state-card">
                      <Package size={44} color="var(--text-muted)" style={{ margin: '0 auto 14px' }} />
                      <h4>No equipment listed yet</h4>
                      <p>Click "List Equipment for Rent" above to add your first camera or rental package.</p>
                    </div>
                  ) : (
                    <div className="pros-grid">
                      {userProducts.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 5: BROADCAST JOB BOARD
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'jobboard' && (
            <div className="tab-jobboard-content">
              <div className="tab-section-header">
                <div>
                  <h2 className="section-title">Open Broadcast Leads in Your Locality</h2>
                  <p className="section-subtitle">
                    Clients broadcast their shoot requirements directly to verified creators in their district. Accept a lead to pitch your day rate.
                  </p>
                </div>
              </div>

              {proJobBoard.length === 0 ? (
                <div className="card empty-state-card">
                  <Radio size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                  <h3>No open broadcast leads right now</h3>
                  <p>You will receive instant alerts when clients in your district broadcast shoot requirements.</p>
                </div>
              ) : (
                <div className="jobs-leads-list">
                  {proJobBoard.map((job) => (
                    <div key={job.id} className="card pro-job-lead-card">
                      <div className="lead-details">
                        <div className="broadcast-live-badge">
                          <Radio size={13} /> <span>OPEN BROADCAST LEAD</span>
                        </div>
                        <h3 className="lead-title">{job.title}</h3>
                        <p className="lead-loc">
                          <MapPin size={14} /> {job.location}
                        </p>
                        <p className="lead-desc">{job.requirements}</p>
                      </div>

                      <div className="lead-action-col">
                        <span className="budget-label">Offered Budget</span>
                        <strong className="budget-val">₹{job.budget?.toLocaleString('en-IN')}</strong>

                        <button
                          className="btn btn-primary btn-sm accept-lead-btn"
                          onClick={() => handleAcceptLead(job.id)}
                          disabled={actionLoading === job.id}
                        >
                          {actionLoading === job.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            'Accept Lead 📢'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 6: AVAILABILITY CALENDAR
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'availability' && (
            <div className="tab-availability-content">
              <div className="tab-section-header">
                <div>
                  <h2 className="section-title">Availability & Production Calendar</h2>
                  <p className="section-subtitle">
                    Click any day to mark it Available (Green) or Blocked / Booked (Red). Clients can only book days marked Available.
                  </p>
                </div>

                <div className="cal-legend-row">
                  <div className="legend-item"><span className="legend-dot green" /> Available</div>
                  <div className="legend-item"><span className="legend-dot red" /> Blocked / On Shoot</div>
                </div>
              </div>

              <div className="card cal-container-card">
                {/* Month Navigator Header */}
                <div className="cal-header-bar">
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear((y) => y - 1);
                      } else {
                        setCalendarMonth((m) => m - 1);
                      }
                    }}
                  >
                    <ChevronLeft size={16} /> Prev Month
                  </button>

                  <h3 className="cal-current-month">
                    {monthNames[calendarMonth]} {calendarYear}
                  </h3>

                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear((y) => y + 1);
                      } else {
                        setCalendarMonth((m) => m + 1);
                      }
                    }}
                  >
                    Next Month <ChevronRight size={16} />
                  </button>
                </div>

                {/* Weekdays */}
                <div className="cal-weekdays-grid">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
                    <span key={w} className="cal-weekday-name">{w}</span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="cal-matrix-grid">
                  {Array.from({ length: calendarDays.firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="cal-day-cell is-empty" />
                  ))}

                  {calendarDays.days.map((item) => (
                    <div 
                      key={item.dateStr}
                      className={`cal-day-cell clickable ${item.isBlocked ? 'is-blocked' : 'is-available'} ${item.isToday ? 'is-today' : ''}`}
                      onClick={() => handleToggleDate(item.dateStr)}
                      title={`Click to toggle availability for ${item.dateStr}`}
                    >
                      <span className="cal-day-number">{item.day}</span>
                      <span className="cal-day-badge">
                        {item.isBlocked ? 'Blocked' : 'Available'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 7: PAYOUTS & EARNINGS
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'earnings' && (() => {
            const clearedBalance = proBookings
              .filter(b => b.status === 'completed')
              .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
              - payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
            const availableAmount = Math.max(0, clearedBalance);

            return (
              <div className="tab-earnings-content">
                <div className="earnings-hero-card card">
                  <div className="earnings-hero-left">
                    <span className="earnings-hero-label">Available Cleared Balance</span>
                    <h2 className="earnings-hero-amount">₹{availableAmount.toLocaleString('en-IN')}</h2>
                    <p className="earnings-hero-sub">
                      {creatorAccount?.upiId ? (
                        <>Ready for instant payout to: <strong>{creatorAccount.upiId}</strong></>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>No UPI ID linked. Click below to add payout details.</span>
                      )}
                    </p>
                  </div>

                  <div className="earnings-hero-right">
                    <button 
                      className="btn btn-primary instant-payout-btn"
                      onClick={handleRequestInstantPayout}
                      disabled={payoutInProgress || availableAmount <= 0 || !creatorAccount?.upiId}
                      title={availableAmount <= 0 ? 'No cleared balance available for payout' : !creatorAccount?.upiId ? 'Please link your UPI ID first' : 'Request instant payout'}
                    >
                      {payoutInProgress ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>Instant Payout via UPI →</>
                      )}
                    </button>

                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowAccountModal(true)}
                    >
                      Manage Bank / UPI Account
                    </button>
                  </div>
                </div>

                {/* Payout Transactions History Table */}
                <h3 className="section-heading" style={{ marginTop: 28, marginBottom: 16 }}>
                  Payout History
                </h3>

                {payouts.length === 0 ? (
                  <div className="card empty-state-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <CreditCard size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                    <h4 style={{ margin: '0 0 6px', fontSize: 16 }}>No payout transactions yet</h4>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                      When you withdraw cleared earnings to your UPI or bank account, records will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="card payouts-table-card">
                    <table className="payouts-table">
                      <thead>
                        <tr>
                          <th>Transaction Ref</th>
                          <th>Method</th>
                          <th>Destination</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map((po) => (
                          <tr key={po.id}>
                            <td className="tx-ref"><code>{po.transactionRef}</code></td>
                            <td>{po.method.toUpperCase()}</td>
                            <td>{po.destination}</td>
                            <td>{new Date(po.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                            <td><strong style={{ color: 'var(--accent)' }}>₹{po.amount.toLocaleString('en-IN')}</strong></td>
                            <td>
                              <span className="status-pill status-completed">
                                COMPLETED
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ═════════════════════════════════════════════════════════
              TAB 8: CLIENT VIEW (CUSTOMER BOOKINGS & POSTED JOBS)
              ═════════════════════════════════════════════════════════ */}
          {activeTab === 'client' && (
            <div className="tab-client-content">
              <div className="tab-section-header">
                <div>
                  <h2 className="section-title">Client Bookings & Broadcast Shoots</h2>
                  <p className="section-subtitle">
                    Shoots you booked with other verified creators and broadcast jobs you posted.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to="/jobs/create" className="btn btn-primary btn-sm">
                    + Post Broadcast Job
                  </Link>
                  <Link to="/explore" className="btn btn-outline btn-sm">
                    Explore Creators
                  </Link>
                </div>
              </div>

              {/* Customer bookings list */}
              <h3 className="section-heading" style={{ marginTop: 20, marginBottom: 12 }}>
                Shoots You Booked ({customerBookings.length})
              </h3>

              {customerBookings.length === 0 ? (
                <div className="card empty-state-card" style={{ marginBottom: 28 }}>
                  <Calendar size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                  <h4>No bookings as a client yet</h4>
                  <p>Book local cinematographers, editors, or drone operators with milestone escrow protection.</p>
                  <Link to="/explore" className="btn btn-primary" style={{ marginTop: 14 }}>Explore Talent</Link>
                </div>
              ) : (
                <div className="bookings-cards-list" style={{ marginBottom: 28 }}>
                  {customerBookings.map((b) => (
                    <div key={b.id} className="card pro-booking-card">
                      <div className="booking-card-main">
                        <span className={`status-pill status-${b.status}`}>{b.status.toUpperCase()}</span>
                        <h3 className="booking-service-title">{b.serviceTitle}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                          With <strong>{b.professionalName}</strong> • {b.startDate} ({b.daysCount} days)
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>📍 {b.location}</p>
                      </div>

                      <div className="booking-card-side">
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Escrow Total</span>
                        <strong className="payout-val">₹{b.totalAmount.toLocaleString('en-IN')}</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm contract-action-btn"
                            onClick={() => {
                              setSelectedContractBooking(b);
                              setShowContractModal(true);
                            }}
                            title="View and sign legal shoot contract"
                          >
                            <FileText size={14} /> Shoot Contract
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setSelectedVaultBooking(b);
                              setShowVaultModal(true);
                            }}
                            title="Open Camqrew Vault Photo Proofing & Selection Gallery"
                          >
                            <Camera size={14} /> Vault (Proofing)
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setSelectedCallSheetBooking(b);
                              setShowCallSheetModal(true);
                            }}
                            title="View Shoot Day Schedule & Call Sheet"
                          >
                            <FileText size={14} /> Call Sheet
                          </button>
                          <Link to={`/chat?userId=${b.professionalId}`} className="btn btn-outline btn-sm">
                            <MessageSquare size={14} /> Message Pro
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Broadcast jobs posted by user */}
              <h3 className="section-heading" style={{ marginBottom: 12 }}>
                Your Posted Broadcast Jobs ({clientJobs.length})
              </h3>

              {clientJobs.length === 0 ? (
                <div className="card empty-state-card">
                  <Radio size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                  <h4>No broadcast jobs posted</h4>
                  <p>Need a crew urgently? Broadcast your shoot requirements to verified creators.</p>
                  <Link to="/jobs/create" className="btn btn-primary" style={{ marginTop: 14 }}>Post Broadcast Job</Link>
                </div>
              ) : (
                <div className="jobs-leads-list">
                  {clientJobs.map((job) => (
                    <div key={job.id} className="card pro-job-lead-card">
                      <div>
                        <span className={`status-pill status-${job.status}`}>{job.status.toUpperCase()}</span>
                        <h3 className="lead-title" style={{ marginTop: 6 }}>{job.title}</h3>
                        <p className="lead-loc"><MapPin size={13} /> {job.location}</p>
                        <p className="lead-desc">{job.requirements}</p>
                      </div>

                      <div className="lead-action-col">
                        <span className="budget-label">Budget</span>
                        <strong className="budget-val">₹{job.budget?.toLocaleString('en-IN')}</strong>
                        {job.status === 'reviewing' && (
                          <Link to={`/jobs/review/${job.id}`} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                            Review Applicant →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── MODAL: LIST GEAR FOR RENT / SALE ── */}
      {showListGearModal && (
        <div className="dashboard-modal-backdrop" onClick={() => setShowListGearModal(false)}>
          <div className="dashboard-modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>List Equipment for Sale or Rent</h3>
              <button className="btn-close" onClick={() => setShowListGearModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGear} className="modal-form">
              <div className="form-group">
                <label className="form-label">Equipment Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Sony FX3 Cinema Line Full-Frame Camera"
                  value={newGearTitle}
                  onChange={(e) => setNewGearTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <CustomSelect 
                    value={newGearCategory}
                    onChange={(val) => setNewGearCategory(val)}
                    options={[
                      { value: 'Cameras', label: 'Cameras' },
                      { value: 'Lenses', label: 'Lenses' },
                      { value: 'Lighting', label: 'Lighting' },
                      { value: 'Audio', label: 'Audio' },
                      { value: 'Drones', label: 'Drones' },
                      { value: 'Gimbals', label: 'Gimbals & Rigs' },
                    ]}
                    searchable={false}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Listing Type</label>
                  <CustomSelect 
                    value={newGearType}
                    onChange={(val) => setNewGearType(val as any)}
                    options={[
                      { value: 'rental', label: 'For Rent (Per Day Rate)' },
                      { value: 'sale', label: 'For Sale (Full Price)' },
                    ]}
                    searchable={false}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">
                    {newGearType === 'rental' ? 'Daily Rent Rate (₹)' : 'Selling Price (₹)'}
                  </label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={newGearPrice}
                    onChange={(e) => setNewGearPrice(Number(e.target.value))}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gear Condition</label>
                  <CustomSelect 
                    value={newGearCondition}
                    onChange={(val) => setNewGearCondition(val)}
                    options={[
                      { value: 'Brand New', label: 'Brand New' },
                      { value: 'Like New', label: 'Like New (Mint)' },
                      { value: 'Good', label: 'Good Condition' },
                      { value: 'Fair', label: 'Fair / Workhorse' },
                    ]}
                    searchable={false}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input 
                  type="url" 
                  className="input-field"
                  value={newGearImage}
                  onChange={(e) => setNewGearImage(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description & Inclusions</label>
                <textarea 
                  className="input-field" 
                  rows={3}
                  placeholder="Includes 2x CFexpress cards, 3x batteries, dual charger, and Pelican case."
                  value={newGearDesc}
                  onChange={(e) => setNewGearDesc(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowListGearModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={actionLoading === 'create-gear'}
                >
                  {actionLoading === 'create-gear' ? <Loader2 size={16} className="animate-spin" /> : 'Publish to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: MANAGE CREATOR PAYOUT ACCOUNT ── */}
      {showAccountModal && (
        <div className="dashboard-modal-backdrop" onClick={() => setShowAccountModal(false)}>
          <div className="dashboard-modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bank & UPI Payout Settings</h3>
              <button className="btn-close" onClick={() => setShowAccountModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="modal-form">
              <div className="form-group">
                <label className="form-label">Default UPI ID (Fast Payouts)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. name@okaxis or name@paytm"
                  value={payoutUpi}
                  onChange={(e) => setPayoutUpi(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Holder Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={payoutHolder}
                  onChange={(e) => setPayoutHolder(e.target.value)}
                  required 
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Bank Account Number</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={payoutAccNum}
                    onChange={(e) => setPayoutAccNum(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bank IFSC Code</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={payoutIfsc}
                    onChange={(e) => setPayoutIfsc(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowAccountModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD VIDEO REEL / SHOWREEL (INSTAGRAM REELS STYLE) ── */}
      {showReelModal && (
        <div className="dashboard-modal-backdrop" onClick={() => {
          if (savingReel) return;
          setShowReelModal(false);
          setSelectedVideoFile(null);
          if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
          setVideoPreviewUrl(null);
          setGeneratedThumbnailBlob(null);
        }}>
          <div className="dashboard-modal-content card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(63, 182, 104, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3fb668' }}>
                  <Film size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Upload Video Reel</h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Upload video files (.mp4, .mov, .webm) directly to your profile, like Instagram Reels</p>
                </div>
              </div>
              <button 
                className="btn-close" 
                disabled={savingReel}
                onClick={() => {
                  setShowReelModal(false);
                  setSelectedVideoFile(null);
                  if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
                  setVideoPreviewUrl(null);
                  setGeneratedThumbnailBlob(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddVideoReel} className="modal-form">
              {/* Native Video Upload Dropzone */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Video File <span style={{ color: '#ef4444' }}>*</span></span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>Direct Upload • MP4, MOV, WebM, M4V (up to 300MB)</span>
                </label>

                {!selectedVideoFile ? (
                  <div 
                    className="video-dropzone-box"
                    style={{
                      border: '2px dashed var(--border, #333)',
                      borderRadius: 12,
                      padding: '28px 16px',
                      textAlign: 'center',
                      background: 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                    onClick={() => document.getElementById('reel-video-file-input')?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleSelectVideoFile(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <input 
                      id="reel-video-file-input"
                      type="file" 
                      accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/*" 
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleSelectVideoFile(e.target.files[0]);
                        }
                      }}
                    />
                    <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(63, 182, 104, 0.12)', color: 'var(--accent, #3fb668)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <UploadCloud size={22} />
                    </div>
                    <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14 }}>
                      Choose Video File to Upload
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                      9:16 Vertical Reel (recommended) or 16:9 Cinema Clip
                    </p>
                  </div>
                ) : (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--surface-elevated, #141414)' }}>
                    <div style={{ position: 'relative', background: '#000', maxHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <video 
                        src={videoPreviewUrl || undefined} 
                        controls 
                        playsInline 
                        style={{ maxHeight: 220, maxWidth: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
                      <div style={{ overflow: 'hidden', marginRight: 10 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selectedVideoFile.name}
                        </p>
                        <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                          {(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} MB • {newReelIsShort ? '9:16 Reel' : '16:9 Cinema'}
                          {generatedThumbnailBlob && (
                            <span style={{ color: 'var(--accent, #3fb668)', fontWeight: 600, marginLeft: 6 }}>
                              • ✓ Cover frame captured
                            </span>
                          )}
                        </span>
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#ef4444' }}
                        disabled={savingReel}
                        onClick={() => {
                          setSelectedVideoFile(null);
                          if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
                          setVideoPreviewUrl(null);
                          setGeneratedThumbnailBlob(null);
                        }}
                      >
                        <X size={14} /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Reel Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Wedding Cinematic Teaser 2026, Fashion Lookbook Reel" 
                  value={newReelTitle}
                  onChange={(e) => setNewReelTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Category / Tag</label>
                  <CustomSelect 
                    value={newReelCategory}
                    onChange={(val) => setNewReelCategory(val)}
                    options={[
                      { value: 'Cinematography', label: 'Cinematography' },
                      { value: 'Wedding Film', label: 'Wedding Film' },
                      { value: 'Commercial', label: 'Commercial / Brand' },
                      { value: 'Fashion Reel', label: 'Fashion Reel' },
                      { value: 'Drone & Aerial', label: 'Drone & Aerial' },
                      { value: 'Music Video', label: 'Music Video' },
                      { value: 'Event Highlight', label: 'Event Highlight' },
                    ]}
                    searchable={false}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Video Format</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button 
                      type="button"
                      className={`btn btn-sm ${newReelIsShort ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1 }}
                      onClick={() => setNewReelIsShort(true)}
                    >
                      <Smartphone size={13} /> 9:16 Reel
                    </button>
                    <button 
                      type="button"
                      className={`btn btn-sm ${!newReelIsShort ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1 }}
                      onClick={() => setNewReelIsShort(false)}
                    >
                      <Tv size={13} /> 16:9 Cinema
                    </button>
                  </div>
                </div>
              </div>

              {videoUploadProgress && (
                <div style={{ padding: '8px 12px', background: 'rgba(63, 182, 104, 0.1)', borderRadius: 8, color: 'var(--accent, #3fb668)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{videoUploadProgress}</span>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: 16 }}>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  disabled={savingReel}
                  onClick={() => {
                    setShowReelModal(false);
                    setSelectedVideoFile(null);
                    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
                    setVideoPreviewUrl(null);
                    setGeneratedThumbnailBlob(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={savingReel || !selectedVideoFile}
                >
                  {savingReel ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{videoUploadProgress || 'Uploading...'}</span>
                    </>
                  ) : (
                    'Upload & Publish Reel'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD PORTFOLIO PHOTO VIA URL MODAL ── */}
      {showAddPhotoUrlModal && (
        <div className="modal-backdrop" onClick={() => !actionLoading && setShowAddPhotoUrlModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(63, 182, 104, 0.15)', padding: 8, borderRadius: 10, color: 'var(--accent, #3fb668)' }}>
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Add Portfolio Image via URL</h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Direct image link (JPG, PNG, WebP)</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setShowAddPhotoUrlModal(false)} disabled={!!actionLoading}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPhotoByUrl} className="modal-form">
              <div className="form-group">
                <label className="form-label">Image Web URL</label>
                <input 
                  type="url" 
                  className="input-field" 
                  placeholder="https://images.unsplash.com/... or hosted image URL" 
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  required 
                />
                <span style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 4, display: 'block' }}>
                  Paste a direct link to any photography work hosted on Unsplash, Imgur, Cloudinary, AWS S3, etc.
                </span>
              </div>

              {/* Instant Image Preview */}
              {newPhotoUrl.trim() && (
                <div style={{ marginBottom: 16, textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8 }}>
                  <img 
                    src={newPhotoUrl} 
                    alt="Preview" 
                    style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowAddPhotoUrlModal(false)}
                  disabled={!!actionLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!newPhotoUrl.trim() || actionLoading === 'add-photo-url'}
                >
                  {actionLoading === 'add-photo-url' ? <Loader2 size={16} className="animate-spin" /> : 'Add to Portfolio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN PORTFOLIO LIGHTBOX MODAL ── */}
      <ImageLightboxModal
        isOpen={lightboxOpen}
        images={proProfile?.portfolio || []}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        title={`${proProfile?.name || 'Creator'} Portfolio`}
      />

      {/* ── SHOOT PRODUCTION CONTRACT MODAL ── */}
      {showContractModal && selectedContractBooking && (
        <ShootContractModal
          isOpen={showContractModal}
          booking={selectedContractBooking}
          currentUserId={user?.id}
          onClose={() => setShowContractModal(false)}
          onContractSigned={() => {
            loadDashboardData();
          }}
        />
      )}

      {/* ── CAMQREW VAULT PHOTO PROOFING MODAL ── */}
      {showVaultModal && selectedVaultBooking && (
        <PhotoProofingModal
          isOpen={showVaultModal}
          booking={selectedVaultBooking}
          currentUserId={user?.id}
          isClientView={activeTab === 'client'}
          onClose={() => {
            setShowVaultModal(false);
            setSelectedVaultBooking(null);
          }}
          onMilestoneReleased={() => {
            loadDashboardData();
          }}
        />
      )}

      {/* ── DIGITAL CALL SHEET & SHOOT SCHEDULE MODAL ── */}
      {showCallSheetModal && selectedCallSheetBooking && (
        <CallSheetModal
          isOpen={showCallSheetModal}
          booking={selectedCallSheetBooking}
          onClose={() => {
            setShowCallSheetModal(false);
            setSelectedCallSheetBooking(null);
          }}
        />
      )}

      {/* ── ACCOUNT DELETION CONFIRMATION MODAL ── */}
      {showDeleteAccountModal && (
        <div className="modal-backdrop" onClick={() => !deletingAccount && setShowDeleteAccountModal(false)}>
          <div className="modal-card delete-account-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(239,68,68,0.15)', padding: 8, borderRadius: 10, color: 'var(--danger)' }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--danger)' }}>Delete Camqrew Account?</h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Irreversible Data Erasure</p>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                disabled={deletingAccount}
                onClick={() => setShowDeleteAccountModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                This action is permanent under the Indian DPDP Act 2023. Deleting your account will immediately and irrevocably delete:
              </p>

              <ul style={{ margin: '12px 0 16px', paddingLeft: 20, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <li>Your verified creator profile, bio, equipment roster, and reviews</li>
                <li>All portfolio media, showreels, and store listings</li>
                <li>Your active broadcast pitches and messaging history</li>
              </ul>

              <div className="escrow-guard-note" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                <strong>⚠️ Active Escrow Protection:</strong>
                <p style={{ margin: '4px 0 0' }}>
                  If you have active confirmed shoots or pending escrow balances, deletion will be blocked until all bookings are wrapped or cancelled.
                </p>
              </div>

              {deleteAccountError && (
                <div className="alert-box error" style={{ marginBottom: 14, fontSize: 13, color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: 10, borderRadius: 8 }}>
                  <AlertTriangle size={15} style={{ marginRight: 6, display: 'inline' }} /> {deleteAccountError}
                </div>
              )}

              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
                Type <strong style={{ color: 'var(--danger)' }}>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Type DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                disabled={deletingAccount}
                style={{ width: '100%', borderColor: deleteConfirmText === 'DELETE' ? 'var(--danger)' : undefined }}
              />
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="btn btn-outline"
                disabled={deletingAccount}
                onClick={() => setShowDeleteAccountModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                onClick={handleDeleteAccount}
                style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
              >
                {deletingAccount ? <Loader2 size={16} className="animate-spin" /> : 'Permanently Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CATERING DISH MODAL (ADD / EDIT) ── */}
      {showDishModal && (
        <div className="dashboard-modal-backdrop" onClick={() => !savingDish && setShowDishModal(false)}>
          <div className="dashboard-modal-content card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(63, 182, 104, 0.15)', padding: 8, borderRadius: 10, color: 'var(--accent, #3fb668)' }}>
                  <UtensilsCrossed size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                    {editingDishId ? (isBaker ? 'Edit Bake Item' : 'Edit Menu Dish') : (isBaker ? 'Add Bake / Cake to Menu' : 'Add Dish to Menu')}
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {isBaker ? 'Artisan bakes and custom celebration foods' : 'Catering menu item for client quotation calculator'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                className="btn-close" 
                onClick={() => setShowDishModal(false)} 
                disabled={savingDish}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="modal-form">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  {isBaker ? 'Bake / Item Name *' : 'Dish / Menu Item Name *'}
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder={isBaker ? 'e.g. Belgian Dark Chocolate Truffle Cake, Floral Bento Box' : 'e.g. Paneer Tikka Angara, Dal Makhani, Tiramisu'} 
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    Category
                  </label>
                  <CustomSelect 
                    value={dishCategory}
                    onChange={(val) => setDishCategory(val as any)}
                    options={isBaker ? [
                      { value: 'Cakes', label: 'Cakes' },
                      { value: 'Pastries', label: 'Pastries & Cupcakes' },
                      { value: 'Breads', label: 'Artisan Breads' },
                      { value: 'Savory', label: 'Savory & Tarts' },
                      { value: 'Dessert', label: 'Desserts & Jars' },
                      { value: 'Live Counter', label: 'Live Counter' },
                      { value: 'Starter', label: 'Starter' },
                      { value: 'Other', label: 'Other' },
                    ] : [
                      { value: 'Starter', label: 'Starter' },
                      { value: 'Main Course', label: 'Main Course' },
                      { value: 'Dessert', label: 'Dessert' },
                      { value: 'Beverage', label: 'Beverage' },
                      { value: 'Live Counter', label: 'Live Counter' },
                      { value: 'Other', label: 'Other' },
                    ]}
                    searchable={false}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    {isBaker ? 'Price per Unit (₹) *' : 'Price per Plate / Serving (₹) *'}
                  </label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder={isBaker ? '1200' : '250'} 
                    value={dishPrice || ''}
                    onChange={(e) => setDishPrice(Number(e.target.value))}
                    min="1"
                    required 
                  />
                </div>
              </div>

              {/* Unit & Minimum Order Quantity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    Pricing Unit (e.g. Kg, Cake, Box)
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder={isBaker ? 'Kg, Cake, Box, Piece' : 'plate'} 
                    value={dishUnit}
                    onChange={(e) => setDishUnit(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                    Minimum Order Qty (Optional)
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder={isBaker ? 'e.g. 0.5 Kg, 1 Cake, 1 Box' : 'e.g. 10 plates'} 
                    value={dishMinQuantity}
                    onChange={(e) => setDishMinQuantity(e.target.value)}
                  />
                </div>
              </div>

              {/* Preparation Time / Notice Required */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} color="var(--accent, #3fb668)" />
                    Preparation Time / Lead Notice {isBaker ? '*' : '(Optional)'}
                  </label>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Advance baking notice</span>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {['Same Day (4 Hours)', '24 Hours Notice', '48 Hours Notice', '2 - 3 Days', '1 Week'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDishPrepTime(preset)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 14,
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: dishPrepTime === preset ? '1.5px solid var(--accent, #3fb668)' : '1px solid var(--border-color, #e5e7eb)',
                        background: dishPrepTime === preset ? 'rgba(63, 182, 104, 0.15)' : 'var(--bg-elevated, #f3f4f6)',
                        color: dishPrepTime === preset ? 'var(--accent, #3fb668)' : 'var(--text-secondary, #4b5563)',
                      }}
                    >
                      {dishPrepTime === preset ? '✓ ' : ''}{preset}
                    </button>
                  ))}
                </div>

                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. 24 Hours Notice, 48 Hours, 2-3 Days" 
                  value={dishPrepTime}
                  onChange={(e) => setDishPrepTime(e.target.value)}
                />
              </div>

              {/* Dish Photo / Image Upload */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>
                    Dish Photo (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowImageUrlInput(!showImageUrlInput)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent, #3fb668)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0
                    }}
                  >
                    <LinkIcon size={12} />
                    {showImageUrlInput ? 'Upload file instead' : 'Or paste image URL'}
                  </button>
                </div>

                {dishImageUrl ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 10,
                    borderRadius: 10,
                    border: '1px solid var(--border-color, #e5e7eb)',
                    background: 'var(--bg-elevated, #f9fafb)'
                  }}>
                    <img
                      src={dishImageUrl}
                      alt="Dish preview"
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 8,
                        objectFit: 'cover',
                        border: '1px solid var(--border-color, #e5e7eb)'
                      }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Dish photo attached</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {dishImageUrl}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDishImageUrl('')}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: 'none',
                        color: '#ef4444',
                        padding: '6px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  </div>
                ) : showImageUrlInput ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="url"
                      className="input-field"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={dishImageUrl}
                      onChange={(e) => setDishImageUrl(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={dishFileInputRef}
                      onChange={handleDishImageUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => dishFileInputRef.current?.click()}
                      disabled={uploadingDishImage}
                      style={{
                        width: '100%',
                        padding: '16px 12px',
                        border: '2px dashed var(--border-color, #d1d5db)',
                        borderRadius: 10,
                        background: 'var(--bg-elevated, #f9fafb)',
                        cursor: uploadingDishImage ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'border-color 0.2s'
                      }}
                    >
                      {uploadingDishImage ? (
                        <>
                          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent, #3fb668)' }} />
                          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Uploading dish photo...</span>
                        </>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent, #3fb668)', fontWeight: 600, fontSize: 13 }}>
                            <UploadCloud size={18} />
                            <span>Upload Dish Photo</span>
                          </div>
                          <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                            PNG, JPG, WEBP up to 10MB (appears on client menu cards)
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Dietary Tags Checkboxes */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
                  Dietary Classification
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['Veg', 'Non-Veg', 'Jain', 'Vegan'] as ('Veg' | 'Non-Veg' | 'Jain' | 'Vegan')[]).map((tag) => {
                    const isSelected = dishDietaryTags.includes(tag);
                    const isGreen = tag === 'Veg' || tag === 'Jain' || tag === 'Vegan';
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setDishDietaryTags((prev) =>
                            isSelected ? prev.filter((t) => t !== tag) : [...prev, tag]
                          );
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: `1.5px solid ${isSelected ? (isGreen ? '#22c55e' : '#ef4444') : 'var(--border-color, #e5e7eb)'}`,
                          background: isSelected
                            ? (isGreen ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)')
                            : 'var(--bg-elevated, #f3f4f6)',
                          color: isSelected
                            ? (isGreen ? '#22c55e' : '#ef4444')
                            : 'var(--text-secondary, #4b5563)'
                        }}
                      >
                        {isSelected ? '✓ ' : ''}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Description / Portion Details (Optional)
                </label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  placeholder="e.g. Clay-oven charred cottage cheese cubes marinated in Kashmiri chili and aromatic spices." 
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowDishModal(false)}
                  disabled={savingDish}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!dishName.trim() || !dishPrice || savingDish}
                >
                  {savingDish ? <Loader2 size={16} className="animate-spin" /> : (editingDishId ? 'Save Changes' : 'Add Dish to Menu')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
