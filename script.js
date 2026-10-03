// ==========================================================================
// VALMORA — LUXURY MINIMALIST ENGINE
// Quiet Luxury Aesthetic | Champagne Gold Palette | Refined Interactions
// ==========================================================================

// Curated Luxury Products for Valmora (Synchronized with Storefront)
const DEFAULT_PRODUCTS = [
    {
        id: "valmora-chronograph-01",
        title: "Valmora Chronograph Minimalist Watch",
        category: "watches",
        category_name: "Soatlar",
        categoryName: "Soatlar",
        price: 890000,
        original_price: 1250000,
        originalPrice: 1250000,
        cost: 420000,
        sales: 0,
        stock: 6,
        rating: 4.9,
        badge: "LUXURY",
        image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=700&q=80",
        description: "Shveytsariya uslubidagi sapfir billur shisha va 316L po'latdan ishlangan eksklyuziv xronograf.",
        status: "active"
    },
    {
        id: "valmora-nappa-duffle-02",
        title: "Nappa Leather Travel Duffle Bag",
        category: "leather",
        category_name: "Charm buyumlar",
        categoryName: "Charm buyumlar",
        price: 1150000,
        original_price: 1600000,
        originalPrice: 1600000,
        cost: 530000,
        sales: 0,
        stock: 4,
        rating: 5.0,
        badge: "EKSKLYUZIV",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80",
        description: "Italiya tabiiy Nappa charmidan qo'lda tikilgan sayohat va biznes sumkasi. YKK metall furnitura.",
        status: "active"
    },
    {
        id: "valmora-minimal-wallet-03",
        title: "Minimalist Cardholder Platinum",
        category: "leather",
        category_name: "Charm buyumlar",
        categoryName: "Charm buyumlar",
        price: 380000,
        original_price: 520000,
        originalPrice: 520000,
        cost: 165000,
        sales: 0,
        stock: 12,
        rating: 4.8,
        badge: "TOP",
        image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=700&q=80",
        description: "RFID himoyali ultra yupqa kassa hamyoni. Tabiiy qora charm va titan qisqich.",
        status: "active"
    },
    {
        id: "valmora-sunglasses-05",
        title: "Titanium Polarized Sunglasses",
        category: "accessories",
        category_name: "Aksessuarlar",
        categoryName: "Aksessuarlar",
        price: 720000,
        original_price: 990000,
        originalPrice: 990000,
        cost: 290000,
        sales: 0,
        stock: 8,
        rating: 4.9,
        badge: "LUXURY",
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=80",
        description: "Yengil aerokosmik titan karkas va UV400 qutblangan qoraytirilgan ZEISS standart linzalari.",
        status: "active"
    },
    {
        id: "valmora-silk-scarf-04",
        title: "Pure Silk Heritage Scarf",
        category: "accessories",
        category_name: "Aksessuarlar",
        categoryName: "Aksessuarlar",
        price: 540000,
        original_price: 750000,
        originalPrice: 750000,
        cost: 210000,
        sales: 0,
        stock: 9,
        rating: 4.9,
        badge: "YANGI",
        image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=700&q=80",
        description: "100% tabiiy ipak. Valmora geometrik monogrammasi bilan nozik ishlangan ipak sharf.",
        status: "active"
    },
    {
        id: "valmora-chelsea-boots-06",
        title: "Handcrafted Suede Chelsea Boots",
        category: "footwear",
        category_name: "Poyabzallar",
        categoryName: "Poyabzallar",
        price: 1420000,
        original_price: 1950000,
        originalPrice: 1950000,
        cost: 650000,
        sales: 0,
        stock: 5,
        rating: 5.0,
        badge: "EKSKLYUZIV",
        image: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=700&q=80",
        description: "Italiya tabiiy zamshi va charm taglik. O'zgacha qulaylik va mustahkamlik uyg'unligi.",
        status: "active"
    }
];

// Initial Orders for Valmora
const DEFAULT_ORDERS = [];

// LocalStorage Keys
const STORAGE_KEYS = {
    PRODUCTS: "valmora_products_v3",
    ORDERS: "valmora_orders_v3",
    CART: "valmora_cart_v3",
    THEME: "valmora_theme_v3"
};

