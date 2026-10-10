from __future__ import annotations

import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, redirect, render_template, request, session, url_for

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "store.db"

PRODUCTS = [
    {
        "id": 1,
        "slug": "mcdowells-no1-whisky-90ml",
        "name": "McDowell's No.1 Whisky",
        "category": "Whisky",
        "origin": "Bangalore staple",
        "style": "Blended Whisky",
        "size": "90 ml",
        "price": 110.0,
        "old_price": 125.0,
        "badge": "Fast Moving",
        "image": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=1200&q=80",
        "description": "One of the most common quick-pick whiskies in Bangalore, especially for budget mini bottle purchases.",
        "tasting_notes": ["Grain sweetness", "Mild spice", "Quick sip"],
        "pairing": "Budget pickup, small serves, casual evenings",
    },
    {
        "id": 2,
        "slug": "royal-stag-whisky-180ml",
        "name": "Royal Stag Whisky",
        "category": "Whisky",
        "origin": "Popular across Bangalore",
        "style": "Blended Whisky",
        "size": "180 ml",
        "price": 260.0,
        "old_price": 295.0,
        "badge": "Quarter Favorite",
        "image": "https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=1200&q=80",
        "description": "A very common quarter-bottle choice in Bangalore retail with dependable mainstream demand.",
        "tasting_notes": ["Soft grain", "Oak touch", "Smooth finish"],
        "pairing": "House parties, soda mixes, quick reorders",
    },
    {
        "id": 3,
        "slug": "imperial-blue-whisky-375ml",
        "name": "Imperial Blue Superior Grain Whisky",
        "category": "Whisky",
        "origin": "Popular mass-market label",
        "style": "Grain Whisky",
        "size": "375 ml",
        "price": 430.0,
        "old_price": 480.0,
        "badge": "Half Bottle",
        "image": "https://images.unsplash.com/photo-1547595628-c61a29f496f0?auto=format&fit=crop&w=1200&q=80",
        "description": "A top-selling mainstream whisky that moves quickly in neighborhood stores and value-led purchases.",
        "tasting_notes": ["Light malt", "Caramel", "Warm finish"],
        "pairing": "Weekend stock-up, mixer drinks, group sessions",
    },
    {
        "id": 4,
        "slug": "signature-whisky-750ml",
        "name": "Signature Premier Grain Whisky",
        "category": "Whisky",
        "origin": "Strong Bangalore presence",
        "style": "Premium Blend",
        "size": "750 ml",
        "price": 1250.0,
        "old_price": 1390.0,
        "badge": "Full Bottle",
        "image": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80",
        "description": "A reliable step-up whisky widely stocked across Bangalore for dinners, parties, and gifting.",
        "tasting_notes": ["Vanilla", "Toast", "Smooth grain"],
        "pairing": "House parties, gifting, easy pours",
    },
    {
        "id": 5,
        "slug": "blenders-pride-whisky-1ltr",
        "name": "Blenders Pride Rare Premium Whisky",
        "category": "Whisky",
        "origin": "Urban Bangalore favorite",
        "style": "Premium Blend",
        "size": "1 L",
        "price": 2250.0,
        "old_price": 2450.0,
        "badge": "Party Bottle",
        "image": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=1200&q=80",
        "description": "A very common party and gifting bottle in Bangalore with strong full-size volume movement.",
        "tasting_notes": ["Honey", "Oak", "Round finish"],
        "pairing": "Big gatherings, premium house parties, gifting",
    },
    {
        "id": 6,
        "slug": "old-monk-xxx-rum-180ml",
        "name": "Old Monk XXX Rum",
        "category": "Rum",
        "origin": "Classic across Bangalore",
        "style": "Dark Rum",
        "size": "180 ml",
        "price": 200.0,
        "old_price": 225.0,
        "badge": "Iconic Quarter",
        "image": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80",
        "description": "An iconic dark rum that remains one of Bangalore's most familiar and frequently stocked small-format picks.",
        "tasting_notes": ["Caramel", "Vanilla", "Spice"],
        "pairing": "Cola mixes, winter nights, nostalgic favorites",
    },
    {
        "id": 7,
        "slug": "mcdowells-celebration-rum-750ml",
        "name": "McDowell's Celebration Rum",
        "category": "Rum",
        "origin": "High-volume Karnataka label",
        "style": "Dark Rum",
        "size": "750 ml",
        "price": 920.0,
        "old_price": 1025.0,
        "badge": "Top Seller",
        "image": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80",
        "description": "A fast-moving rum in Karnataka retail with strong value appeal for regular buyers and party orders.",
        "tasting_notes": ["Molasses", "Spice", "Warm sweetness"],
        "pairing": "Rum cola, group orders, easy party serve",
    },
    {
        "id": 8,
        "slug": "kingfisher-premium-lager-650ml",
        "name": "Kingfisher Premium Lager",
        "category": "Beer",
        "origin": "Bangalore-born favorite",
        "style": "Lager",
        "size": "650 ml",
        "price": 180.0,
        "old_price": 205.0,
        "badge": "Most Ordered",
        "image": "https://images.unsplash.com/photo-1516458464372-ee7eae24b460?auto=format&fit=crop&w=1200&q=80",
        "description": "One of the most visible and consistently ordered beer labels in Bangalore for casual get-togethers.",
        "tasting_notes": ["Clean malt", "Light bitterness", "Crisp finish"],
        "pairing": "Match nights, snacks, casual parties",
    },
    {
        "id": 9,
        "slug": "budweiser-premium-lager-500ml",
        "name": "Budweiser Premium Lager",
        "category": "Beer",
        "origin": "Urban retail favorite",
        "style": "Premium Lager",
        "size": "500 ml",
        "price": 170.0,
        "old_price": 195.0,
        "badge": "City Favorite",
        "image": "https://images.unsplash.com/photo-1516458464372-ee7eae24b460?auto=format&fit=crop&w=1200&q=80",
        "description": "A popular premium lager choice in Bangalore among urban buyers looking for an easy, recognizable beer.",
        "tasting_notes": ["Grain", "Light hops", "Refreshing finish"],
        "pairing": "Weekend chill, burgers, game nights",
    },
    {
        "id": 10,
        "slug": "smirnoff-red-vodka-750ml",
        "name": "Smirnoff Red Vodka",
        "category": "Vodka",
        "origin": "Common party shelf brand",
        "style": "Classic Vodka",
        "size": "750 ml",
        "price": 1450.0,
        "old_price": 1590.0,
        "badge": "Cocktail Basic",
        "image": "https://images.unsplash.com/photo-1563223771-375783ee91ad?auto=format&fit=crop&w=1200&q=80",
        "description": "A highly familiar vodka in Bangalore stores and house-party carts thanks to broad recognition and easy mixing.",
        "tasting_notes": ["Neutral spirit", "Soft bite", "Clean finish"],
        "pairing": "Cocktails, mixers, large social gatherings",
    },
    {
        "id": 11,
        "slug": "magic-moments-vodka-375ml",
        "name": "Magic Moments Vodka",
        "category": "Vodka",
        "origin": "Mass-market bestseller",
        "style": "Plain Vodka",
        "size": "375 ml",
        "price": 520.0,
        "old_price": 580.0,
        "badge": "Budget Vodka",
        "image": "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=80",
        "description": "A fast-moving value vodka often picked for mixed drinks, pre-party stock-ups, and budget-conscious orders.",
        "tasting_notes": ["Clean spirit", "Mild grain", "Simple finish"],
        "pairing": "Juice mixers, house parties, casual drinking",
    },
    {
        "id": 12,
        "slug": "greater-than-gin-750ml",
        "name": "Greater Than London Dry Gin",
        "category": "Gin",
        "origin": "Popular in urban Bangalore",
        "style": "London Dry Gin",
        "size": "750 ml",
        "price": 1850.0,
        "old_price": 2050.0,
        "badge": "Gin Pick",
        "image": "https://images.unsplash.com/photo-1587223962930-cb7f31384c19?auto=format&fit=crop&w=1200&q=80",
        "description": "A visible and frequently recommended gin in Bangalore for buyers looking for a modern, easy cocktail base.",
        "tasting_notes": ["Juniper", "Citrus peel", "Botanical finish"],
        "pairing": "Gin & tonic, light starters, cocktail nights",
    },
    {
        "id": 13,
        "slug": "mansion-house-brandy-750ml",
        "name": "Mansion House Brandy",
        "category": "Brandy",
        "origin": "South India favorite",
        "style": "French Style Brandy",
        "size": "750 ml",
        "price": 980.0,
        "old_price": 1090.0,
        "badge": "South Favorite",
        "image": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=1200&q=80",
        "description": "A very common brandy choice in southern markets and a familiar full-bottle pick in Bangalore retail shops.",
        "tasting_notes": ["Fruit warmth", "Sweet oak", "Soft spice"],
        "pairing": "Evening pours, traditional preferences, small celebrations",
    },
    {
        "id": 14,
        "slug": "sula-satori-merlot-750ml",
        "name": "Sula Satori Merlot",
        "category": "Wine",
        "origin": "Nashik, Maharashtra",
        "style": "Merlot",
        "size": "750 ml",
        "price": 995.0,
        "old_price": 1125.0,
        "badge": "Wine Bestseller",
        "image": "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fit=crop&w=1200&q=80",
        "description": "One of the most recognizable easy-drinking wine labels commonly stocked in Bangalore retail and modern party baskets.",
        "tasting_notes": ["Berry fruit", "Soft tannins", "Smooth finish"],
        "pairing": "Dinner parties, cheese boards, easy gifting",
    },
]

