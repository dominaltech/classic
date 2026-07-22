import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isMocked } from '../supabaseClient';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Auth state
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'otp'
  const [tempPhone, setTempPhone] = useState('');
  
  // E-commerce state
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [showCart, setShowCart] = useState(false);
  
  // Database data state
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Load initial session and listen to changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setAuthLoading(false);
      }
    });

    // Load Cart from localStorage
    const savedCart = localStorage.getItem('classic_cart');
    if (savedCart) setCart(JSON.parse(savedCart));

    // Load Wishlist from localStorage
    const savedWishlist = localStorage.getItem('classic_wishlist');
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

    // Initial database fetch
    fetchDatabaseData();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Save cart to localstorage whenever it changes
  useEffect(() => {
    localStorage.setItem('classic_cart', JSON.stringify(cart));
  }, [cart]);

  // Save wishlist to localstorage whenever it changes
  useEffect(() => {
    localStorage.setItem('classic_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Fetch profiles based on auth user id
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        // Fallback for mock environment
        if (isMocked) {
          const mockProfiles = JSON.parse(localStorage.getItem('mock_db_profiles')) || [];
          const matched = mockProfiles.find(p => p.id === userId);
          setProfile(matched || { id: userId, full_name: "Mock User", phone: "", role: "user" });
        }
      } else {
        setProfile(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuthLoading(false);
    }
  };

  // Fetch Products, Categories, Banners
  const fetchDatabaseData = async () => {
    setDataLoading(true);
    try {
      // Categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      setCategories(catData || []);

      // Banners
      const { data: banData } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true });
      setBanners(banData || []);

      // Products
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      // If categories and products are populated, map them
      setProducts(prodData || []);

      // Fetch Orders (Admins will need this)
      if (isMocked) {
        const mockOrders = JSON.parse(localStorage.getItem('mock_db_orders')) || [];
        setOrders(mockOrders);
      } else {
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        setOrders(orderData || []);
      }
    } catch (err) {
      console.error("Error loading database:", err);
    } finally {
      setDataLoading(false);
    }
  };

  // Cart operations
  const addToCart = (product, size, qty = 1) => {
    if (!size) {
      alert("Please select a size");
      return;
    }
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === size
      );
      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].qty += qty;
        return newCart;
      }
      return [...prevCart, { product, selectedSize: size, qty }];
    });
    setShowCart(true); // Open drawer on add
  };

  const removeFromCart = (productId, size) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.product.id === productId && item.selectedSize === size))
    );
  };

  const updateCartQty = (productId, size, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId && item.selectedSize === size
          ? { ...item, qty: newQty }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => {
    const price = item.product.sale_price || item.product.regular_price;
    return total + price * item.qty;
  }, 0);

  const cartItemCount = cart.reduce((count, item) => count + item.qty, 0);

  // Wishlist operations
  const toggleWishlist = (product) => {
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.some((item) => item.id === product.id);
      if (exists) {
        return prevWishlist.filter((item) => item.id !== product.id);
      }
      return [...prevWishlist, product];
    });
  };

  // Auth actions
  const login = async (email, password) => {
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
      setAuthLoading(false);
      return false;
    }
    setShowAuth(false);
    return true;
  };

  const loginOtp = async (phone) => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      alert(error.message);
      setAuthLoading(false);
      return false;
    }
    setTempPhone(phone);
    setAuthMode('otp');
    setAuthLoading(false);
    return true;
  };

  const verifyOtpCode = async (code) => {
    setAuthLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: tempPhone,
      token: code,
      type: 'sms'
    });
    if (error) {
      alert(error.message);
      setAuthLoading(false);
      return false;
    }
    setShowAuth(false);
    return true;
  };

  const signup = async (email, password, fullName, phone) => {
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      phone,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          role: 'user'
        }
      }
    });

    if (error) {
      alert(error.message);
      setAuthLoading(false);
      return false;
    }

    alert("Registration successful! Check your email or try logging in.");
    setAuthMode('login');
    setAuthLoading(false);
    return true;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error(error.message);
    setProfile(null);
  };

  const createOrder = async (customerDetails) => {
    const orderItems = cart.map(item => ({
      product_id: item.product.id,
      title: item.product.title,
      price: item.product.sale_price || item.product.regular_price,
      qty: item.qty,
      size: item.selectedSize,
      image: item.product.images?.[0] || item.product.image_url
    }));

    const newOrder = {
      id: Date.now() + Math.floor(Math.random() * 100),
      created_at: new Date().toISOString(),
      customer_name: customerDetails.name,
      customer_phone: customerDetails.phone,
      customer_address: customerDetails.address,
      items: orderItems,
      total_amount: cartTotal,
      status: 'pending' // pending | processing | shipped | delivered
    };

    if (isMocked) {
      const currentOrders = JSON.parse(localStorage.getItem('mock_db_orders')) || [];
      currentOrders.push(newOrder);
      localStorage.setItem('mock_db_orders', JSON.stringify(currentOrders));
      setOrders(currentOrders);
    } else {
      const { error } = await supabase.from('orders').insert([newOrder]);
      if (error) {
        console.error("Error creating order in Supabase:", error);
        return false;
      }
    }
    clearCart();
    return true;
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AppContext.Provider
      value={{
        session,
        user,
        profile,
        isAdmin,
        authLoading,
        showAuth,
        setShowAuth,
        authMode,
        setAuthMode,
        tempPhone,
        setTempPhone,
        
        cart,
        wishlist,
        showCart,
        setShowCart,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        cartTotal,
        cartItemCount,
        toggleWishlist,
        
        categories,
        products,
        banners,
        orders,
        dataLoading,
        refreshData: fetchDatabaseData,
        
        login,
        loginOtp,
        verifyOtpCode,
        signup,
        logout,
        createOrder
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