// ==========================================================================
// VALMORA COMMERCE API CLIENT
// ==========================================================================
const valmoraApi = {
    baseUrl: window.VALMORA_API_BASE_URL || "",
    isOnline: false,

    async request(path, options = {}) {
        const headers = new Headers(options.headers || {});
        let token = sessionStorage.getItem("valmora_admin_token");
        if (token) headers.set("Authorization", `Bearer ${token}`);

        const send = () => fetch(`${this.baseUrl}${path}`, { ...options, headers });
        let response = await send();
        if (response.status === 401) {
            token = window.prompt("Admin API kalitini kiriting:");
            if (!token) throw new Error("Admin API kaliti kiritilmadi.");
            sessionStorage.setItem("valmora_admin_token", token.trim());
            headers.set("Authorization", `Bearer ${token.trim()}`);
            response = await send();
            if (response.status === 401) {
                sessionStorage.removeItem("valmora_admin_token");
                throw new Error("Admin API kaliti noto'g'ri.");
            }
        }
        return response;
    },

    async checkHealth() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
            const res = await fetch(`${this.baseUrl}/api/health`, { signal: controller.signal });
            if (res.ok) {
                const data = await res.json();
                this.isOnline = data.status === "healthy" && data.database === "connected";
                this.updateStatusBadge(this.isOnline, data);
                return data;
            }
        } catch (e) {
            this.isOnline = false;
            this.updateStatusBadge(false);
        } finally {
            clearTimeout(timeoutId);
        }
        return null;
    },

    updateStatusBadge(online, data = null) {
        const pills = document.querySelectorAll(".valmora-cloud-pill");
        pills.forEach(pill => {
            const dot = pill.querySelector(".valmora-pulse-dot");
            const text = pill.querySelector(".valmora-cloud-text");
            if (online) {
                if (dot) dot.classList.remove("offline");
                if (text) text.textContent = "VALMORA API";
                pill.title = "VALMORA backend ishlayapti.";
            } else {
                if (dot) dot.classList.add("offline");
                if (text) text.textContent = "API ULANMAGAN";
                pill.title = "Backendga ulanib bo'lmadi.";
            }
        });
    },

    async fetchProducts() {
        const res = await this.request("/api/products?scope=admin");
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Mahsulotlarni yuklab bo'lmadi.");
        saveStoredProducts(data.products || []);
        return data.products || [];
    },

    async createProduct(productData) {
        const response = await this.request("/api/products", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "Mahsulotni saqlab bo'lmadi.");
        return result.product;
    },

    async deleteProduct(productId) {
        const response = await this.request(`/api/products/${encodeURIComponent(productId)}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "Mahsulotni o'chirib bo'lmadi.");
    },

    async createOrder(orderPayload) {
        const response = await this.request("/api/orders", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "Buyurtmani saqlab bo'lmadi.");
        return result;
    },

    async runAiOptimizer(cost, category = "accessories") {
        if (this.isOnline) {
            try {
                const res = await this.request("/api/ai/pricing-optimizer", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cost, category, luxury_factor: 2.15 })
                });
                if (res.ok) return await res.json();
            } catch (e) {}
        }
        // Local intelligent calculation fallback
        const recPrice = Math.round((cost * 2.15) / 10000) * 10000;
        const profit = recPrice - cost - Math.round(cost * 0.22) - 35000;
        const marginPct = Math.round((profit / recPrice) * 100);
        return {
            success: true,
            analysis: {
                base_cost: cost,
                recommended_price: recPrice,
                estimated_net_profit: profit,
                projected_margin: `${marginPct}%`,
                break_even_roas: "1.85x",
                luxury_tier_classification: "Quiet Luxury High-Margin",
                ai_verdict: `Ushbu tovar ${marginPct}% sof foyda bilan Valmora brendi ostida sotishga yuqori darajada tavsiya etiladi.`
            }
        };
    },

    openStatusModal() {
        const modal = document.createElement("div");
        modal.className = "modal-backdrop active";
        modal.id = "valmoraStatusModal";
        modal.innerHTML = `
            <div class="modal" style="max-width: 580px;">
                <div class="modal-header">
                    <div>
                        <span class="badge" style="background: rgba(212,175,55,0.15); color: var(--gold); border: 1px solid var(--gold);">VALMORA</span>
                        <h3 style="margin-top: 6px;">Tizim holati</h3>
                    </div>
                    <button class="modal-close-btn" onclick="document.getElementById('valmoraStatusModal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body">
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 8px; padding: 18px; margin-bottom: 18px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: var(--text-muted);">Backend Serveri:</span>
                            <strong style="color: ${this.isOnline ? '#10b981' : '#eab308'};">${this.isOnline ? '● Python Multi-Threaded HTTP (ONLINE)' : '● Standalone Local Mode'}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: var(--text-muted);">Ma'lumotlar Bazasi:</span>
                            <strong>${this.isOnline ? 'Ulangan' : 'Ulanmagan'}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: var(--text-muted);">API Shlyuzi:</span>
                            <code>${this.baseUrl || window.location.origin}/api</code>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-gradient" style="flex: 1;" onclick="window.open(valmoraApi.baseUrl + '/api/docs', '_blank')">
                            <i class="fa-solid fa-code"></i> API Explorer & Docs
                        </button>
                        <button class="btn-glass" onclick="document.getElementById('valmoraStatusModal').remove()">Yopish</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    openCertificateModal(order) {
        const orderNo = order.id || order.order_no || `#VAL-${Math.floor(1000 + Math.random()*9000)}`;
        const customer = order.customer || order.customer_name || "Hurmatli Mijoz";
        const date = order.date || new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
        const productTitle = order.product || (order.items && order.items[0] ? order.items[0].title : "Valmora Signature Masterpiece");
        const price = order.price || order.total_amount || 890000;
        const tracking = order.tracking_code || `VAL-UZ-${Math.floor(100000 + Math.random()*900000)}`;

        const modal = document.createElement("div");
        modal.className = "modal-backdrop active";
        modal.id = "valmoraCertModal";
        modal.innerHTML = `
            <div class="modal" style="max-width: 740px; padding: 0; background: transparent; border: none; box-shadow: none;">
                <div style="display: flex; justify-content: flex-end; margin-bottom: 12px; gap: 10px;">
                    <button class="btn-gradient" onclick="window.print()"><i class="fa-solid fa-print"></i> Chop Etish / PDF Saqlash</button>
                    <button class="btn-glass" onclick="document.getElementById('valmoraCertModal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div id="valmoraCertPrintArea" class="valmora-cert-container">
                    <div class="valmora-cert-border-inner">
                        <div class="valmora-cert-watermark">VALMORA</div>
                        
                        <div class="valmora-cert-header">
                            <div style="font-size: 24px; color: #d4af37;"><i class="fa-solid fa-gem"></i></div>
                            <div class="valmora-cert-title">VALMORA</div>
                            <div class="valmora-cert-subtitle">Certificate of Authenticity & Official Invoice</div>
                        </div>

                        <div class="valmora-cert-grid">
                            <div>
                                <div style="font-size: 11px; color: rgba(255,255,255,0.5);">BUYURTMA RAQAMI:</div>
                                <div style="font-weight: 600; color: #d4af37; font-size: 14px;">${orderNo}</div>
                                <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 8px;">KAFOLAT SERIYASI:</div>
                                <div style="font-family: monospace; font-size: 13px;">${tracking}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 11px; color: rgba(255,255,255,0.5);">RASMIY MIJOZ:</div>
                                <div style="font-weight: 600; font-size: 14px;">${customer}</div>
                                <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 8px;">SANA:</div>
                                <div style="font-size: 13px;">${date}</div>
                            </div>
                        </div>

                        <table class="valmora-cert-items-table">
                            <thead>
                                <tr>
                                    <th>MAHSULOT VA SPETSIFIKATSIYA</th>
                                    <th style="text-align: center;">MIQDOR</th>
                                    <th style="text-align: right;">SUMMA</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <strong style="color: #ffffff;">${productTitle}</strong>
                                        <div style="font-size: 11px; color: rgba(255,255,255,0.5);">Valmora eksklyuziv sifat tekshiruvidan o'tgan original buyum.</div>
                                    </td>
                                    <td style="text-align: center;">1 dona</td>
                                    <td style="text-align: right; font-weight: 600; color: #d4af37;">${formatSum(price)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="valmora-cert-footer">
                            <div style="font-size: 11px; color: rgba(255,255,255,0.5); max-width: 380px;">
                                Ushbu hujjat mahsulotning haqiqiyligini va Valmora brendining 2 yillik xalqaro kafolatini tasdiqlaydi.
                            </div>
                            <div class="valmora-cert-seal">
                                <i class="fa-solid fa-crown" style="font-size: 14px; margin-bottom: 2px;"></i>
                                <span>VALMORA</span>
                                <span style="font-size: 7px; color: #ffffff;">AUTHENTIC</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
};

window.valmoraApi = valmoraApi;

// Data Helpers
function getStoredProducts() {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
        return DEFAULT_PRODUCTS;
    }
    try {
        let prods = JSON.parse(raw);
        // Ensure storefront flagship products exist
        const hasStorefrontItems = prods.some(p => p.id === 'valmora-chronograph-01' || p.id === 'valmora-nappa-duffle-02');
        if (!hasStorefrontItems) {
            // Keep any user-added custom products (vm-timestamp), replace legacy defaults with genuine storefront products
            const customUserProds = prods.filter(p => p.id && p.id.startsWith('vm-') && p.id.length > 8);
            prods = [...customUserProds, ...DEFAULT_PRODUCTS];
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(prods));
        }
        return prods;
    } catch (e) {
        return DEFAULT_PRODUCTS;
    }
}

function saveStoredProducts(products) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

function getStoredOrders() {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
        return DEFAULT_ORDERS;
    }
    return JSON.parse(raw);
}

function saveStoredOrders(orders) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

function getStoredCart() {
    const raw = localStorage.getItem(STORAGE_KEYS.CART);
    return raw ? JSON.parse(raw) : [];
}

function saveStoredCart(cart) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    updateCartUI();
}

// Currency Formatter
function formatSum(num) {
    return Number(num).toLocaleString('uz-UZ') + " so'm";
}

// ==========================================================================
// SUBTLE LUXURY AUDIO FEEDBACK
// ==========================================================================
class LuxuryAudio {
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
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(520, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(260, this.ctx.currentTime + 0.04);
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.04);
        } catch (e) {}
    }
    playSuccess() {
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            // Warm subtle major chord
            [440, 554.37, 659.25].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                gain.gain.setValueAtTime(0.09, now + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.4);
            });
        } catch (e) {}
    }
}
const sound = new LuxuryAudio();

// ==========================================================================
// ELEGANT GOLD CONFETTI (Subtle Champagne Gold Palette)
// ==========================================================================
function launchConfetti() {
    let canvas = document.getElementById("confettiCanvas");
    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.id = "confettiCanvas";
        document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ["#c5a880", "#dfcaa7", "#9e825c", "#f2efe9", "#e6dfd5", "#ffffff"];
    for (let i = 0; i < 75; i++) {
        pieces.push({
            x: canvas.width / 2 + (Math.random() * 140 - 70),
            y: canvas.height * 0.6,
            size: Math.random() * 7 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedX: (Math.random() - 0.5) * 16,
            speedY: -(Math.random() * 16 + 6),
            gravity: 0.45,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 8,
            opacity: 1
        });
    }

    let animationFrame;
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        pieces.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.speedY += p.gravity;
            p.speedX *= 0.98;
            p.rotation += p.rotationSpeed;
            p.opacity -= 0.01;

            if (p.opacity > 0 && p.y < canvas.height + 40) {
                alive = true;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
                ctx.restore();
            }
        });

        if (alive) {
            animationFrame = requestAnimationFrame(render);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            cancelAnimationFrame(animationFrame);
        }
    }
    render();
}

// ==========================================================================
// TOAST NOTIFICATIONS (Quiet & Clean)
// ==========================================================================
function showToast(message, type = "success", icon = "fa-check") {
    let toast = document.querySelector(".dropship-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "dropship-toast";
        document.body.appendChild(toast);
    }
    toast.className = `dropship-toast ${type} show`;
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3600);
}

// ==========================================================================
// THEME SWITCHER
// ==========================================================================
function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);

    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            sound.playClick();
            const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
            updateThemeIcon(newTheme);
            showToast(newTheme === "dark" ? "Tungi rejim yoqildi" : "Yorug' rejim yoqildi", "success", "fa-circle-half-stroke");
        });
    }
}

function updateThemeIcon(theme) {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    const icon = btn.querySelector("i");
    if (icon) {
        icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    }
}

// ==========================================================================
// RENDER PRODUCTS GRID
// ==========================================================================
let currentFilter = "all";
let currentSearch = "";
let currentSort = "popular";

function renderProductsGrid() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    let products = getStoredProducts();

    if (currentFilter !== "all") {
        products = products.filter(p => p.category === currentFilter);
    }

    if (currentSearch.trim()) {
        const query = currentSearch.toLowerCase();
        products = products.filter(p => 
            p.title.toLowerCase().includes(query) || 
            p.categoryName.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query)
        );
    }

    if (currentSort === "price-low") {
        products.sort((a, b) => a.price - b.price);
    } else if (currentSort === "price-high") {
        products.sort((a, b) => b.price - a.price);
    } else if (currentSort === "profit-high") {
        products.sort((a, b) => (b.price - b.cost) - (a.price - a.cost));
    } else {
        products.sort((a, b) => b.sales - a.sales);
    }

    updateProductStats(products);

    if (products.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-color);">
                <i class="fa-solid fa-compass" style="font-size: 32px; color: var(--gold); margin-bottom: 12px;"></i>
                <h3 style="font-family: var(--font-serif); font-size: 19px; margin-bottom: 4px;">Katalogda mos tovar topilmadi</h3>
                <p style="color: var(--text-muted); font-size: 12px;">Qidiruv mezonlarini o'zgartiring yoki yangi tovar qo'shing.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = products.map(prod => {
        const profit = prod.price - prod.cost;
        const marginPct = Math.round((profit / prod.price) * 100);

        let badgeHtml = '';
        if (prod.badge === 'hot') {
            badgeHtml = `<span class="badge-tag hot">Signature</span>`;
        } else if (prod.badge === 'profit') {
            badgeHtml = `<span class="badge-tag profit">+${marginPct}% Marja</span>`;
        } else if (prod.stock <= 5) {
            badgeHtml = `<span class="badge-tag stock-low">Omborda: ${prod.stock}</span>`;
        }

        return `
            <div class="product-card" data-id="${prod.id}">
                <div class="product-image-wrap">
                    <img src="${prod.image}" alt="${prod.title}" class="product-img" loading="lazy">
                    
                    <div class="card-badges">
                        ${badgeHtml}
                    </div>

                    <span class="stock-status ${prod.status === 'active' ? 'active' : 'inactive'}">
                        ${prod.status === 'active' ? 'Mavjud' : 'Tugagan'}
                    </span>

                    <div class="card-overlay-actions">
                        <button class="overlay-btn" onclick="openQuickView('${prod.id}')">
                            <i class="fa-regular fa-eye"></i> Tafsilotlar
                        </button>
                    </div>
                </div>

                <div class="product-content">
                    <div class="card-category-row">
                        <span class="prod-category">${prod.categoryName}</span>
                        <div class="prod-rating">
                            <i class="fa-solid fa-star"></i>
                            <span>${prod.rating}</span>
                        </div>
                    </div>

                    <h3 class="product-title">${prod.title}</h3>

                    <div class="price-container">
                        <span class="main-price">${formatSum(prod.price)}</span>
                        ${prod.originalPrice ? `<span class="original-price">${formatSum(prod.originalPrice)}</span>` : ''}
                    </div>

                    <div class="dropship-metrics">
                        <div class="metric-item">
                            <span>Tannarx</span>
                            <strong>${formatSum(prod.cost)}</strong>
                        </div>
                        <div class="metric-item profit-metric">
                            <span>Sof Foyda</span>
                            <strong>+${formatSum(profit)}</strong>
                        </div>
                    </div>

                    <div class="product-card-actions">
                        <button class="btn-quick-buy" onclick="openQuickBuy('${prod.id}')">
                            Tezkor Xarid
                        </button>
                        <button class="btn-add-cart" title="Savatchaga qo'shish" onclick="addToCart('${prod.id}')">
                            <i class="fa-solid fa-bag-shopping"></i>
                        </button>
                    </div>

                    <div class="card-sales-footer">
                        <span><i class="fa-regular fa-circle-check"></i> ${prod.sales} buyurtma</span>
                        <button class="btn-delete-card" title="O'chirish" onclick="deleteProduct('${prod.id}')">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function updateProductStats(filteredProducts) {
    const all = getStoredProducts();
    const totalEl = document.getElementById("totalProducts");
    const activeEl = document.getElementById("activeProducts");
    const totalSalesEl = document.getElementById("totalSalesStat");
    const totalProfitEl = document.getElementById("totalProfitStat");

    if (totalEl) totalEl.textContent = all.length;
    if (activeEl) activeEl.textContent = all.filter(p => p.status === 'active').length;
    
    const totalSales = all.reduce((acc, p) => acc + (p.sales || 0), 0);
    if (totalSalesEl) totalSalesEl.textContent = totalSales;

    const totalProfit = all.reduce((acc, p) => acc + ((p.price - p.cost) * (p.sales || 0)), 0);
    if (totalProfitEl) {
        if (totalProfit >= 1000000) {
            totalProfitEl.textContent = (totalProfit / 1000000).toFixed(1) + " mln";
        } else {
            totalProfitEl.textContent = formatSum(totalProfit);
        }
    }
}

// ==========================================================================
// QUICK BUY & QUICK VIEW MODALS
// ==========================================================================
let activeQuickBuyProduct = null;

function openQuickBuy(productId) {
    sound.playClick();
    const products = getStoredProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    activeQuickBuyProduct = product;

    const modal = document.getElementById("quickBuyModal");
    if (!modal) return;

    document.getElementById("qbThumb").src = product.image;
    document.getElementById("qbTitle").textContent = product.title;
    document.getElementById("qbPrice").textContent = formatSum(product.price);
    document.getElementById("qbProfit").textContent = "+" + formatSum(product.price - product.cost);
    
    const form = document.getElementById("quickBuyForm");
    if (form) form.reset();

    modal.classList.add("show");
}

function closeQuickBuy() {
    const modal = document.getElementById("quickBuyModal");
    if (modal) modal.classList.remove("show");
    activeQuickBuyProduct = null;
}

function openQuickView(productId) {
    sound.playClick();
    const products = getStoredProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const modal = document.getElementById("quickViewModal");
    if (!modal) return;

    document.getElementById("qvImg").src = product.image;
    document.getElementById("qvTitle").textContent = product.title;
    document.getElementById("qvCategory").textContent = product.categoryName;
    document.getElementById("qvPrice").textContent = formatSum(product.price);
    document.getElementById("qvCost").textContent = formatSum(product.cost);
    document.getElementById("qvProfit").textContent = "+" + formatSum(product.price - product.cost);
    document.getElementById("qvDescription").textContent = product.description;
    document.getElementById("qvStock").textContent = product.stock + " dona omborda";

    const buyBtn = document.getElementById("qvBuyBtn");
    if (buyBtn) {
        buyBtn.onclick = () => {
            closeQuickView();
            openQuickBuy(product.id);
        };
    }

    modal.classList.add("show");
}

function closeQuickView() {
    const modal = document.getElementById("quickViewModal");
    if (modal) modal.classList.remove("show");
}

// ==========================================================================
// ADD PRODUCT & DELETE PRODUCT
// ==========================================================================
function initAddProductModal() {
    const openBtn = document.getElementById("addProductBtn");
    const modal = document.getElementById("productModal");
    const closeBtn = document.getElementById("closeModal");
    const cancelBtn = document.getElementById("cancelProduct");
    const form = document.getElementById("productForm");

    if (openBtn && modal) {
        openBtn.addEventListener("click", () => {
            sound.playClick();
            modal.classList.add("show");
        });
    }

    function closeModal() {
        if (modal) modal.classList.remove("show");
    }

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    const priceInput = document.getElementById("productPrice");
    const costInput = document.getElementById("productCost");
    const profitPreview = document.getElementById("profitPreview");

    function calculateProfit() {
        const price = Number(priceInput?.value || 0);
        const cost = Number(costInput?.value || 0);
        const profit = price - cost;
        if (profitPreview) {
            profitPreview.textContent = formatSum(Math.max(0, profit));
        }
    }

    if (priceInput) priceInput.addEventListener("input", calculateProfit);
    if (costInput) costInput.addEventListener("input", calculateProfit);

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("productName").value.trim();
            const price = Number(document.getElementById("productPrice").value);
            const cost = Number(document.getElementById("productCost").value);
            const category = document.getElementById("productCategory").value;
            const imgUrl = document.getElementById("productImage")?.value.trim() || 
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80";

            const customDesc = document.getElementById("productDesc")?.value.trim();

            const catMap = {
                watches: "Soatlar",
                leather: "Charm buyumlar",
                accessories: "Aksessuarlar",
                footwear: "Poyabzallar",
                fashion: "Moda & Libos",
                home: "Uy & Interyer",
                electronics: "Elektronika"
            };

            const newProduct = {
                id: "vm-" + Date.now(),
                title: name,
                category: category,
                category_name: catMap[category] || "Kolleksiya",
                categoryName: catMap[category] || "Kolleksiya",
                price: price,
                original_price: Math.round(price * 1.3),
                originalPrice: Math.round(price * 1.3),
                cost: cost,
                sales: 0,
                stock: 10,
                rating: 5.0,
                badge: "LUXURY",
                image: imgUrl,
                description: customDesc || `${name} — Valmora tanlovi. Sof tabiiy materiallar va sokin lyuks estetika.`,
                status: "active"
            };

            try {
                const savedProduct = await valmoraApi.createProduct(newProduct);
                const products = getStoredProducts().filter(product => product.id !== savedProduct.id);
                products.unshift(savedProduct);
                saveStoredProducts(products);
                closeModal();
                form.reset();
                renderProductsGrid();
                sound.playSuccess();
                launchConfetti();
                showToast(`"${name}" VALMORA katalogiga saqlandi.`, "success");
            } catch (error) {
                showToast(error.message || "Mahsulotni saqlashda xatolik.", "error");
            }
        });
    }
}

