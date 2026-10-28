let products = [];
let userData = {};
let cart = JSON.parse(localStorage.getItem('cart_ps')) || [];
let currentCategory = 'Todo';

const productGrid = document.getElementById('product-grid');
const categoryButtons = document.getElementById('category-buttons');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const cartBtn = document.getElementById('btn-cart');
const cartCounter = document.getElementById('cart-counter');
const cartModal = document.getElementById('cart-modal');
const closeModal = document.getElementById('close-modal');
const userInfo = document.getElementById('user-info');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const toastContainer = document.getElementById('toast-container');

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
});

async function loadData() {
  try {
    const [productsRes, userRes] = await Promise.all([
      fetch('productos.json'),
      fetch('userData.json')
    ]);

    products = await productsRes.json();
    userData = await userRes.json();

    renderCategoryButtons();
    renderProducts();
    updateCartCounter();
  } catch (error) {
    console.error('Error al cargar los archivos JSON:', error);
  }
}

function setupEventListeners() {
  searchInput.addEventListener('input', renderProducts);
  sortSelect.addEventListener('change', renderProducts);

  cartBtn.addEventListener('click', openCartModal);
  closeModal.addEventListener('click', () => cartModal.style.display = 'none');

  window.addEventListener('click', (e) => {
    if (e.target === cartModal) cartModal.style.display = 'none';
  });

  checkoutBtn.addEventListener('click', handleCheckout);
}

function renderCategoryButtons() {
  const categories = ['Todo', ...new Set(products.map(p => p.category))];
  categoryButtons.innerHTML = '';

  categories.forEach(category => {
    const btn = document.createElement('button');
    btn.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    if (category === currentCategory) btn.classList.add('active');

    btn.addEventListener('click', () => {
      currentCategory = category;
      document.querySelectorAll('#category-buttons button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts();
    });

    categoryButtons.appendChild(btn);
  });
}

function renderProducts() {
  productGrid.innerHTML = '';

  let filtered = products.filter(p => p.stock > 0);

  if (currentCategory !== 'Todo') {
    filtered = filtered.filter(p => p.category === currentCategory);
  }

  const searchText = searchInput.value.toLowerCase().trim();
  if (searchText) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchText) ||
      p.description.toLowerCase().includes(searchText)
    );
  }

  const sortValue = sortSelect.value;
  if (sortValue === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  if (sortValue === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  if (sortValue === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sortValue === 'stock-desc') filtered.sort((a, b) => b.stock - a.stock);

  filtered.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
      </div>
      <div>
        <div class="price">${product.price.toFixed(2)}€</div>
        <button onclick="addToCart(${product.id})">Añadir a la cesta</button>
      </div>
    `;
    productGrid.appendChild(card);
  });
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);

  cart.push(productId);
  saveCart();
  updateCartCounter();
  showToast(`Juego "${product.name}" añadido a la cesta`);
}

function saveCart() {
  localStorage.setItem('cart_ps', JSON.stringify(cart));
}

function updateCartCounter() {
  cartCounter.textContent = cart.length;
}

function openCartModal() {
  userInfo.innerHTML = `📦 <strong>Enviando pedido a:</strong> ${userData.name}, ${userData.address}`;

  renderCartItems();
  cartModal.style.display = 'flex';
}

function renderCartItems() {
  cartItemsContainer.innerHTML = '';

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p>La cesta está vacía.</p>';
    cartTotal.textContent = '0.00';
    return;
  }

  const itemCounts = {};
  cart.forEach(id => itemCounts[id] = (itemCounts[id] || 0) + 1);

  let total = 0;

  Object.keys(itemCounts).forEach(id => {
    const productId = Number(id);
    const product = products.find(p => p.id === productId);
    const quantity = itemCounts[id];
    const subtotal = product.price * quantity;
    total += subtotal;

    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <div>
        <strong>${product.name}</strong><br>
        <small>${product.price.toFixed(2)}€ / ud.</small>
      </div>
      <div>
        <input type="number" min="1" max="${product.stock}" value="${quantity}" onchange="changeQuantity(${productId}, this.value)">
        <button class="btn-remove" onclick="removeFromCart(${productId})">Eliminar</button>
      </div>
    `;
    cartItemsContainer.appendChild(cartItem);
  });

  cartTotal.textContent = total.toFixed(2);
}

function changeQuantity(productId, newQuantity) {
  const quantity = parseInt(newQuantity);
  if (isNaN(quantity) || quantity <= 0) return;

  cart = cart.filter(id => id !== productId);
  for (let i = 0; i < quantity; i++) {
    cart.push(productId);
  }

  saveCart();
  updateCartCounter();
  renderCartItems();
}

function removeFromCart(productId) {
  cart = cart.filter(id => id !== productId);
  saveCart();
  updateCartCounter();
  renderCartItems();
}

function handleCheckout() {
  if (cart.length === 0) {
    showToast("La cesta está vacía.");
    return;
  }

  showToast("¡Pedido de videojuegos finalizado con éxito!");
  cart = [];
  saveCart();
  updateCartCounter();
  cartModal.style.display = 'none';
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
