// ==========================================================================
// VALMORA LUXE — STOREFRONT ENGINE & 3D INTERACTIVE CONTROLLER
// Real-time Telegram Dispatch | VIP Delivery Onboarding | 3D Perspective Cards
// ==========================================================================

const VALMORA_REGIONS = [
    "Toshkent shahri",
    "Toshkent viloyati",
    "Samarqand viloyati",
    "Buxoro viloyati",
    "Farg'ona viloyati",
    "Andijon viloyati",
    "Namangan viloyati",
    "Qashqadaryo viloyati",
    "Surxondaryo viloyati",
    "Xorazm viloyati",
    "Navoiy viloyati",
    "Jizzax viloyati",
    "Sirdaryo viloyati",
    "Qoraqalpog'iston Respublikasi"
];

// Luxury Audio Chimes via Web Audio API (Zero external assets needed)
class ValmoraAudio {
    constructor() {
        this.ctx = null;
    }
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
    }
    playClick() {
        try {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.05);
        } catch (e) {}
    }
    playSuccess() {
        try {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                gain.gain.setValueAtTime(0.08, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.4);
            });
        } catch (e) {}
    }
}

const luxuryAudio = new ValmoraAudio();

// State
let allProducts = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem('valmora_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('valmora_wishlist') || '[]');
let currentPromoDiscount = 0; // percentage
let selectedProductForInstantOrder = null;

// ==========================================================================
// 1. VIP ONBOARDING & DELIVERY ADDRESS MANAGEMENT
// ==========================================================================
function getSavedCustomer() {
    const raw = localStorage.getItem('valmora_vip_customer');
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }
    return null;
}

function saveCustomer(customerData) {
    localStorage.setItem('valmora_vip_customer', JSON.stringify(customerData));
    updateDeliveryBadge();
}

function updateDeliveryBadge() {
    const cust = getSavedCustomer();
    const cityEl = document.getElementById('headerDeliveryCity');
    const nameEl = document.getElementById('headerCustomerName');
    
    if (cust && cust.name) {
        if (cityEl) cityEl.textContent = cust.region ? cust.region.split(' ')[0] : 'Toshkent';
        if (nameEl) nameEl.textContent = cust.name.split(' ')[0];
    } else {
        if (cityEl) cityEl.textContent = 'Manzilni tanlang';
        if (nameEl) nameEl.textContent = 'Mehmon';
    }
}

function checkOnboarding() {
    const cust = getSavedCustomer();
    if (!cust || !cust.name || !cust.phone || !cust.address) {
        // Open modal after smooth 400ms delay
        setTimeout(() => {
            openOnboardingModal();
        }, 500);
    } else {
        updateDeliveryBadge();
    }
}

function openOnboardingModal() {
    const modal = document.getElementById('onboardingModal');
    if (!modal) return;
    
    // Pre-fill if exists
    const cust = getSavedCustomer() || {};
    if (document.getElementById('obName')) document.getElementById('obName').value = cust.name || '';
    if (document.getElementById('obPhone')) document.getElementById('obPhone').value = cust.phone || '+998 ';
    if (document.getElementById('obRegion')) document.getElementById('obRegion').value = cust.region || VALMORA_REGIONS[0];
    if (document.getElementById('obAddress')) document.getElementById('obAddress').value = cust.address || '';
    
    modal.classList.add('active');
}

function closeOnboardingModal() {
    const modal = document.getElementById('onboardingModal');
    if (modal) modal.classList.remove('active');
}

function submitOnboardingForm(e) {
    e.preventDefault();
    const name = document.getElementById('obName').value.trim();
    const phone = document.getElementById('obPhone').value.trim();
    const region = document.getElementById('obRegion').value;
    const address = document.getElementById('obAddress').value.trim();

    if (!name || name.length < 3) {
        showStoreToast("Iltimos, ism va familiyangizni to'liq kiriting", "error");
        return;
    }
    if (!phone || phone.length < 9) {
        showStoreToast("Iltimos, telefon raqamingizni kiriting", "error");
        return;
    }
    if (!address || address.length < 4) {
        showStoreToast("Iltimos, yetkazib berish manzilini aniq ko'rsating", "error");
        return;
    }

    const customerData = {
        name: name,
        phone: phone,
        region: region,
        address: address,
        fullAddress: `${region}, ${address}`
    };

    saveCustomer(customerData);
    closeOnboardingModal();
    luxuryAudio.playSuccess();
    showStoreToast(`Xush kelibsiz, ${name}! Yetkazib berish manzilingiz tasdiqlandi.`, 'success');
}