async function deleteProduct(productId) {
    sound.playClick();
    if (confirm("Mahsulotni o'chirishni tasdiqlaysizmi?")) {
        try {
            await valmoraApi.deleteProduct(productId);
            const products = getStoredProducts().filter(product => product.id !== productId);
            saveStoredProducts(products);
            renderProductsGrid();
            showToast("Mahsulot o'chirildi.", "success");
        } catch (error) {
            showToast(error.message || "Mahsulotni o'chirishda xatolik.", "error");
        }
    }
}

// ==========================================================================
// CART DRAWER
// ==========================================================================
function addToCart(productId) {
    sound.playClick();
    const products = getStoredProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    let cart = getStoredCart();
    const existing = cart.find(item => item.id === productId);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            qty: 1
        });
    }

    saveStoredCart(cart);
    sound.playSuccess();
    showToast(`"${product.title}" savatchada`, "success", "fa-bag-shopping");
}

function updateCartUI() {
    const cart = getStoredCart();
    const countBadge = document.querySelectorAll(".cart-counter");
    const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

    countBadge.forEach(badge => {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? "flex" : "none";
    });

    const itemsContainer = document.getElementById("cartItemsList");
    const totalEl = document.getElementById("cartTotalPrice");

    if (itemsContainer) {
        if (cart.length === 0) {
            itemsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px 10px; color: var(--text-dim);">
                    <i class="fa-solid fa-bag-shopping" style="font-size: 28px; color: var(--gold); margin-bottom: 10px; display: block;"></i>
                    <p style="font-size: 13px; font-weight: 500;">Savatchangiz bo'sh</p>
                </div>
            `;
        } else {
            itemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.title}" class="cart-item-img">
                    <div class="cart-item-info">
                        <h5>${item.title}</h5>
                        <span class="item-price">${formatSum(item.price)}</span>
                    </div>
                    <div class="cart-item-qty">
                        <button onclick="changeCartQty('${item.id}', -1)">-</button>
                        <span>${item.qty}</span>
                        <button onclick="changeCartQty('${item.id}', 1)">+</button>
                    </div>
                    <button class="cart-item-remove" onclick="removeCartItem('${item.id}')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `).join("");
        }
    }

    if (totalEl) {
        const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
        totalEl.textContent = formatSum(total);
    }
}

