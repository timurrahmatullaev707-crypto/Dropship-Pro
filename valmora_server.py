#!/usr/bin/env python3
"""
=============================================================================
VALMORA - Commerce API Backend
=============================================================================
Brand: VALMORA
Version: 3.5.0 Enterprise Flagship
Architecture: Multi-Threaded Non-Blocking Python REST API + SQLite3 Engine
Target Market Value: $1,000+ Turnkey Luxury E-Commerce Solution
Author: Valmora Engineering
=============================================================================
"""

import sys
import os
import json
import sqlite3
import urllib.parse
import urllib.error
import mimetypes
from datetime import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
import urllib.request
import threading
import uuid
import hmac
import math

# Configuration
PORT = int(os.environ.get("PORT", 8080))
HOST = '0.0.0.0'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get('VALMORA_DB_PATH', os.path.join(BASE_DIR, 'valmora.db'))

# =============================================================================
# DATABASE INITIALIZATION & SCHEMA
# =============================================================================
def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA busy_timeout = 30000')
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Products Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            category_name TEXT NOT NULL,
            price REAL NOT NULL,
            original_price REAL NOT NULL,
            cost REAL NOT NULL,
            margin_percent REAL NOT NULL,
            stock INTEGER DEFAULT 10,
            sales INTEGER DEFAULT 0,
            rating REAL DEFAULT 5.0,
            badge TEXT DEFAULT 'LUXURY',
            image TEXT,
            description TEXT,
            status TEXT DEFAULT 'active',
            supplier TEXT DEFAULT 'Valmora Direct Atelier',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Orders Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            order_no TEXT UNIQUE NOT NULL,
            customer_name TEXT NOT NULL,
            customer_phone TEXT,
            customer_email TEXT,
            shipping_address TEXT,
            total_amount REAL NOT NULL,
            net_profit REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            items_json TEXT NOT NULL,
            payment_method TEXT DEFAULT 'Karta (Humo/Uzcard)',
            tracking_code TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Customers Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            city TEXT DEFAULT 'Toshkent',
            email TEXT,
            tier TEXT DEFAULT 'Valmora VIP',
            orders_count INTEGER DEFAULT 1,
            total_spent REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Financial Transactions Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            trx_code TEXT UNIQUE NOT NULL,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'Tasdiqlangan',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Settings Key-Value Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    ''')

    # System Logs / Telemetry
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS telemetry_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            details TEXT,
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Seed Default Data if empty
    cursor.execute('SELECT COUNT(*) as cnt FROM products')
    if cursor.fetchone()['cnt'] == 0:
        seed_data(cursor)

    # Seed Settings if empty
    cursor.execute('SELECT COUNT(*) as cnt FROM settings')
    if cursor.fetchone()['cnt'] == 0:
        default_settings = {
            'store_name': 'VALMORA',
            'currency': 'so\'m',
            'currency_symbol': 'UZS',
            'tax_rate': '0',
            'auto_dropship_sync': 'true',
            'ai_smart_margin_target': '48',
            'telegram_bot_token': '',
            'telegram_chat_id': '',
            'support_phone': '+998 71 200 88 00',
            'admin_name': 'Timur',
            'admin_role': 'Asoschi & Bosh Admin',
            'platform_version': 'VALMORA'
        }
        for k, v in default_settings.items():
            cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', (k, v))

    cursor.execute(
        "UPDATE settings SET value = 'VALMORA' WHERE key = 'store_name' AND value = 'VALMORA LUXE'"
    )
    conn.commit()
    conn.close()

def seed_data(cursor):
    """Seed initial luxury flagship products, orders and customers into Valmora DB"""
    initial_products = [
        {
            "id": "valmora-chronograph-01",
            "title": "Valmora Chronograph Watch",
            "category": "watches",
            "category_name": "Soatlar",
            "price": 890000,
            "original_price": 1250000,
            "cost": 420000,
            "margin_percent": 52.8,
            "stock": 14,
            "sales": 0,
            "rating": 4.9,
            "badge": "LUXURY",
            "image": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=700&q=80",
            "description": "Valmora Chronograph — sapfir billur shisha va shveytsariya mexanizmi uyg'unligi.",
            "status": "active"
        },
        {
            "id": "valmora-nappa-duffle-02",
            "title": "Nappa Leather Travel Duffle",
            "category": "leather",
            "category_name": "Charm buyumlar",
            "price": 1150000,
            "original_price": 1600000,
            "cost": 530000,
            "margin_percent": 53.9,
            "stock": 9,
            "sales": 0,
            "rating": 5.0,
            "badge": "EKSKLYUZIV",
            "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80",
            "description": "Italiya uslubidagi qo'lda tikilgan Nappa charmi. Sayohat va nufuzli uchrashuvlar uchun.",
            "status": "active"
        },
        {
            "id": "valmora-minimal-wallet-03",
            "title": "Minimalist Cardholder Platinum",
            "category": "leather",
            "category_name": "Charm buyumlar",
            "price": 380000,
            "original_price": 520000,
            "cost": 140000,
            "margin_percent": 63.2,
            "stock": 25,
            "sales": 0,
            "rating": 4.8,
            "badge": "TOP",
            "image": "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=700&q=80",
            "description": "RFID himoyalangan titan qisqichli ultra yupqa kassa hamyoni.",
            "status": "active"
        },
        {
            "id": "valmora-silk-scarf-04",
            "title": "Pure Silk Heritage Scarf",
            "category": "accessories",
            "category_name": "Aksessuarlar",
            "price": 540000,
            "original_price": 750000,
            "cost": 210000,
            "margin_percent": 61.1,
            "stock": 11,
            "sales": 0,
            "rating": 4.9,
            "badge": "YANGI",
            "image": "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=700&q=80",
            "description": "100% tabiiy ipak. Valmora geometrik monogrammasi bilan naqshlangan.",
            "status": "active"
        },
        {
            "id": "valmora-sunglasses-05",
            "title": "Titanium Polarized Sunglasses",
            "category": "accessories",
            "category_name": "Aksessuarlar",
            "price": 720000,
            "original_price": 990000,
            "cost": 280000,
            "margin_percent": 61.1,
            "stock": 18,
            "sales": 0,
            "rating": 4.9,
            "badge": "LUXURY",
            "image": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=80",
            "description": "Yengil aerokosmik titan karkas va UV400 qutblangan qoraytirilgan linzalar.",
            "status": "active"
        },
        {
            "id": "valmora-chelsea-boots-06",
            "title": "Handcrafted Chelsea Boots",
            "category": "footwear",
            "category_name": "Poyabzallar",
            "price": 1420000,
            "original_price": 1950000,
            "cost": 650000,
            "margin_percent": 54.2,
            "stock": 7,
            "sales": 0,
            "rating": 5.0,
            "badge": "EKSKLYUZIV",
            "image": "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=700&q=80",
            "description": "Haqiqiy zamsh va qulay charm taglik. O'zgacha qulaylik va mustahkamlik kafolati.",
            "status": "active"
        }
    ]

    for p in initial_products:
        cursor.execute('''
            INSERT INTO products (id, title, category, category_name, price, original_price, cost, margin_percent, stock, sales, rating, badge, image, description, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            p["id"], p["title"], p["category"], p["category_name"], p["price"],
            p["original_price"], p["cost"], p["margin_percent"], p["stock"],
            p["sales"], p["rating"], p["badge"], p["image"], p["description"], p["status"]
        ))