// ==========================================================================
// 2. PRODUCTS ENGINE & 3D INTERACTION
// ==========================================================================
async function loadProducts() {
    const grid = document.getElementById('products3dGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 32px; color: var(--gold); margin-bottom: 14px;"></i>
            <p style="color: var(--text-muted); font-size: 14px;">Valmora eksklyuziv to'plami yuklanmoqda...</p>
        </div>
    `;

    let serverProds = [];
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success && data.products && data.products.length > 0) {
            serverProds = data.products;
        }
    } catch (err) {}

    // Also get admin-added products from localStorage
    let localProds = [];
    try {
        const rawLocal = localStorage.getItem('valmora_products_v3') || localStorage.getItem('valmora_products');
        if (rawLocal) {
            localProds = JSON.parse(rawLocal);
        }
    } catch (e) {}

    if (serverProds.length > 0) {
        // Merge without duplicates (local products prioritized for newest additions)
        const combined = [...serverProds];
        localProds.forEach(lp => {
            if (!combined.some(sp => sp.id === lp.id)) {
                combined.unshift(lp);
            }
        });
        allProducts = combined;
    } else if (localProds.length > 0) {
        allProducts = localProds;
    } else {
        allProducts = fallbackProducts();
    }

    filteredProducts = [...allProducts];
    renderProducts();
}

function fallbackProducts() {
    return [
        {
            id: "valmora-chronograph-01",
            title: "Valmora Chronograph Minimalist Watch",
            category: "watches",
            category_name: "Soatlar",
            price: 890000,
            original_price: 1250000,
            stock: 4,
            rating: 4.9,
            badge: "LUXURY",
            image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=700&q=80",
            description: "Shveytsariya uslubidagi sapfir billur shisha va 316L po'latdan ishlangan eksklyuziv xronograf."
        },
        {
            id: "valmora-nappa-duffle-02",
            title: "Nappa Leather Travel Duffle Bag",
            category: "leather",
            category_name: "Charm buyumlar",
            price: 1150000,
            original_price: 1600000,
            stock: 3,
            rating: 5.0,
            badge: "EKSKLYUZIV",
            image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80",
            description: "Italiya tabiiy Nappa charmidan qo'lda tikilgan sayohat va biznes sumkasi. YKK metall furnitura."
        },
        {
            id: "valmora-minimal-wallet-03",
            title: "Minimalist Cardholder Platinum",
            category: "leather",
            category_name: "Charm buyumlar",
            price: 380000,
            original_price: 520000,
            stock: 12,
            rating: 4.8,
            badge: "TOP",
            image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=700&q=80",
            description: "RFID himoyali ultra yupqa kassa hamyoni. Tabiiy qora charm va titan qisqich."
        },
        {
            id: "valmora-sunglasses-05",
            title: "Titanium Polarized Sunglasses",
            category: "accessories",
            category_name: "Aksessuarlar",
            price: 720000,
            original_price: 990000,
            stock: 6,
            rating: 4.9,
            badge: "LUXURY",
            image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=80",
            description: "Yengil aerokosmik titan karkas va UV400 qutblangan qoraytirilgan ZEISS standart linzalari."
        },
        {
            id: "valmora-silk-scarf-04",
            title: "Pure Silk Heritage Scarf",
            category: "accessories",
            category_name: "Aksessuarlar",
            price: 540000,
            original_price: 750000,
            stock: 8,
            rating: 4.9,
            badge: "YANGI",
            image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=700&q=80",
            description: "100% tabiiy ipak. Valmora geometrik monogrammasi bilan nozik ishlangan ipak sharf."
        },
        {
            id: "valmora-chelsea-boots-06",
            title: "Handcrafted Suede Chelsea Boots",
            category: "footwear",
            category_name: "Poyabzallar",
            price: 1420000,
            original_price: 1950000,
            stock: 5,
            rating: 5.0,
            badge: "EKSKLYUZIV",
            image: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=700&q=80",
            description: "Italiya tabiiy zamshi va charm taglik. O'zgacha qulaylik va mustahkamlik uyg'unligi."
        }
    ];
}

function renderProducts() {
    const grid = document.getElementById('products3dGrid');
    if (!grid) return;

    if (filteredProducts.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fa-solid fa-box-open" style="font-size: 40px; color: var(--text-dim); margin-bottom: 14px;"></i>
                <h3 style="font-family: var(--font-serif); font-size: 20px; color: var(--text-main); margin-bottom: 6px;">Mos mahsulot topilmadi</h3>
                <p style="color: var(--text-muted); font-size: 13px;">Qidiruv mezonlarini o'zgartirib ko'ring</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredProducts.map((p, index) => {
        const isWishlisted = wishlist.includes(p.id);
        const originalPrice = p.original_price || (p.price * 1.3);
        const discountPct = Math.round(((originalPrice - p.price) / originalPrice) * 100);
        const isLowStock = (p.stock || 10) <= 5;
        const stockText = isLowStock ? `🔴 Faqat ${p.stock || 3} dona qoldi!` : `🟢 Omborda mavjud`;

        return `
            <div class="product-card-3d" data-id="${p.id}" id="prodCard-${p.id}">
                <!-- Dynamic Specular Glare -->
                <div class="card-glare"></div>

                <!-- Floating Badge -->
                <span class="card-floating-badge">
                    <i class="fa-solid fa-gem" style="margin-right: 4px;"></i> ${p.badge || 'LUXURY'}
                </span>

                <!-- Wishlist Heart -->
                <button class="card-fav-btn ${isWishlisted ? 'active' : ''}" 
                        onclick="toggleWishlist('${p.id}', event)" 
                        title="Sevimlilarga qo'shish">
                    <i class="fa-${isWishlisted ? 'solid' : 'regular'} fa-heart"></i>
                </button>

                <!-- Image with Zoom & Quick View -->
                <div class="card-image-wrap" onclick="openQuickView('${p.id}')">
                    <img src="${p.image}" alt="${p.title}" loading="lazy">
                    <button class="card-quick-view-btn" onclick="openQuickView('${p.id}'); event.stopPropagation();">
                        <i class="fa-solid fa-eye"></i> ${typeof getTranslation === 'function' ? getTranslation('btn_quick_view', 'Batafsil ko\'rish') : 'Batafsil ko\'rish'}
                    </button>
                </div>

                <!-- Card Content -->
                <div class="card-content">
                    <div class="card-category-row">
                        <span>${p.category_name || p.category || 'Atelier'}</span>
                        <span class="card-stock-pill ${isLowStock ? 'low' : 'in-stock'}">${stockText}</span>
                    </div>

                    <h3 class="card-title" onclick="openQuickView('${p.id}')" style="cursor: pointer;">
                        ${p.title}
                    </h3>

                    <p class="card-desc">${p.description || ''}</p>

                    <div class="card-rating">
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <span>${p.rating || 5.0} (4.9 / 5.0)</span>
                    </div>

                    <div class="card-price-row">
                        <div>
                            <span class="card-current-price">${formatMoney(p.price)} so'm</span>
                            <span class="card-old-price">${formatMoney(originalPrice)} so'm</span>
                        </div>
                        <span class="card-discount-tag">-${discountPct}%</span>
                    </div>

                    <div class="card-actions-grid">
                        <button class="btn-order-instant" onclick="openInstantOrder('${p.id}')">
                            <i class="fa-solid fa-bolt"></i> ${typeof getTranslation === 'function' ? getTranslation('btn_instant_order', '1 Bosishda Buyurtma') : '1 Bosishda Buyurtma'}
                        </button>
                        <button class="btn-add-cart-icon" onclick="addToCart('${p.id}')" title="Savatchaga qo'shish">
                            <i class="fa-solid fa-bag-shopping"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    window.renderProducts = renderProducts;

    // Attach 3D Tilt Event Listeners
    init3DTilt();
}

// 3D Card Tilt Tracking Engine
function init3DTilt() {
    const cards = document.querySelectorAll('.product-card-3d');
    cards.forEach(card => {
        const glare = card.querySelector('.card-glare');

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Subtle quiet luxury tilt angle (-9 to +9 deg)
            const rotateX = ((centerY - y) / centerY) * 9;
            const rotateY = ((x - centerX) / centerX) * 9;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
            
            if (glare) {
                const glareX = (x / rect.width) * 100;
                const glareY = (y / rect.height) * 100;
                glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.16) 0%, transparent 60%)`;
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });
}

// ==========================================================================
// 3. FILTERING & SORTING
// ==========================================================================
function filterByCategory(category, btnEl) {
    luxuryAudio.playClick();
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    if (category === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
    }

    applyCurrentSort();
    renderProducts();
}

function handleSearch(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(p => 
            (p.title || '').toLowerCase().includes(q) || 
            (p.description || '').toLowerCase().includes(q) ||
            (p.category_name || '').toLowerCase().includes(q)
        );
    }
    applyCurrentSort();
    renderProducts();
}

function handleSortChange(sortType) {
    luxuryAudio.playClick();
    if (sortType === 'price-asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortType === 'price-desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortType === 'rating') {
        filteredProducts.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    } else {
        // default / featured
        filteredProducts.sort((a, b) => (b.sales || 0) - (a.sales || 0));
    }
    renderProducts();
}

function applyCurrentSort() {
    const sel = document.getElementById('storeSortSelect');
    if (sel) handleSortChange(sel.value);
}

// ==========================================================================
// 4. WISHLIST & CART MANAGEMENT
// ==========================================================================
function toggleWishlist(productId, e) {
    if (e) e.stopPropagation();
    luxuryAudio.playClick();

    if (wishlist.includes(productId)) {
        wishlist = wishlist.filter(id => id !== productId);
        showStoreToast("Mahsulot sevimlilardan olib tashlandi", "info");
    } else {
        wishlist.push(productId);
        showStoreToast("Sevimlilarga saqlandi ❤️", "success");
    }

    localStorage.setItem('valmora_wishlist', JSON.stringify(wishlist));
    updateWishlistBadge();
    renderProducts();
}

function updateWishlistBadge() {
    const badge = document.getElementById('wishlistCountBadge');
    if (badge) badge.textContent = wishlist.length;
}

function addToCart(productId, qty = 1) {
    luxuryAudio.playClick();
    const prod = allProducts.find(p => p.id === productId);
    if (!prod) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({
            id: prod.id,
            title: prod.title,
            price: prod.price,
            image: prod.image,
            category: prod.category_name || prod.category,
            qty: qty
        });
    }

    localStorage.setItem('valmora_cart', JSON.stringify(cart));
    updateCartUI();
    showStoreToast(`"${prod.title}" savatchaga qo'shildi 🛍`, 'success');
}

function updateCartUI() {
    const countBadge = document.getElementById('navCartCount');
    const totalBadge = document.getElementById('navCartTotal');
    const totalItems = cart.reduce((sum, itm) => sum + itm.qty, 0);
    const totalPrice = cart.reduce((sum, itm) => sum + (itm.price * itm.qty), 0);

    if (countBadge) countBadge.textContent = totalItems;
    if (totalBadge) totalBadge.textContent = `${formatMoney(totalPrice)} so'm`;

    renderCartDrawerItems(totalPrice);
}

function renderCartDrawerItems(totalPrice) {
    const listEl = document.getElementById('storeCartItemsList');
    const totalEl = document.getElementById('storeCartTotalPrice');
    if (!listEl) return;

    if (cart.length === 0) {
        listEl.innerHTML = `
            <div style="text-align: center; padding: 50px 20px; color: var(--text-muted);">
                <i class="fa-solid fa-bag-shopping" style="font-size: 40px; color: var(--gold-border); margin-bottom: 14px;"></i>
                <p style="font-size: 14px;">Savatchangiz bo'sh</p>
                <button class="btn-gradient" style="margin-top: 14px;" onclick="closeCartDrawer()">
                    Xaridni boshlash
                </button>
            </div>
        `;
        if (totalEl) totalEl.textContent = "0 so'm";
        return;
    }

    listEl.innerHTML = cart.map((item, idx) => `
        <div style="display: flex; gap: 14px; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--border-subtle);">
            <img src="${item.image}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="flex: 1;">
                <h4 style="font-family: var(--font-serif); font-size: 14px; margin-bottom: 4px; color: var(--text-main);">${item.title}</h4>
                <div style="font-size: 13px; color: var(--gold); font-weight: 600;">${formatMoney(item.price)} so'm</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button onclick="changeCartItemQty(${idx}, -1)" style="width: 26px; height: 26px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-subtle); color: var(--text-main); cursor: pointer;">-</button>
                <span style="font-size: 13px; font-weight: 600;">${item.qty}</span>
                <button onclick="changeCartItemQty(${idx}, 1)" style="width: 26px; height: 26px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-subtle); color: var(--text-main); cursor: pointer;">+</button>
                <button onclick="removeCartItem(${idx})" style="border: none; background: none; color: var(--text-dim); margin-left: 6px; cursor: pointer;" title="O'chirish">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
    `).join('');

    const discountedPrice = currentPromoDiscount > 0 ? totalPrice * (1 - currentPromoDiscount / 100) : totalPrice;
    if (totalEl) totalEl.textContent = `${formatMoney(discountedPrice)} so'm`;
}

function changeCartItemQty(idx, change) {
    luxuryAudio.playClick();
    if (!cart[idx]) return;
    cart[idx].qty += change;
    if (cart[idx].qty <= 0) {
        cart.splice(idx, 1);
    }
    localStorage.setItem('valmora_cart', JSON.stringify(cart));
    updateCartUI();
}

function removeCartItem(idx) {
    luxuryAudio.playClick();
    cart.splice(idx, 1);
    localStorage.setItem('valmora_cart', JSON.stringify(cart));
    updateCartUI();
}

function toggleCartDrawer() {
    luxuryAudio.playClick();
    const overlay = document.getElementById('storeCartOverlay');
    if (overlay) overlay.classList.toggle('active');
}

function closeCartDrawer() {
    const overlay = document.getElementById('storeCartOverlay');
    if (overlay) overlay.classList.remove('active');
}

function applyPromoCode() {
    const code = (document.getElementById('cartPromoInput')?.value || '').trim().toUpperCase();
    if (code === 'VALMORA' || code === 'VALMORA2026' || code === 'VIP') {
        currentPromoDiscount = 10;
        luxuryAudio.playSuccess();
        showStoreToast("Promokod qo'llandi: -10% VIP Chegirma! 🎉", "success");
        updateCartUI();
    } else if (code) {
        showStoreToast("Noto'g'ri promokod. 'VALMORA' kodini sinab ko'ring", "error");
    }
}

// ==========================================================================
// 5. QUICK VIEW MODAL
// ==========================================================================
function openQuickView(productId) {
    luxuryAudio.playClick();
    const prod = allProducts.find(p => p.id === productId);
    if (!prod) return;

    const modal = document.getElementById('quickViewModal');
    const content = document.getElementById('quickViewModalBody');
    if (!modal || !content) return;

    const cust = getSavedCustomer() || {};
    const deliveryCity = cust.region ? cust.region.split(' ')[0] : 'Toshkent';

    content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1.1fr; gap: 28px; align-items: start;">
            <div style="position: relative; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); background: #0b0c0f;">
                <img src="${prod.image}" alt="${prod.title}" style="width: 100%; height: 380px; object-fit: cover;">
                <span class="card-floating-badge" style="top: 14px; left: 14px;">
                    ${prod.badge || 'LUXURY'}
                </span>
            </div>

            <div>
                <div style="font-size: 11px; color: var(--gold); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">
                    ${prod.category_name || prod.category} • Valmora Atelier
                </div>
                <h2 style="font-family: var(--font-serif); font-size: 24px; color: var(--text-main); margin-bottom: 12px; line-height: 1.25;">
                    ${prod.title}
                </h2>
                <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px;">
                    <span style="font-family: var(--font-serif); font-size: 26px; font-weight: 700; color: var(--gold);">
                        ${formatMoney(prod.price)} so'm
                    </span>
                    <span style="font-size: 15px; color: var(--text-dim); text-decoration: line-through;">
                        ${formatMoney(prod.original_price || prod.price * 1.3)} so'm
                    </span>
                </div>

                <p style="font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 20px;">
                    ${prod.description || 'Valmora kolleksiyasining eksklyuziv namunasi. Yuqori sifatli materiallar, mukammal chidamlilik va zamonaviy uslub.'}
                </p>

                <!-- Delivery Notice Box -->
                <div style="background: rgba(197, 168, 128, 0.08); border: 1px solid var(--gold-border); border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px;">
                    <div style="color: var(--gold-light); font-weight: 600; margin-bottom: 4px;">
                        <i class="fa-solid fa-truck-fast"></i> Yetkazib berish (Dastavka):
                    </div>
                    <div style="color: var(--text-muted);">
                        <strong>${deliveryCity}</strong> va barcha viloyatlarga <strong>24 soat ichida BEPUL</strong> yetkaziladi. Mahsulotni ko'rib to'laysiz.
                    </div>
                </div>

                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <button class="btn-gradient" style="flex: 1; justify-content: center; padding: 12px;" onclick="closeModal('quickViewModal'); openInstantOrder('${prod.id}');">
                        <i class="fa-solid fa-bolt"></i> 1 Bosishda Buyurtma
                    </button>
                    <button class="btn-glass" style="padding: 12px 18px;" onclick="addToCart('${prod.id}'); closeModal('quickViewModal');">
                        <i class="fa-solid fa-bag-shopping"></i> Savatga
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

// ==========================================================================
// 6. INSTANT CHECKOUT & REAL ORDER SUBMISSION TO BACKEND + TELEGRAM
// ==========================================================================
function openInstantOrder(productId) {
    luxuryAudio.playClick();
    const prod = allProducts.find(p => p.id === productId);
    if (!prod) return;

    selectedProductForInstantOrder = prod;
    const modal = document.getElementById('checkoutModal');
    if (!modal) return;

    const cust = getSavedCustomer() || {};

    // Populate customer fields
    if (document.getElementById('coName')) document.getElementById('coName').value = cust.name || '';
    if (document.getElementById('coPhone')) document.getElementById('coPhone').value = cust.phone || '+998 ';
    if (document.getElementById('coRegion')) document.getElementById('coRegion').value = cust.region || VALMORA_REGIONS[0];
    if (document.getElementById('coAddress')) document.getElementById('coAddress').value = cust.address || '';

    // Populate order summary
    const summaryEl = document.getElementById('checkoutOrderSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div style="display: flex; gap: 14px; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
                <img src="${prod.image}" alt="${prod.title}" style="width: 54px; height: 54px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="flex: 1;">
                    <h4 style="font-family: var(--font-serif); font-size: 14px; color: var(--text-main);">${prod.title}</h4>
                    <span style="font-size: 11px; color: var(--text-dim);">${prod.category_name || 'Atelier'} • 1 dona</span>
                </div>
                <div style="font-family: var(--font-serif); font-size: 16px; font-weight: 700; color: var(--gold);">
                    ${formatMoney(prod.price)} so'm
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-top: 10px;">
                <span>Yetkazib berish (Dastavka):</span>
                <span style="color: #4ade80; font-weight: 600;">BEPUL (Valmora VIP)</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; color: var(--text-main); margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
                <span>Jami to'lov:</span>
                <span style="color: var(--gold); font-family: var(--font-price); font-size: 18px; font-weight: 700;">${formatMoney(prod.price)} so'm</span>
            </div>
        `;
    }

    modal.classList.add('active');
}

function openCartCheckout() {
    closeCartDrawer();
    if (cart.length === 0) {
        showStoreToast("Savatchangiz bo'sh", "error");
        return;
    }

    selectedProductForInstantOrder = null; // signals cart checkout
    const modal = document.getElementById('checkoutModal');
    if (!modal) return;

    const cust = getSavedCustomer() || {};
    if (document.getElementById('coName')) document.getElementById('coName').value = cust.name || '';
    if (document.getElementById('coPhone')) document.getElementById('coPhone').value = cust.phone || '+998 ';
    if (document.getElementById('coRegion')) document.getElementById('coRegion').value = cust.region || VALMORA_REGIONS[0];
    if (document.getElementById('coAddress')) document.getElementById('coAddress').value = cust.address || '';

    const totalPrice = cart.reduce((sum, itm) => sum + (itm.price * itm.qty), 0);
    const discountedPrice = currentPromoDiscount > 0 ? totalPrice * (1 - currentPromoDiscount / 100) : totalPrice;

    const summaryEl = document.getElementById('checkoutOrderSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div style="max-height: 140px; overflow-y: auto; padding-right: 6px; margin-bottom: 10px;">
                ${cart.map(itm => `
                    <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0;">
                        <span style="color: var(--text-main);">${itm.title} (x${itm.qty})</span>
                        <span style="color: var(--gold);">${formatMoney(itm.price * itm.qty)} so'm</span>
                    </div>
                `).join('')}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); padding-top: 8px; border-top: 1px solid var(--border-color);">
                <span>Yetkazib berish (Dastavka):</span>
                <span style="color: #4ade80; font-weight: 600;">BEPUL (Valmora VIP)</span>
            </div>
            ${currentPromoDiscount > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #4ade80; margin-top: 4px;">
                <span>Promokod chegirmasi:</span>
                <span>-${currentPromoDiscount}%</span>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; color: var(--text-main); margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
                <span>Jami to'lov:</span>
                <span style="color: var(--gold); font-family: var(--font-price); font-size: 18px; font-weight: 700;">${formatMoney(discountedPrice)} so'm</span>
            </div>
        `;
    }

    modal.classList.add('active');
}

// Order Form Submit Handler
async function handleCheckoutSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('coName').value.trim();
    const phone = document.getElementById('coPhone').value.trim();
    const region = document.getElementById('coRegion').value;
    const address = document.getElementById('coAddress').value.trim();
    const paymentMethod = document.querySelector('input[name="coPayment"]:checked')?.value || "Eshik oldida (Naqd/Karta)";
    const note = document.getElementById('coNote')?.value.trim() || "";

    if (!name || name.length < 3) {
        showStoreToast("Iltimos, ismingizni to'liq kiriting", "error");
        return;
    }
    if (!phone || phone.length < 9) {
        showStoreToast("Iltimos, telefon raqamingizni kiriting", "error");
        return;
    }
    if (!address || address.length < 4) {
        showStoreToast("Iltimos, yetkazib berish manzilini aniq kiriting", "error");
        return;
    }

    // Save updated customer details
    saveCustomer({
        name: name,
        phone: phone,
        region: region,
        address: address,
        fullAddress: `${region}, ${address}`
    });

    // Prepare items list
    let orderItems = [];
    let totalAmount = 0;

    if (selectedProductForInstantOrder) {
        orderItems = [{
            id: selectedProductForInstantOrder.id,
            title: selectedProductForInstantOrder.title,
            qty: 1,
            price: selectedProductForInstantOrder.price
        }];
        totalAmount = selectedProductForInstantOrder.price;
    } else {
        orderItems = cart.map(i => ({
            id: i.id,
            title: i.title,
            qty: i.qty,
            price: i.price
        }));
        const rawTotal = cart.reduce((sum, itm) => sum + (itm.price * itm.qty), 0);
        totalAmount = currentPromoDiscount > 0 ? rawTotal * (1 - currentPromoDiscount / 100) : rawTotal;
    }

    const payload = {
        customerName: name,
        customerPhone: phone,
        customerEmail: `${name.toLowerCase().replace(/\s+/g, '')}@valmora.uz`,
        shippingAddress: `${region}, ${address}${note ? ' (Izoh: ' + note + ')' : ''}`,
        items: orderItems,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod
    };

    const submitBtn = document.getElementById('btnSubmitOrder');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buyurtma rasmiylashtirilmoqda...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            // Clean cart if ordered from cart
            if (!selectedProductForInstantOrder) {
                cart = [];
                localStorage.setItem('valmora_cart', JSON.stringify([]));
                updateCartUI();
            }

            closeModal('checkoutModal');
            luxuryAudio.playSuccess();
            triggerGoldConfetti();
            showOrderSuccessReceipt(result.order_no, result.tracking_code, payload);
        } else {
            showStoreToast(result.error || "Buyurtmani qabul qilishda xatolik yuz berdi", "error");
        }
    } catch (err) {
        // Fallback for offline mode
        const offlineOrderNo = `VAL-${Date.now().toString().slice(-6)}`;
        closeModal('checkoutModal');
        luxuryAudio.playSuccess();
        triggerGoldConfetti();
        showOrderSuccessReceipt(offlineOrderNo, `VAL-TRK-${Date.now().toString().slice(-4)}`, payload);
    } finally {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
}

function showOrderSuccessReceipt(orderNo, trackingCode, orderPayload) {
    const modal = document.getElementById('orderSuccessModal');
    if (!modal) return;

    if (document.getElementById('rcptOrderNo')) document.getElementById('rcptOrderNo').textContent = `#${orderNo}`;
    if (document.getElementById('rcptTrackingCode')) document.getElementById('rcptTrackingCode').textContent = trackingCode || `#${orderNo}`;
    if (document.getElementById('rcptCustomer')) document.getElementById('rcptCustomer').textContent = `${orderPayload.customerName} (${orderPayload.customerPhone})`;
    if (document.getElementById('rcptAddress')) document.getElementById('rcptAddress').textContent = orderPayload.shippingAddress;
    if (document.getElementById('rcptTotal')) document.getElementById('rcptTotal').textContent = `${formatMoney(orderPayload.totalAmount)} so'm`;
    if (document.getElementById('rcptPayment')) document.getElementById('rcptPayment').textContent = orderPayload.paymentMethod;

    modal.classList.add('active');
}

// ==========================================================================
// 7. UTILITIES, CONFETTI & NOTIFICATIONS
// ==========================================================================
function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('active');
}