function changeCartQty(id, delta) {
    sound.playClick();
    let cart = getStoredCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    saveStoredCart(cart);
}

function removeCartItem(id) {
    sound.playClick();
    let cart = getStoredCart();
    cart = cart.filter(i => i.id !== id);
    saveStoredCart(cart);
}

function initCartDrawer() {
    const toggleButtons = document.querySelectorAll(".cart-toggle-btn");
    const overlay = document.getElementById("cartOverlay");
    const closeBtn = document.getElementById("closeCartBtn");

    toggleButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            sound.playClick();
            if (overlay) overlay.classList.add("open");
        });
    });

    if (closeBtn && overlay) {
        closeBtn.addEventListener("click", () => {
            overlay.classList.remove("open");
        });
    }

    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                overlay.classList.remove("open");
            }
        });
    }

    const checkoutBtn = document.getElementById("cartCheckoutBtn");
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", async () => {
            const cart = getStoredCart();
            if (cart.length === 0) {
                showToast("Avval tovar tanlang", "error");
                return;
            }
            sound.playSuccess();
            launchConfetti();

            const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
            const orderPayload = {
                customerName: "Valmora VIP Mijoz",
                customerPhone: "+998 90 123 45 67",
                shippingAddress: "Toshkent sh., Mirobod",
                items: cart,
                totalAmount: total,
                paymentMethod: "Valmora Instant Express"
            };

            // Save to Backend and Local DB
            const res = await valmoraApi.createOrder(orderPayload);
            const newOrder = {
                id: res.order_no || `#VM-${Math.floor(8000 + Math.random() * 1000)}`,
                customer: "Valmora VIP Mijoz",
                city: "Toshkent",
                product: cart.map(i => `${i.title} (x${i.qty})`).join(", "),
                price: total,
                date: "Hozirgina",
                status: "completed",
                tracking_code: res.tracking_code
            };

            const orders = getStoredOrders();
            orders.unshift(newOrder);
            saveStoredOrders(orders);

            localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
            updateCartUI();
            if (overlay) overlay.classList.remove("open");

            showToast("Buyurtma rasmiylashtirildi & DB ga saqlandi", "success");
            
            // Auto open luxury certificate
            setTimeout(() => {
                valmoraApi.openCertificateModal(newOrder);
            }, 600);
        });
    }
}