# =============================================================================
# THREADED HTTP REQUEST HANDLER
# =============================================================================
class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class ValmoraHandler(SimpleHTTPRequestHandler):

    def send_json_response(self, data, status_code=200):
        response_bytes = json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(response_bytes)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Server', 'VALMORA')
        self.end_headers()
        self.wfile.write(response_bytes)

    def has_admin_access(self):
        expected = os.environ.get('VALMORA_ADMIN_TOKEN', '')
        authorization = self.headers.get('Authorization', '')
        provided = authorization.removeprefix('Bearer ').strip()
        return bool(expected) and hmac.compare_digest(provided, expected)

    def require_admin_access(self):
        if not os.environ.get('VALMORA_ADMIN_TOKEN'):
            self.send_json_response({
                "success": False,
                "error": "Admin API yopiq. VALMORA_ADMIN_TOKEN muhit o'zgaruvchisini sozlang."
            }, 503)
            return False
        if not self.has_admin_access():
            self.send_json_response({"success": False, "error": "Admin kaliti noto'g'ri yoki kiritilmagan."}, 401)
            return False
        return True

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        protected_paths = {
            '/api/overview',
            '/api/orders',
            '/api/customers',
            '/api/finances',
            '/api/settings'
        }
        if (path in protected_paths or
                (path == '/api/products' and query.get('scope') == ['admin'])):
            if not self.require_admin_access():
                return

        # 1. API Health & Status
        if path == '/api/health' or path == '/api/status':
            try:
                conn = get_db()
                conn.execute('SELECT 1')
                conn.close()
                database_status = 'connected'
            except sqlite3.Error:
                database_status = 'unavailable'
            return self.send_json_response({
                "status": "healthy" if database_status == 'connected' else 'degraded',
                "brand": "VALMORA",
                "system": "VALMORA Commerce API",
                "database": database_status,
                "admin_configured": bool(os.environ.get('VALMORA_ADMIN_TOKEN')),
                "timestamp": datetime.now().isoformat()
            })

        # 2. Executive Dashboard Overview Metrics
        elif path == '/api/overview':
            conn = get_db()
            cursor = conn.cursor()
            
            cursor.execute('SELECT COUNT(*) as cnt FROM products')
            total_products = cursor.fetchone()['cnt']
            
            cursor.execute('SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as total_rev, COALESCE(SUM(net_profit), 0) as total_profit FROM orders')
            order_stats = cursor.fetchone()
            
            cursor.execute('SELECT COUNT(*) as cnt FROM customers')
            total_customers = cursor.fetchone()['cnt']

            cursor.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5')
            recent_orders = [dict(row) for row in cursor.fetchall()]
            for r in recent_orders:
                try:
                    r['items'] = json.loads(r['items_json'])
                except (json.JSONDecodeError, TypeError):
                    r['items'] = []

            conn.close()

            # Dynamic enterprise calculation
            rev = order_stats['total_rev']
            profit = order_stats['total_profit']
            margin = round((profit / rev * 100), 1) if rev > 0 else 0

            return self.send_json_response({
                "success": True,
                "metrics": {
                    "total_revenue": rev,
                    "net_profit": profit,
                    "profit_margin_pct": margin,
                    "total_orders": order_stats['cnt'],
                    "total_products": total_products,
                    "total_customers": total_customers,
                    "average_order_value": round(rev / order_stats['cnt']) if order_stats['cnt'] else 0,
                    "live_visitors": 0
                },
                "recent_orders": recent_orders,
                "timestamp": datetime.now().isoformat()
            })

        # 3. Products List & Filter
        elif path == '/api/products':
            conn = get_db()
            cursor = conn.cursor()
            category = query.get('category', [None])[0]
            search = query.get('search', [None])[0]

            sql = "SELECT * FROM products WHERE status = 'active'"
            params = []

            if category and category != 'all':
                sql += ' AND category = ?'
                params.append(category)

            if search:
                sql += ' AND (title LIKE ? OR description LIKE ?)'
                params.append(f'%{search}%')
                params.append(f'%{search}%')

            sql += ' ORDER BY created_at DESC'
            cursor.execute(sql, params)
            products = [dict(row) for row in cursor.fetchall()]
            conn.close()
            if query.get('scope') != ['admin'] or not self.has_admin_access():
                for product in products:
                    for private_field in ('cost', 'margin_percent', 'supplier', 'created_at'):
                        product.pop(private_field, None)
            for product in products:
                product['categoryName'] = product['category_name']
                product['originalPrice'] = product['original_price']

            return self.send_json_response({
                "success": True,
                "count": len(products),
                "products": products
            })

        # 4. Orders List
        elif path == '/api/orders':
            conn = get_db()
            cursor = conn.cursor()
            status = query.get('status', [None])[0]

            sql = 'SELECT * FROM orders WHERE 1=1'
            params = []
            if status and status != 'all':
                sql += ' AND status = ?'
                params.append(status)

            sql += ' ORDER BY created_at DESC'
            cursor.execute(sql, params)
            orders = [dict(row) for row in cursor.fetchall()]
            for o in orders:
                try:
                    o['items'] = json.loads(o['items_json'])
                except (json.JSONDecodeError, TypeError):
                    o['items'] = []
                o['order_id'] = o['id']
                o['id'] = o['order_no']
                if o['status'] == 'processing':
                    o['status'] = 'shipping'
                o['customer'] = o['customer_name']
                o['city'] = o['shipping_address'].split(',')[0]
                o['product'] = ', '.join(
                    f"{item.get('title', 'Mahsulot')} (x{item.get('qty', 1)})"
                    for item in o['items']
                )
                o['price'] = o['total_amount']
                o['date'] = o['created_at']
            conn.close()

            return self.send_json_response({
                "success": True,
                "count": len(orders),
                "orders": orders
            })

        # 5. Customers List
        elif path == '/api/customers':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM customers ORDER BY total_spent DESC')
            customers = [dict(row) for row in cursor.fetchall()]
            conn.close()

            return self.send_json_response({
                "success": True,
                "count": len(customers),
                "customers": customers
            })

        # 6. Finances & Transactions
        elif path == '/api/finances':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM transactions ORDER BY created_at DESC')
            transactions = [dict(row) for row in cursor.fetchall()]
            cursor.execute("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'completed'")
            total_balance = cursor.fetchone()[0]
            cursor.execute('SELECT COALESCE(SUM(total_amount - net_profit), 0) FROM orders')
            cogs_paid = cursor.fetchone()[0]
            cursor.execute('SELECT COALESCE(SUM(total_amount), 0), COALESCE(SUM(net_profit), 0), COUNT(*) FROM orders')
            totals = cursor.fetchone()
            conn.close()

            return self.send_json_response({
                "success": True,
                "total_balance": total_balance,
                "cogs_paid": cogs_paid,
                "total_revenue": totals[0],
                "net_profit": totals[1],
                "profit_margin_pct": round(totals[1] / totals[0] * 100, 1) if totals[0] else 0,
                "average_order_value": round(totals[0] / totals[2]) if totals[2] else 0,
                "transactions": transactions
            })

        # 7. System Settings
        elif path == '/api/settings':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT key, value FROM settings')
            settings = {row['key']: row['value'] for row in cursor.fetchall()}
            conn.close()
            token_configured = bool(settings.pop('telegram_bot_token', ''))
            settings.pop('license_status', None)
            settings['store_name'] = 'VALMORA'

            return self.send_json_response({
                "success": True,
                "settings": settings,
                "telegram_bot_configured": token_configured
            })

        # 8. Interactive API Documentation / Sandbox
        elif path == '/api/docs':
            docs = {
                "title": "VALMORA REST API",
                "brand": "VALMORA",
                "version": "1.0",
                "endpoints": [
                    {"method": "GET", "url": "/api/health", "desc": "Live system diagnostic & telemetry status"},
                    {"method": "GET", "url": "/api/overview", "desc": "Current order and product totals (admin key required)"},
                    {"method": "GET", "url": "/api/products", "desc": "Full luxury catalog with margins and inventory"},
                    {"method": "POST", "url": "/api/products", "desc": "Create a new luxury dropshipping product in DB"},
                    {"method": "GET", "url": "/api/orders", "desc": "Orders with tracking details (admin key required)"},
                    {"method": "POST", "url": "/api/orders", "desc": "Create an order using server-side prices and inventory"},
                    {"method": "PATCH", "url": "/api/orders/update-status", "desc": "Change order status"},
                    {"method": "GET", "url": "/api/customers", "desc": "Customer records (admin key required)"},
                    {"method": "GET", "url": "/api/finances", "desc": "Recorded transactions (admin key required)"},
                    {"method": "POST", "url": "/api/ai/pricing-optimizer", "desc": "Rule-based price and margin estimate"},
                    {"method": "POST", "url": "/api/sync/supplier", "desc": "Supplier sync placeholder (not connected)"}
                ]
            }
            return self.send_json_response(docs)

        # Admin route alias
        elif path == '/admin':
            self.send_response(302)
            self.send_header('Location', '/admin.html')
            self.end_headers()
            return

        # Fallback to standard static file server
        else:
            return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        protected_paths = {
            '/api/products',
            '/api/orders/update-status',
            '/api/sync/supplier',
            '/api/settings',
            '/api/telegram/test'
        }
        if path in protected_paths and not self.require_admin_access():
            return

        try:
            content_length = int(self.headers.get('Content-Length', 0))
        except ValueError:
            return self.send_json_response({"success": False, "error": "Noto'g'ri Content-Length."}, 400)
        if content_length > 1_048_576:
            return self.send_json_response({"success": False, "error": "So'rov hajmi juda katta."}, 413)

        try:
            body = self.rfile.read(content_length).decode('utf-8') if content_length else '{}'
            payload = json.loads(body)
        except (UnicodeDecodeError, json.JSONDecodeError):
            return self.send_json_response({"success": False, "error": "JSON so'rovi noto'g'ri."}, 400)
        if not isinstance(payload, dict):
            return self.send_json_response({"success": False, "error": "JSON obyekt bo'lishi kerak."}, 400)

        # 1. Create Product
        if path == '/api/products':
            title = str(payload.get('title', '')).strip()
            category = str(payload.get('category', 'accessories')).strip()
            category_name = str(payload.get('categoryName') or payload.get('category_name') or 'Aksessuarlar').strip()
            image = str(payload.get('image', '')).strip()
            description = str(payload.get('description', '')).strip()
            badge = str(payload.get('badge', 'VALMORA')).strip()
            try:
                price = float(payload.get('price', 0))
                cost = float(payload.get('cost', 0))
                stock = int(payload.get('stock', 10))
                original_price = float(payload.get('originalPrice', payload.get('original_price', price * 1.3)))
            except (TypeError, ValueError):
                return self.send_json_response({"success": False, "error": "Narx, tannarx va qoldiq raqam bo'lishi kerak."}, 400)
            if (not title or not category or not math.isfinite(price) or not math.isfinite(cost)
                    or not math.isfinite(original_price) or price <= 0 or cost < 0 or stock < 0):
                return self.send_json_response({"success": False, "error": "Mahsulot ma'lumotlarini tekshiring."}, 400)
            if not image:
                image = 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=700&q=80'
            if not description:
                description = f'{title} — VALMORA tanlovi.'

            margin_percent = round(((price - cost) / price * 100), 1)
            prod_id = f"valmora-prod-{uuid.uuid4().hex[:8]}"

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO products (id, title, category, category_name, price, original_price, cost, margin_percent, stock, badge, image, description, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
            ''', (prod_id, title, category, category_name, price, original_price, cost, margin_percent, stock, badge, image, description))
            cursor.execute('SELECT * FROM products WHERE id = ?', (prod_id,))
            product = dict(cursor.fetchone())
            product['categoryName'] = product['category_name']
            product['originalPrice'] = product['original_price']
            conn.commit()
            conn.close()

            return self.send_json_response({
                "success": True,
                "message": "Mahsulot VALMORA katalogiga saqlandi.",
                "product_id": prod_id,
                "product": product
            }, 201)

        # 2. Create Order
        elif path == '/api/orders':
            customer_name = str(payload.get('customerName', '')).strip()
            customer_phone = str(payload.get('customerPhone', '')).strip()
            customer_email = str(payload.get('customerEmail', '')).strip()
            shipping_address = str(payload.get('shippingAddress', '')).strip()
            requested_items = payload.get('items')
            payment_method = str(payload.get('paymentMethod', 'Eshik oldida (Naqd / Karta)')).strip()
            try:
                discount_percent = float(payload.get('discountPercent', 0))
            except (TypeError, ValueError):
                return self.send_json_response({"success": False, "error": "Chegirma qiymati noto'g'ri."}, 400)
            promo_code = str(payload.get('promoCode', '')).strip().upper()
            if (len(customer_name) < 3 or len(customer_phone) < 9 or
                    len(shipping_address) < 4 or not math.isfinite(discount_percent) or
                    discount_percent not in (0, 10) or
                    (discount_percent == 10 and promo_code not in {'VALMORA', 'VALMORA2026', 'VIP'})):
                return self.send_json_response({"success": False, "error": "Buyurtma ma'lumotlarini tekshiring."}, 400)
            if payment_method != 'Eshik oldida (Naqd / Karta)':
                return self.send_json_response({"success": False, "error": "Hozircha faqat eshik oldida to'lov qabul qilinadi."}, 400)
            if not isinstance(requested_items, list) or not requested_items or len(requested_items) > 50:
                return self.send_json_response({"success": False, "error": "Buyurtma mahsulotlari noto'g'ri."}, 400)

            conn = get_db()
            cursor = conn.cursor()
            conn.execute('BEGIN IMMEDIATE')
            order_items = []
            subtotal = 0
            total_cost = 0
            stock_updates = []
            requested_quantities = {}
            for requested_item in requested_items:
                if not isinstance(requested_item, dict):
                    conn.close()
                    return self.send_json_response({"success": False, "error": "Buyurtma mahsuloti noto'g'ri."}, 400)
                product_id = str(requested_item.get('id', '')).strip()
                try:
                    quantity = int(requested_item.get('qty', 0))
                except (TypeError, ValueError):
                    conn.close()
                    return self.send_json_response({"success": False, "error": "Mahsulot miqdori noto'g'ri."}, 400)
                if not product_id or quantity < 1 or quantity > 50:
                    conn.close()
                    return self.send_json_response({"success": False, "error": "Mahsulot miqdorini tekshiring."}, 400)
                requested_quantities[product_id] = requested_quantities.get(product_id, 0) + quantity
                if requested_quantities[product_id] > 50:
                    conn.close()
                    return self.send_json_response({"success": False, "error": "Bir mahsulotdan ko'pi bilan 50 dona buyurtma qilish mumkin."}, 400)

            for product_id, quantity in requested_quantities.items():
                cursor.execute(
                    "SELECT id, title, price, cost, stock FROM products WHERE id = ? AND status = 'active'",
                    (product_id,)
                )
                product = cursor.fetchone()
                if not product:
                    conn.close()
                    return self.send_json_response({"success": False, "error": "Mahsulot topilmadi yoki sotuvda yo'q."}, 404)
                if product['stock'] < quantity:
                    conn.close()
                    return self.send_json_response({"success": False, "error": "Mahsulot qoldig'i yetarli emas."}, 409)

                item_price = float(product['price'])
                subtotal += item_price * quantity
                total_cost += float(product['cost']) * quantity
                stock_updates.append((quantity, product_id))
                order_items.append({
                    "id": product_id,
                    "title": product['title'],
                    "qty": quantity,
                    "price": item_price
                })

            total_amount = round(subtotal * (1 - discount_percent / 100), 2)
            net_profit = round(total_amount - total_cost, 2)
            order_id = f"ord-{uuid.uuid4().hex[:8]}"
            order_no = f"VAL-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
            tracking_code = f"VAL-EXP-{uuid.uuid4().hex[:6].upper()}"

            for quantity, product_id in stock_updates:
                cursor.execute('UPDATE products SET stock = stock - ? WHERE id = ?', (quantity, product_id))
                cursor.execute('UPDATE products SET sales = sales + ? WHERE id = ?', (quantity, product_id))
            cursor.execute('''
                INSERT INTO orders (id, order_no, customer_name, customer_phone, customer_email, shipping_address, total_amount, net_profit, status, items_json, payment_method, tracking_code)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
            ''', (order_id, order_no, customer_name, customer_phone, customer_email, shipping_address, total_amount, net_profit, json.dumps(order_items, ensure_ascii=False), payment_method, tracking_code))
            
            # Record financial transaction
            trx_id = f"trx-{uuid.uuid4().hex[:6]}"
            trx_code = f"#TRX-{uuid.uuid4().hex[:5].upper()}"
            cursor.execute('''
                INSERT INTO transactions (id, trx_code, type, amount, description, status)
                VALUES (?, ?, 'Tushum', ?, ?, 'Kutilmoqda')
            ''', (trx_id, trx_code, total_amount, f"Yangi buyurtma tushumi ({order_no})"))

            # Update / Insert Customer
            cursor.execute('SELECT id, orders_count, total_spent FROM customers WHERE phone = ?', (customer_phone,))
            existing_cust = cursor.fetchone()
            if existing_cust:
                new_count = existing_cust['orders_count'] + 1
                new_spent = existing_cust['total_spent'] + total_amount
                tier = 'Valmora VIP' if new_spent > 3000000 else 'Doimiy'
                cursor.execute('UPDATE customers SET orders_count = ?, total_spent = ?, tier = ? WHERE id = ?', (new_count, new_spent, tier, existing_cust['id']))
            else:
                cust_id = f"cust-{uuid.uuid4().hex[:6]}"
                cursor.execute('''
                    INSERT INTO customers (id, name, phone, city, email, tier, orders_count, total_spent)
                    VALUES (?, ?, ?, ?, ?, 'Yangi', 1, ?)
                ''', (cust_id, customer_name, customer_phone, shipping_address.split(',')[0], customer_email, total_amount))

            conn.commit()
            conn.close()

            # Attempt Telegram Bot notification if configured
            threading.Thread(target=send_telegram_notification, args=(order_no, customer_name, customer_phone, shipping_address, payment_method, total_amount, order_items), daemon=True).start()

            return self.send_json_response({
                "success": True,
                "message": "Buyurtma qabul qilindi va tizimga kiritildi",
                "order_no": order_no,
                "tracking_code": tracking_code,
                "order_id": order_id,
                "total_amount": total_amount
            }, 201)

        # 3. Update Order Status
        elif path == '/api/orders/update-status':
            order_id = payload.get('order_id')
            new_status = payload.get('status')
            if not order_id or new_status not in {'pending', 'processing', 'shipping', 'completed', 'cancelled'}:
                return self.send_json_response({"success": False, "error": "Buyurtma yoki holat noto'g'ri."}, 400)

            conn = get_db()
            cursor = conn.cursor()
            conn.execute('BEGIN IMMEDIATE')
            cursor.execute('SELECT id, status, items_json FROM orders WHERE id = ? OR order_no = ?', (order_id, order_id))
            order = cursor.fetchone()
            if not order:
                conn.close()
                return self.send_json_response({"success": False, "error": "Buyurtma topilmadi."}, 404)
            try:
                order_items = json.loads(order['items_json'])
            except json.JSONDecodeError:
                order_items = []
            if order['status'] != 'cancelled' and new_status == 'cancelled':
                for item in order_items:
                    cursor.execute(
                        'UPDATE products SET stock = stock + ?, sales = MAX(0, sales - ?) WHERE id = ?',
                        (item.get('qty', 0), item.get('qty', 0), item.get('id'))
                    )
            elif order['status'] == 'cancelled' and new_status != 'cancelled':
                for item in order_items:
                    cursor.execute('SELECT stock FROM products WHERE id = ?', (item.get('id'),))
                    product = cursor.fetchone()
                    quantity = int(item.get('qty', 0))
                    if not product or product['stock'] < quantity:
                        conn.close()
                        return self.send_json_response({"success": False, "error": "Qayta faollashtirish uchun omborda qoldiq yetarli emas."}, 409)
                    cursor.execute(
                        'UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ?',
                        (quantity, quantity, item.get('id'))
                    )
            cursor.execute('UPDATE orders SET status = ? WHERE id = ?', (new_status, order['id']))
            conn.commit()
            conn.close()

            return self.send_json_response({
                "success": True,
                "message": f"Buyurtma holati '{new_status}' ga muvaffaqiyatli yangilandi"
            })

        # 4. AI Pricing Optimizer Engine
        elif path == '/api/ai/pricing-optimizer':
            cost = float(payload.get('cost', 0))
            category = payload.get('category', 'accessories')
            luxury_multiplier = float(payload.get('luxury_factor', 2.1))

            # Valmora Quantum Formula
            recommended_price = round((cost * luxury_multiplier) / 10000) * 10000
            estimated_ad_cost = round(cost * 0.22)
            estimated_shipping = 35000
            net_profit = recommended_price - cost - estimated_ad_cost - estimated_shipping
            margin_pct = round((net_profit / recommended_price * 100), 1) if recommended_price > 0 else 0

            return self.send_json_response({
                "success": True,
                "analysis": {
                    "base_cost": cost,
                    "recommended_price": recommended_price,
                    "estimated_net_profit": net_profit,
                    "projected_margin": f"{margin_pct}%",
                    "break_even_roas": "1.85x",
                    "luxury_tier_classification": "Quiet Luxury High-Margin",
                    "ai_verdict": f"Ushbu tovar {margin_pct}% sof foyda bilan Valmora brendi ostida sotishga yuqori darajada tavsiya etiladi."
                }
            })

        # 5. Dropship Supplier Auto-Sync Simulation
        elif path == '/api/sync/supplier':
            return self.send_json_response({
                "success": False,
                "error": "Ta'minotchi integratsiyasi ulanmagan."
            }, 501)

        # 6. Save Settings
        elif path == '/api/settings':
            conn = get_db()
            cursor = conn.cursor()
            allowed_settings = {
                'currency_symbol',
                'support_phone',
                'telegram_bot_token',
                'telegram_chat_id'
            }
            for key, value in payload.items():
                if key in allowed_settings and (key not in {'telegram_bot_token', 'telegram_chat_id'} or value):
                    cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', (key, str(value)))
            cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('store_name', 'VALMORA')")
            conn.commit()
            conn.close()

            return self.send_json_response({
                "success": True,
                "message": "Valmora tizim sozlamalari yangilandi"
            })

        # 7. Test Telegram Bot Connection
        elif path == '/api/telegram/test':
            token = payload.get('token', '').strip()
            chat_id = payload.get('chat_id', '').strip()
            if not token or not chat_id:
                return self.send_json_response({"success": False, "error": "Token va Chat ID talab etiladi"}, 400)

            test_msg = (
                f"🔔 <b>VALMORA — TELEGRAM INTEGRATSIYASI FAOL!</b>\n\n"
                f"✅ Valmora do'koningiz ushbu chatga muvaffaqiyatli ulandi.\n"
                f"🛍 Yangi buyurtmalar tushishi bilan barcha mijoz ma'lumotlari shu yerga yuboriladi.\n"
                f"⏰ Vaqt: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}"
            )
            url = f"https://api.telegram.org/bot{token}/sendMessage"
            data = json.dumps({
                "chat_id": chat_id,
                "text": test_msg,
                "parse_mode": "HTML"
            }).encode('utf-8')

            try:
                req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
                with urllib.request.urlopen(req, timeout=7) as response:
                    response.read()
                return self.send_json_response({"success": True, "message": "Test xabar muvaffaqiyatli yuborildi"})
            except (urllib.error.URLError, TimeoutError, OSError):
                return self.send_json_response({"success": False, "error": "Telegram bilan aloqa o'rnatilmadi. Token va Chat ID ni tekshiring."}, 502)

        else:
            return self.send_json_response({"error": "Endpoint not found"}, 404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        
        if path.startswith('/api/products/'):
            if not self.require_admin_access():
                return
            prod_id = path.replace('/api/products/', '')
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('DELETE FROM products WHERE id = ?', (prod_id,))
            deleted = cursor.rowcount
            conn.commit()
            conn.close()
            if not deleted:
                return self.send_json_response({"success": False, "error": "Mahsulot topilmadi."}, 404)
            return self.send_json_response({"success": True, "message": "Mahsulot o'chirildi"})
        
        return self.send_json_response({"error": "Endpoint not found"}, 404)

    def do_PATCH(self):
        self.do_POST()

# =============================================================================
# TELEGRAM BOT NOTIFICATION BRIDGE
# =============================================================================
def send_telegram_notification(order_no, customer_name, phone, shipping_address, payment_method, total_amount, items):
    """Sends immediate luxury telegram notification when an order is created"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = 'telegram_bot_token'")
        token_row = cursor.fetchone()
        cursor.execute("SELECT value FROM settings WHERE key = 'telegram_chat_id'")
        chat_row = cursor.fetchone()
        conn.close()

        bot_token = token_row['value'] if token_row else None
        chat_id = chat_row['value'] if chat_row else None

        if not bot_token or not chat_id:
            print(f"[VALMORA] Telegram sozlanmagan; buyurtma {order_no} bazaga saqlandi.")
            return

        items_text = ""
        for idx, itm in enumerate(items, 1):
            title = itm.get('title', 'Mahsulot')
            qty = itm.get('qty', 1)
            price = float(itm.get('price', 0))
            items_text += f"\n  {idx}. <b>{title}</b> — {qty} dona ({int(price * qty):,} so'm)"

        message_text = (
            f"💎 <b>YANGI VALMORA BUYURTMA</b> 💎\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📦 <b>Buyurtma ID:</b> #{order_no}\n"
            f"👤 <b>Mijoz:</b> {customer_name}\n"
            f"📞 <b>Telefon:</b> <code>{phone}</code>\n"
            f"📍 <b>Yetkazish manzili:</b> {shipping_address}\n"
            f"💳 <b>To'lov usuli:</b> {payment_method}\n"
            f"🚚 <b>Dastavka:</b> VIP Tezkor Yetkazib Berish\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🛍 <b>Mahsulotlar:</b>{items_text}\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"💰 <b>JAMI SUMMA:</b> <b>{int(total_amount):,} so'm</b>\n"
            f"⏰ <b>Sana va vaqt:</b> {datetime.now().strftime('%d.%m.%Y %H:%M')}\n\n"
            f"👑 <i>Valmora Autonomous Commerce Engine</i>"
        )

        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        data = json.dumps({
            "chat_id": chat_id,
            "text": message_text,
            "parse_mode": "HTML"
        }).encode('utf-8')

        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(req, timeout=7)
        print(f"[VALMORA] Buyurtma {order_no} Telegramga yuborildi.")
    except (urllib.error.URLError, TimeoutError, OSError, sqlite3.Error, TypeError, ValueError):
        print(f"[VALMORA] Buyurtma {order_no} saqlandi, Telegram xabarnomasi yuborilmadi.")

# =============================================================================
# SERVER STARTUP
# =============================================================================
def run_server():
    init_db()
    os.chdir(BASE_DIR)
    server_address = (HOST, PORT)
    httpd = ThreadedHTTPServer(server_address, ValmoraHandler)
    
    banner = f"""
    =======================================================================
       VALMORA COMMERCE API
    =======================================================================
       Status: RUNNING
       Engine: Non-Blocking Python 3.11 Multi-Threaded REST API
       Database: SQLite3 (valmora.db)
       Live Address: http://localhost:{PORT}
       API Docs: http://localhost:{PORT}/api/docs
       Branding: VALMORA
    =======================================================================
    """
    print(banner)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[VALMORA] Server stopped gracefully.")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