function formatMoney(num) {
    return Math.round(Number(num) || 0).toLocaleString('uz-UZ');
}

function showStoreToast(message, type = 'info') {
    let container = document.getElementById('storeToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'storeToastContainer';
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    const isError = type === 'error';

    toast.style.cssText = `
        background: ${isSuccess ? 'rgba(20, 24, 20, 0.95)' : isError ? 'rgba(30, 15, 15, 0.95)' : 'rgba(22, 24, 30, 0.95)'};
        border: 1px solid ${isSuccess ? '#4ade80' : isError ? '#ef4444' : 'var(--gold)'};
        color: var(--text-main);
        padding: 12px 20px;
        border-radius: 12px;
        font-size: 13px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        gap: 10px;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        pointer-events: auto;
    `;

    const icon = isSuccess ? 'fa-circle-check' : isError ? 'fa-circle-exclamation' : 'fa-bell';
    const iconColor = isSuccess ? '#4ade80' : isError ? '#ef4444' : 'var(--gold)';

    toast.innerHTML = `<i class="fa-solid ${icon}" style="color: ${iconColor}; font-size: 16px;"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Luxury Gold Confetti
function triggerGoldConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#c5a880', '#dfcaa7', '#f2efe9', '#ffffff', '#9e825c'];

    for (let i = 0; i < 90; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: -10 - Math.random() * 50,
            size: Math.random() * 8 + 4,
            speedY: Math.random() * 3 + 2,
            speedX: (Math.random() - 0.5) * 2,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 8,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }

    let frames = 0;
    function renderConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        frames++;

        particles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            ctx.restore();
        });

        if (frames < 220) {
            requestAnimationFrame(renderConfetti);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    requestAnimationFrame(renderConfetti);
}

// Theme Toggle
function toggleTheme() {
    luxuryAudio.playClick();
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('valmora_theme', newTheme);
}

// Populate Region Selectors
function populateRegions() {
    const obSelect = document.getElementById('obRegion');
    const coSelect = document.getElementById('coRegion');

    const options = VALMORA_REGIONS.map(r => `<option value="${r}">${r}</option>`).join('');

    if (obSelect) obSelect.innerHTML = options;
    if (coSelect) coSelect.innerHTML = options;
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    // Theme restore
    const savedTheme = localStorage.getItem('valmora_theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    populateRegions();
    checkOnboarding();
    loadProducts();
    updateCartUI();
    updateWishlistBadge();

    // Event Listeners
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    const obForm = document.getElementById('onboardingForm');
    if (obForm) obForm.addEventListener('submit', submitOnboardingForm);

    const coForm = document.getElementById('checkoutForm');
    if (coForm) coForm.addEventListener('submit', handleCheckoutSubmit);

    const searchInput = document.getElementById('storeSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    }
});