// ==========================================================================
// QUICK BUY FORM
// ==========================================================================
function initQuickBuyForm() {
    const form = document.getElementById("quickBuyForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        sound.playSuccess();
        launchConfetti();

        const name = document.getElementById("qbCustomerName").value.trim();
        const phone = document.getElementById("qbCustomerPhone").value.trim();
        const city = document.getElementById("qbCustomerCity")?.value || "Toshkent";

        const orderId = "#VM-" + Math.floor(1000 + Math.random() * 9000);
        const newOrder = {
            id: orderId,
            customer: name,
            phone: phone,
            city: city,
            product: activeQuickBuyProduct ? activeQuickBuyProduct.title : "Valmora Mahsuloti",
            price: activeQuickBuyProduct ? activeQuickBuyProduct.price : 690000,
            date: "Hozirgina",
            status: "completed"
        };

        if (activeQuickBuyProduct) {
            const products = getStoredProducts();
            const prod = products.find(p => p.id === activeQuickBuyProduct.id);
            if (prod) {
                prod.sales = (prod.sales || 0) + 1;
                prod.stock = Math.max(1, (prod.stock || 5) - 1);
                saveStoredProducts(products);
                renderProductsGrid();
            }
        }

        const orders = getStoredOrders();
        orders.unshift(newOrder);
        saveStoredOrders(orders);

        closeQuickBuy();
        showToast(`Rahmat, ${name}! Buyurtmangiz qabul qilindi (${orderId})`, "success");
    });
}

