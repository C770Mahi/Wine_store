const toast = document.querySelector('[data-toast]');
const cartCountNodes = document.querySelectorAll('[data-cart-count]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const siteNav = document.querySelector('[data-site-nav]');

const inrFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const formatMoney = (value) => inrFormatter.format(Number(value));

const showToast = (message, isError = false) => {
    if (!toast) return;
    toast.textContent = message;
    toast.style.background = isError ? '#c23b3b' : '#18212f';
    toast.classList.add('visible');
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => toast.classList.remove('visible'), 2600);
};

const updateCartCount = (count) => {
    cartCountNodes.forEach((node) => {
        node.textContent = count;
    });
};

const requestJson = async (url, payload = null) => {
    const response = await fetch(url, {
        method: payload ? 'POST' : 'GET',
        headers: payload ? { 'Content-Type': 'application/json' } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
};

if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
        siteNav.classList.toggle('open');
    });
}

document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
    button.addEventListener('click', async () => {
        const productId = Number(button.dataset.productId);
        const quantityInput = button.closest('.purchase-row')?.querySelector('[data-product-quantity]');
        const quantity = quantityInput ? Math.max(1, Number(quantityInput.value || 1)) : 1;
        const originalText = button.textContent;

        try {
            button.disabled = true;
            button.textContent = 'ADDING';
            const data = await requestJson('/api/cart/add', { product_id: productId, quantity });
            updateCartCount(data.cart.count);
            showToast('Added to cart.');
        } catch (error) {
            showToast(error.message, true);
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    });
});

const cartPage = document.querySelector('[data-cart-page]');
if (cartPage) {
    const setSummaryValues = (cart) => {
        const subtotal = document.querySelector('[data-summary-subtotal]');
        const shipping = document.querySelector('[data-summary-shipping]');
        const tax = document.querySelector('[data-summary-tax]');
        const total = document.querySelector('[data-summary-total]');
        if (subtotal) subtotal.textContent = formatMoney(cart.subtotal);
        if (shipping) shipping.textContent = formatMoney(cart.shipping);
        if (tax) tax.textContent = formatMoney(cart.tax);
        if (total) total.textContent = formatMoney(cart.total);
    };

    cartPage.querySelectorAll('[data-cart-item]').forEach((item) => {
        const productId = Number(item.dataset.productId);
        const quantityInput = item.querySelector('[data-cart-quantity]');
        const removeButton = item.querySelector('[data-remove-item]');
        const lineTotal = item.querySelector('[data-cart-line-total]');

        quantityInput?.addEventListener('change', async () => {
            const quantity = Math.max(1, Number(quantityInput.value || 1));
            try {
                const data = await requestJson('/api/cart/update', { product_id: productId, quantity });
                updateCartCount(data.cart.count);
                setSummaryValues(data.cart);
                const updatedItem = data.cart.items.find((entry) => entry.id === productId);
                if (updatedItem && lineTotal) {
                    lineTotal.textContent = formatMoney(updatedItem.line_total);
                    quantityInput.value = updatedItem.quantity;
                }
                showToast('Cart updated.');
            } catch (error) {
                showToast(error.message, true);
            }
        });

        removeButton?.addEventListener('click', async () => {
            try {
                const data = await requestJson('/api/cart/remove', { product_id: productId });
                updateCartCount(data.cart.count);
                item.remove();
                setSummaryValues(data.cart);
                showToast('Item removed.');
                if (!data.cart.count) window.location.reload();
            } catch (error) {
                showToast(error.message, true);
            }
        });
    });
}

const contactForm = document.querySelector('[data-contact-form]');
if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(contactForm);
        const payload = Object.fromEntries(formData.entries());

        try {
            const data = await requestJson('/api/contact', payload);
            contactForm.reset();
            showToast(data.message);
        } catch (error) {
            showToast(error.message, true);
        }
    });
}

const checkoutForm = document.querySelector('[data-checkout-form]');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(checkoutForm);
        const payload = Object.fromEntries(formData.entries());
        payload.age_confirmed = formData.get('age_confirmed') === 'true';

        const submitButton = checkoutForm.querySelector('button[type="submit"]');

        try {
            if (submitButton) submitButton.disabled = true;
            const data = await requestJson('/api/checkout', payload);
            showToast(data.message);
            window.location.href = data.redirect_url;
        } catch (error) {
            showToast(error.message, true);
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}