PRODUCTS_BY_ID = {product["id"]: product for product in PRODUCTS}
PRODUCTS_BY_SLUG = {product["slug"]: product for product in PRODUCTS}

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY", "dev-secret-key")


def format_money(value: float) -> str:
    return f"₹{value:,.0f}"


app.jinja_env.filters["money"] = format_money


@app.context_processor
def inject_globals() -> dict[str, Any]:
    return {
        "cart_count": sum(session.get("cart", {}).values()),
        "current_year": datetime.now().year,
    }


def get_db_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    connection = get_db_connection()
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            zip_code TEXT NOT NULL,
            delivery_notes TEXT,
            total REAL NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            line_total REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id)
        );

        CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """
    )
    connection.commit()
    connection.close()


def get_cart() -> dict[str, int]:
    cart = session.setdefault("cart", {})
    session.modified = True
    return cart


def build_cart_summary() -> dict[str, Any]:
    items = []
    subtotal = 0.0

    for product_id, quantity in get_cart().items():
        product = PRODUCTS_BY_ID.get(int(product_id))
        if not product:
            continue
        line_total = product["price"] * quantity
        subtotal += line_total
        items.append(
            {
                "id": product["id"],
                "slug": product["slug"],
                "name": product["name"],
                "image": product["image"],
                "price": product["price"],
                "quantity": quantity,
                "line_total": line_total,
                "category": product["category"],
            }
        )

    shipping = 0.0 if subtotal >= 7000 or subtotal == 0 else 299.0
    tax = round(subtotal * 0.18, 2)
    total = round(subtotal + shipping + tax, 2)

    return {
        "items": items,
        "subtotal": round(subtotal, 2),
        "shipping": shipping,
        "tax": tax,
        "total": total,
        "count": sum(item["quantity"] for item in items),
    }


def get_similar_products(category: str, current_id: int) -> list[dict[str, Any]]:
    return [
        product
        for product in PRODUCTS
        if product["category"] == category and product["id"] != current_id
    ][:3]


@app.route("/")
def home() -> str:
    featured_products = [PRODUCTS[4], PRODUCTS[7], PRODUCTS[9], PRODUCTS[13]]
    collections = ["Whisky", "Beer", "Rum", "Vodka"]
    return render_template("home.html", featured_products=featured_products, collections=collections)


@app.route("/shop")
def shop() -> str:
    category = request.args.get("category", "All")
    search = request.args.get("search", "").strip().lower()
    filtered_products = PRODUCTS

    if category != "All":
        filtered_products = [product for product in filtered_products if product["category"] == category]

    if search:
        filtered_products = [
            product
            for product in filtered_products
            if search in product["name"].lower()
            or search in product["origin"].lower()
            or search in product["style"].lower()
            or search in product["category"].lower()
            or search in product["size"].lower()
        ]

    return render_template(
        "shop.html",
        products=filtered_products,
        selected_category=category,
        search=search,
        categories=["All", "Whisky", "Rum", "Beer", "Vodka", "Gin", "Brandy", "Wine"],
    )


@app.route("/product/<slug>")
def product_detail(slug: str) -> str:
    product = PRODUCTS_BY_SLUG.get(slug)
    if not product:
        return redirect(url_for("shop"))
    similar_products = get_similar_products(product["category"], product["id"])
    return render_template("product.html", product=product, similar_products=similar_products)


@app.route("/cart")
def cart() -> str:
    return render_template("cart.html", cart=build_cart_summary())


@app.route("/checkout")
def checkout() -> str:
    cart_summary = build_cart_summary()
    if not cart_summary["items"]:
        return redirect(url_for("shop"))
    return render_template("checkout.html", cart=cart_summary)


@app.route("/contact")
def contact() -> str:
    return render_template("contact.html")


@app.route("/order-success/<int:order_id>")
def order_success(order_id: int) -> str:
    connection = get_db_connection()
    order = connection.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    items = connection.execute(
        "SELECT product_name, quantity, unit_price, line_total FROM order_items WHERE order_id = ?",
        (order_id,),
    ).fetchall()
    connection.close()

    if not order:
        return redirect(url_for("home"))

    return render_template("order_success.html", order=order, items=items)


@app.get("/api/products")
def api_products() -> Any:
    return jsonify(PRODUCTS)


@app.get("/api/products/<slug>")
def api_product_detail(slug: str) -> Any:
    product = PRODUCTS_BY_SLUG.get(slug)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(product)


@app.get("/api/cart")
def api_cart() -> Any:
    return jsonify(build_cart_summary())


@app.post("/api/cart/add")
def api_cart_add() -> Any:
    payload = request.get_json(silent=True) or {}
    product_id = int(payload.get("product_id", 0))
    quantity = max(1, int(payload.get("quantity", 1)))

    if product_id not in PRODUCTS_BY_ID:
        return jsonify({"error": "Invalid product"}), 400

    cart = get_cart()
    key = str(product_id)
    cart[key] = cart.get(key, 0) + quantity
    session["cart"] = cart
    return jsonify({"message": "Added to cart", "cart": build_cart_summary()})


@app.post("/api/cart/update")
def api_cart_update() -> Any:
    payload = request.get_json(silent=True) or {}
    product_id = int(payload.get("product_id", 0))
    quantity = int(payload.get("quantity", 1))
    key = str(product_id)

    if key not in get_cart():
        return jsonify({"error": "Item not found in cart"}), 404

    cart = get_cart()
    if quantity <= 0:
        cart.pop(key, None)
    else:
        cart[key] = quantity
    session["cart"] = cart
    return jsonify({"message": "Cart updated", "cart": build_cart_summary()})


@app.post("/api/cart/remove")
def api_cart_remove() -> Any:
    payload = request.get_json(silent=True) or {}
    product_id = int(payload.get("product_id", 0))
    cart = get_cart()
    cart.pop(str(product_id), None)
    session["cart"] = cart
    return jsonify({"message": "Item removed", "cart": build_cart_summary()})


@app.post("/api/contact")
def api_contact() -> Any:
    payload = request.get_json(silent=True) or {}
    name = payload.get("name", "").strip()
    email = payload.get("email", "").strip()
    subject = payload.get("subject", "").strip()
    message = payload.get("message", "").strip()

    if not all([name, email, subject, message]):
        return jsonify({"error": "Please complete all contact fields."}), 400

    connection = get_db_connection()
    connection.execute(
        "INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?)",
        (name, email, subject, message, datetime.now().isoformat()),
    )
    connection.commit()
    connection.close()

    return jsonify({"message": "Thanks for reaching out. Our Bangalore bottle concierge will contact you shortly."})


@app.post("/api/checkout")
def api_checkout() -> Any:
    payload = request.get_json(silent=True) or {}
    required_fields = ["name", "email", "phone", "address", "city", "state", "zip_code"]
    missing_fields = [field for field in required_fields if not str(payload.get(field, "")).strip()]

    if missing_fields:
        return jsonify({"error": "Please complete all required checkout fields."}), 400

    if not payload.get("age_confirmed"):
        return jsonify({"error": "You must confirm legal drinking age in your state before placing an order."}), 400

    cart_summary = build_cart_summary()
    if not cart_summary["items"]:
        return jsonify({"error": "Your cart is empty."}), 400

    connection = get_db_connection()
    cursor = connection.execute(
        """
        INSERT INTO orders (customer_name, email, phone, address, city, state, zip_code, delivery_notes, total, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload["name"].strip(),
            payload["email"].strip(),
            payload["phone"].strip(),
            payload["address"].strip(),
            payload["city"].strip(),
            payload["state"].strip(),
            payload["zip_code"].strip(),
            payload.get("delivery_notes", "").strip(),
            cart_summary["total"],
            datetime.now().isoformat(),
        ),
    )
    order_id = cursor.lastrowid

    for item in cart_summary["items"]:
        connection.execute(
            """
            INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (order_id, item["id"], item["name"], item["quantity"], item["price"], item["line_total"]),
        )

    connection.commit()
    connection.close()
    session["cart"] = {}

    return jsonify(
        {
            "message": "Order placed successfully.",
            "order_id": order_id,
            "redirect_url": url_for("order_success", order_id=order_id),
        }
    )


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
else:
    init_db()