// ==========================================================================
// SUBTLE LUXURY SALES POPUP
// ==========================================================================
const BUYER_NAMES = [
    { name: "Sardor Akbarov", city: "Toshkent" },
    { name: "Jasur Bekmirzayev", city: "Samarqand" },
    { name: "Malika Aliyeva", city: "Farg'ona" },
    { name: "Bobur Mirzayev", city: "Buxoro" },
    { name: "Shahnoza Yusupova", city: "Andijon" }
];

function triggerLiveSalesPopup() {
    let toast = document.querySelector(".live-sales-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "live-sales-toast";
        document.body.appendChild(toast);
    }

    const products = getStoredProducts();
    if (!products.length) return;

    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const randomBuyer = BUYER_NAMES[Math.floor(Math.random() * BUYER_NAMES.length)];
    const minutesAgo = Math.floor(Math.random() * 8) + 1;

    toast.innerHTML = `
        <img src="${randomProduct.image}" alt="${randomProduct.title}" class="toast-img">
        <div class="toast-body">
            <strong>${randomBuyer.name} (${randomBuyer.city})</strong>
            <p>${randomProduct.title.substring(0, 26)}...</p>
            <span class="toast-time">${minutesAgo} daqiqa oldin • Tasdiqlangan buyurtma</span>
        </div>
    `;

    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 5000);
}

// ==========================================================================
// DASHBOARD LOGIC (index.html)
// ==========================================================================
async function initDashboardPage() {
    const revenueEl = document.getElementById("dashTotalRevenue");
    const ordersEl = document.getElementById("dashTotalOrders");
    const profitEl = document.getElementById("dashTotalProfit");
    const tbody = document.getElementById("recentOrdersTbody");
    if (!tbody) return;

    try {
        const response = await valmoraApi.request("/api/overview");
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || "Dashboard ma'lumotlarini yuklab bo'lmadi.");
        }

        const metrics = result.metrics;
        if (revenueEl) revenueEl.textContent = formatSum(metrics.total_revenue);
        if (ordersEl) ordersEl.textContent = metrics.total_orders;
        if (profitEl) profitEl.textContent = formatSum(metrics.net_profit);
        const orders = result.recent_orders || [];
        tbody.innerHTML = orders.length ? orders.map(o => `
            <tr>
                <td class="order-id">${o.order_no}</td>
                <td>
                    <div class="customer">
                        <div class="customer-avatar">${o.customer_name ? o.customer_name[0].toUpperCase() : 'M'}</div>
                        <span>${o.customer_name || "Mijoz"}</span>
                    </div>
                </td>
                <td>${(o.items || []).map(item => `${item.title} (x${item.qty})`).join(", ")}</td>
                <td>${o.created_at || ""}</td>
                <td><strong>${formatSum(o.total_amount)}</strong></td>
                <td>
                    <span class="status-badge ${o.status}">
                        ${o.status === 'completed' ? 'Yakunlangan' : o.status === 'shipping' ? 'Yetkazilmoqda' : 'Kutilmoqda'}
                    </span>
                </td>
            </tr>
        `).join("") : '<tr><td colspan="6" style="text-align:center;padding:24px;">Hozircha buyurtmalar yo‘q.</td></tr>';
    } catch (error) {
        console.error("Dashboard API error:", error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#ff6b6b;">${error.message}</td></tr>`;
    }
}

// ==========================================================================
// FILTERS & LISTENERS
// ==========================================================================
function initFilters() {
    const searchInput = document.getElementById("productSearch");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentSearch = e.target.value;
            renderProductsGrid();
        });
    }

    const sortSelect = document.getElementById("sortFilter");
    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            currentSort = e.target.value;
            renderProductsGrid();
        });
    }

    const categoryPills = document.querySelectorAll(".cat-pill");
    categoryPills.forEach(pill => {
        pill.addEventListener("click", function() {
            sound.playClick();
            categoryPills.forEach(p => p.classList.remove("active"));
            this.classList.add("active");
            currentFilter = this.getAttribute("data-category") || "all";
            renderProductsGrid();
        });
    });
}

function initMobileMenu() {
    const menuBtn = document.getElementById("mobileMenuBtn");
    const sidebar = document.querySelector(".sidebar");
    if (menuBtn && sidebar) {
        menuBtn.addEventListener("click", () => {
            sound.playClick();
            sidebar.classList.toggle("open");
        });
    }
}

function injectCloudPill() {
    const headerRight = document.querySelector(".header-right, .header-actions");
    if (headerRight && !document.querySelector(".valmora-cloud-pill")) {
        const pill = document.createElement("div");
        pill.className = "valmora-cloud-pill";
        pill.onclick = () => valmoraApi.openStatusModal();
        pill.innerHTML = `
            <span class="valmora-pulse-dot"></span>
            <span class="valmora-cloud-text">VALMORA CLOUD v3.5</span>
        `;
        headerRight.insertBefore(pill, headerRight.firstChild);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    initTheme();
    initMobileMenu();
    initCartDrawer();
    initQuickBuyForm();
    initAddProductModal();
    initFilters();
    updateCartUI();
    injectCloudPill();

    valmoraApi.checkHealth();

    if (document.getElementById("productsGrid")) {
        valmoraApi.fetchProducts().then(products => {
            saveStoredProducts(products);
            renderProductsGrid();
        }).catch(error => showToast(error.message || "Mahsulotlarni yuklab bo'lmadi.", "error"));
    }

    if (document.getElementById("recentOrdersTbody")) {
        initDashboardPage();
    }

    setInterval(triggerLiveSalesPopup, 25000);
    setTimeout(triggerLiveSalesPopup, 4000);
});