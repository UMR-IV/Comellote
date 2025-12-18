import { ref, push, set, onValue } 
  from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } 
  from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } 
  from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

import { database } from './firebase-config.js';

// 1️⃣ Initialize auth
const auth = getAuth();
const provider = new GoogleAuthProvider();

// 2️⃣ Automatically sign in anonymously
signInAnonymously(auth)
  .then(() => console.log("Anonymous user signed in"))
  .catch(err => console.error("Anonymous sign-in failed:", err));

// 3️⃣ Initialize storage
const storage = getStorage();

document.addEventListener('DOMContentLoaded', () => {
  const productCards = document.querySelectorAll('.product-card');

  // Insert product descriptions dynamically
  productCards.forEach(card => {
    const name = card.querySelector('h3').innerText;
    const desc = productDescriptions[name] || "Short description of the item.";
    
    const p = document.createElement('p');
    p.innerText = desc;
    p.style.whiteSpace = "pre-line";
    card.insertBefore(p, card.querySelector('.price'));
  });

  // ============== BLOCKED DATES MANAGEMENT ==============
  let blockedDates = [];
  const deliveryDateInput = document.getElementById('deliveryDate');
  const dateWarning = document.getElementById('dateWarning');

  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  deliveryDateInput.min = minDate;

  deliveryDateInput.addEventListener('change', (e) => {
    const selectedDate = e.target.value;
    if (blockedDates.includes(selectedDate)) {
      alert('❌ This date is not available for delivery. Please select another date.');
      dateWarning.style.display = 'block';
      deliveryDateInput.value = '';
      deliveryDateInput.classList.add('error');
    } else {
      dateWarning.style.display = 'none';
      deliveryDateInput.classList.remove('error');
    }
  });

  const blockedDatesRef = ref(database, 'blockedDates');
  onValue(blockedDatesRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      blockedDates = Object.keys(data).filter(date => data[date] === true);
    }
  });

  // ---------------- LOGIN FORM ----------------
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = document.getElementById('name').value;
      const phone = document.getElementById('phone').value;
      const address = document.getElementById('address').value;

      localStorage.setItem('shopUser', JSON.stringify({ name, phone, address }));

      updateCartUserInfo();
      document.getElementById('loginModal').style.display = 'none';
    });
  }

  function updateCartUserInfo() {
    const userInfoDiv = document.getElementById('cartUserInfo');
    const userData = localStorage.getItem('shopUser');
    if (!userData) {
        userInfoDiv.innerHTML = '<em>No delivery info</em>';
        return;
    }
    const { name, phone, address } = JSON.parse(userData);
    userInfoDiv.innerHTML = `
        <strong>Delivery For:</strong>
        👤 ${name}<br>
        <small>📌 ${address}</small><br>
        <small>📞 ${phone}</small>
    `;
  }

  // ---------------- CART SIDEBAR ----------------
  const cartSidebar = document.getElementById('cartSidebar');
  document.getElementById('openCart').addEventListener('click', () => cartSidebar.classList.add('open'));
  document.getElementById('closeCart').addEventListener('click', () => cartSidebar.classList.remove('open'));
  let cart = [];
  const requestInput = document.getElementById('customerRequest');

  // ---------------- DELETE CONFIRMATION MODAL ----------------
  const deleteConfirmModal = document.getElementById('deleteConfirmModal');
  const deleteConfirmYes = document.getElementById('deleteConfirmYes');
  const deleteConfirmNo = document.getElementById('deleteConfirmNo');
  let pendingDeleteIndex = -1;

  if (deleteConfirmNo && deleteConfirmYes && deleteConfirmModal) {
    deleteConfirmNo.addEventListener('click', () => {
      deleteConfirmModal.style.display = 'none';
      pendingDeleteIndex = -1;
    });

    deleteConfirmYes.addEventListener('click', () => {
      if (pendingDeleteIndex !== -1) {
        cart.splice(pendingDeleteIndex, 1);
        deleteConfirmModal.style.display = 'none';
        pendingDeleteIndex = -1;
        updateCart();
      }
    });
  }

  // ---------------- VARIATION MODAL ----------------
  const variationModal = document.getElementById('variationModal');
  const flavourOptionsDiv = document.getElementById('flavourOptions');
  const quantityOptionsDiv = document.getElementById('quantityOptions');
  const variationProductName = document.getElementById('variationProductName');
  const variationAddToCart = document.getElementById('variationAddToCart');
  const variationCancel = document.getElementById('variationCancel');
  const variationPriceDiv = document.getElementById('variationPrice');
  const toPaymentBtn = document.getElementById('toPayment');
  const paymentModal = document.getElementById('paymentModal');

  let selectedFlavourIndex = -1;
  let selectedFlavourIndices = [];
  let selectedQuantityIndex = -1;
  let variations = null;

  variationCancel.addEventListener('click', () => {
    variationModal.style.display = 'none';
  });

  // ---------------- ADD TO CART BUTTONS ----------------
  const addButtons = document.querySelectorAll('.product-card button');
  addButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.product-card');
      const productName = card.querySelector('h3').innerText;
      const variationsData = card.getAttribute('data-variations');

      if (!variationsData) {
        const priceText = card.querySelector('.price').innerText.replace('RM','').trim();
        const price = parseFloat(priceText) || 0;
        addToCart(productName, price);
        return;
      }

      variations = JSON.parse(variationsData);
      selectedFlavourIndex = -1;
      selectedFlavourIndices = [];
      selectedQuantityIndex = -1;
      flavourOptionsDiv.innerHTML = '';
      quantityOptionsDiv.innerHTML = '';
      variationProductName.innerText = productName;

      variations.flavours.forEach((f, i) => {
        const btnF = document.createElement('button');
        btnF.innerText = f.name;

        btnF.addEventListener('click', () => {
          const quantity = variations.quantities[selectedQuantityIndex];
          if (quantity === "25 pcs") {
            if (selectedFlavourIndices.includes(i)) selectedFlavourIndices = selectedFlavourIndices.filter(idx => idx !== i);
            else if (selectedFlavourIndices.length < 2) selectedFlavourIndices.push(i);
            highlightMultipleSelection(flavourOptionsDiv, selectedFlavourIndices);
            selectedFlavourIndex = -1;
          } else {
            selectedFlavourIndex = i;
            highlightSelection(flavourOptionsDiv, i);
            selectedFlavourIndices = [];
          }
          updateVariationPrice();
        });

        flavourOptionsDiv.appendChild(btnF);
      });

      variations.quantities.forEach((q, i) => {
        const btnQ = document.createElement('button');
        btnQ.innerText = q;
        btnQ.addEventListener('click', () => {
          selectedQuantityIndex = i;
          selectedFlavourIndex = -1;
          selectedFlavourIndices = [];
          highlightSelection(flavourOptionsDiv, -1);
          highlightSelection(quantityOptionsDiv, i);
          updateVariationPrice();
        });
        quantityOptionsDiv.appendChild(btnQ);
      });

      variationPriceDiv.innerText = "Price: RM 0.00";

      variationAddToCart.onclick = () => {
        if (selectedQuantityIndex === -1) { alert('Please select a quantity!'); return; }

        let flavoursSelected = [];
        const quantity = variations.quantities[selectedQuantityIndex];

        if (quantity === "25 pcs") {
          if (selectedFlavourIndices.length === 0) { alert('Please select at least 1 variation!'); return; }
          flavoursSelected = selectedFlavourIndices.map(idx => variations.flavours[idx].name);
        } else {
          if (selectedFlavourIndex === -1) { alert('Please select a variation!'); return; }
          flavoursSelected = [variations.flavours[selectedFlavourIndex].name];
        }

        let price = 0;
        if (quantity === "25 pcs") {
          const prices = selectedFlavourIndices.map(idx => variations.flavours[idx].prices[selectedQuantityIndex]);
          price = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        } else { price = variations.flavours[selectedFlavourIndex].prices[selectedQuantityIndex]; }

        const flavourText = flavoursSelected.join(" & ");
        addToCart(`${variationProductName.innerText} (${flavourText} - ${quantity})`, price);
        variationModal.style.display = 'none';
      };

      variationModal.style.display = 'flex';
    });
  });

  // ---------------- HELPER FUNCTIONS ----------------
  function highlightSelection(container, index) {
    Array.from(container.children).forEach((btn, i) => btn.classList.toggle('selected', i === index));
  }

  function highlightMultipleSelection(container, indices) {
    Array.from(container.children).forEach((btn, i) => btn.classList.toggle('selected', indices.includes(i)));
  }

  function updateVariationPrice() {
    if (!variations || selectedQuantityIndex === -1) { variationPriceDiv.innerText = "Price: RM 0.00"; return; }
    const quantity = variations.quantities[selectedQuantityIndex];
    let price = 0;
    if (quantity === "25 pcs" && selectedFlavourIndices.length > 0) {
      const prices = selectedFlavourIndices.map(idx => variations.flavours[idx].prices[selectedQuantityIndex]);
      price = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    } else if (selectedFlavourIndex !== -1) {
      price = variations.flavours[selectedFlavourIndex].prices[selectedQuantityIndex];
    }
    variationPriceDiv.innerText = `Price: RM ${price.toFixed(2)}`;
  }

  function addToCart(name, price) {
    const existing = cart.find(item => item.name === name);
    if (existing) existing.quantity += 1;
    else cart.push({ name, price, quantity: 1 });
    updateCart();
    cartSidebar.classList.add('open');
  }

  function updateCart() {
    const cartItemsDiv = document.getElementById('cartItems');
    cartItemsDiv.innerHTML = '';
    let total = 0;

    if (cart.length === 0) cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
    else {
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.innerHTML = `
      <thead>
        <tr>
          <th style="text-align:left;">Item</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Price (RM)</th>
        </tr>
      </thead>
      <tbody></tbody>
      `;
      const tbody = table.querySelector('tbody');

      cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="padding:6px 0;">${item.name}</td>
          <td style="text-align:center;">
            <button style="width:24px; padding:2px; cursor:pointer;" data-index="${index}" data-action="decrease">−</button>
            <span>${item.quantity}</span>
            <button style="width:24px; padding:2px; cursor:pointer;" data-index="${index}" data-action="increase">+</button>
          </td>
          <td style="text-align:right;">${itemTotal.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
      });

      cartItemsDiv.appendChild(table);

      const qtyButtons = cartItemsDiv.querySelectorAll('button[data-action]');
      qtyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.getAttribute('data-index'));
          const action = btn.getAttribute('data-action');

          if (action === 'increase') cart[index].quantity += 1;
          else if (action === 'decrease' && cart[index].quantity > 0) {
            cart[index].quantity -= 1;
            if (cart[index].quantity == 0) {
              cart[index].quantity += 1
              pendingDeleteIndex = index;
              document.getElementById('deleteConfirmMessage').innerText = `Remove "${cart[index].name}" from cart?`;
              deleteConfirmModal.style.display = 'flex';
              return;
            }
          }
          updateCart();
        });
      });
    }

    document.getElementById('cartTotal').innerText = total.toFixed(2);
  }

  // ---------------- CHECKOUT ----------------
  const checkoutButton = document.getElementById('checkoutButton');

  checkoutButton.addEventListener('click', () => {
    if (cart.length === 0) { alert('Your cart is empty!'); return; }

    const userData = localStorage.getItem('shopUser');
    const deliveryDate = document.getElementById('deliveryDate').value;

    if (!userData) { alert('Please fill in delivery information first!'); return; }
    if (!deliveryDate) { alert('Please select a delivery date!'); return; }
    if (blockedDates.includes(deliveryDate)) { alert('❌ This date is not available for delivery.'); return; }

    paymentModal.style.display = 'flex';
  });

  // ---------------- SMOOTH SCROLL ----------------
  document.querySelectorAll('nav a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        let offsetPosition = targetId === '#pastry' ? 0 : targetElement.getBoundingClientRect().top + window.pageYOffset - 20;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    });
  });

  // ---------------- PAYMENT & ORDER ----------------
  const submitOrderBtn = document.getElementById('submit');
  const paymentReceiptInput = document.getElementById('paymentReceipt');
  if (submitOrderBtn) {
    submitOrderBtn.addEventListener('click', async () => {
      if (!paymentReceiptInput.files.length) { alert('Please upload your payment receipt!'); return; }

      const receiptFile = paymentReceiptInput.files[0];
      const userData = JSON.parse(localStorage.getItem('shopUser'));
      const customerRequest = document.getElementById('customerRequest').value;
      const deliveryDate = document.getElementById('deliveryDate').value;
      const total = parseFloat(document.getElementById('cartTotal').innerText);

      try {
        const ordersRef = ref(database, 'orders');
        const newOrderRef = push(ordersRef);
        const orderId = newOrderRef.key;

        const receiptStorageRef = storageRef(storage, `paymentReceipts/${orderId}/${receiptFile.name}`);
        await uploadBytes(receiptStorageRef, receiptFile);
        const receiptURL = await getDownloadURL(receiptStorageRef);

        const orderData = {
          uid: auth.currentUser.uid,
          customerName: userData.name,
          phone: userData.phone,
          address: userData.address,
          items: cart,
          customerRequest,
          deliveryDate,
          total,
          timestamp: new Date().toISOString(),
          status: 'pending_payment_verification',
          receiptURL
        };

        await set(newOrderRef, orderData);
        alert('✅ Order submitted! Payment is pending verification.');

        cart = [];
        updateCart();
        paymentModal.style.display = 'none';
        cartSidebar.classList.remove('open');
        paymentReceiptInput.value = '';
        document.getElementById('customerRequest').value = '';

      } catch (error) {
        console.error('❌ Error submitting order:', error);
        alert('Failed to submit order. Please try again.');
      }
    });
  }

  // ---------------- GOOGLE SIGN-IN ----------------
  const googleSignInBtn = document.getElementById('googleSignIn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userInfoDiv = document.getElementById('userInfo');

  if (googleSignInBtn && logoutBtn && userInfoDiv) {
    onAuthStateChanged(auth, user => {
      if (user) {
        if (user.isAnonymous) {
          userInfoDiv.innerText = 'Browsing as Guest';
          googleSignInBtn.style.display = 'inline-block';
          logoutBtn.style.display = 'none';
        } else {
          userInfoDiv.innerText = `Signed in as ${user.displayName} (${user.email})`;
          googleSignInBtn.style.display = 'none';
          logoutBtn.style.display = 'inline-block';
          loadUserOrders(user.uid);
        }
      }
    });


    googleSignInBtn.addEventListener('click', async () => {
      try { await signInWithPopup(auth, provider); } 
      catch (err) { console.error("Google Sign-in error:", err); alert("Google Sign-in failed."); }
    });

    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      signInAnonymously(auth);
    });
  }

  function loadUserOrders(uid) {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, snapshot => {
      const orders = snapshot.val() || {};
      const userOrders = Object.values(orders).filter(o => o.uid === uid);
      console.log("User orders:", userOrders);
      // TODO: render userOrders in a div in your UI
    });
  }

});

// ---------------- PRODUCT DESCRIPTIONS ----------------
const productDescriptions = {
  "Sardine Puff (25pcs)": "🥐 Hand laminated pastry\n🌶️ Pedas rate (6/10)\n🌟 Crunchy bila makan panas panas\n😋 10/10 insyallah",
  "Japanese Cream Puff (40pcs)": "🧊 Crunchy di atas bila sejuk\n🌟 Ice creamy like\n🧒 Children will love this!\n😋 10/10 insyallah",
  "Eclairs (30pcs)": "🍫 Dark chocolate berkualiti\n🧒 Children mesti suka sangat!\n🌟 Yang penting rasa tak manis sangat\n😋 10/10 insyallah",
  "Congo Bars/Blondies 9\"": "🍰 Definetely ramai yang suka\n🍫 Dark Chocolate\n😋 10/10 insyallah",
  "Pandan Gula Melaka Cake": "🧁 Available in cuppies of 12(RM60 @25 RM125)\n🌟 Paling favourite mak mak\n😋 10/10 insyallah",
  "Brownies (Hazelnut Topping) 9''": "🍫 Dark chocolate Hazelnut Spread untuk topping\n🍰 Fudggy\n✅ Wordings boleh\n➕ Toppping extra with additional charges",
  "Pannacotta": "🕰️ 3-4 days prior to date booking\n💵 Price per piece (Lychee/Peach/Mango RM4.5 @ Berries RM6)\n⭐ Can choose up to 2 flavours if order 25pcs",
  "Cheestarts (49pcs)": "🕰️ 3-4 days prior to date booking\n💎 2  pilihan toppings (assorted @ fruits)\n🍫 Toppings custom boleh tulis dalam customer request dalam cart\n✅ Toppings subject to availability",
  "Creme Brulee": "25 pcs mini pack",
  "Seasalt Choc Chip Cookies (~220gm)": "🍬 Available untuk doorgifts(>RM5/pack)\n🍫 Dark Chocolate berkualiti\n😋 Ketagih rate 9/10\n🍡 Manis sedang sedang + seasalt flakes sikit dekat atas cookies",
  "Soft Cookies": "🍫 Dark Chocolate\n🍬 Not too sweet\n🤏 Too sedap to resist",
  "Koleh Kacang 12''": " ",
  "Pulut Sekaya 10''": " ",
  //all under this, dscription is AI, not from menu
  "Kaswi Pandan 10''": "81 pcs",
  "Sandwich (25 pcs)": "🍖 Gourmet Chicken @ Beef Pepperoni Strips @ Tuna \n🏷️ Additional charge for 🍅 & easy bite cut",
  "Koci Santan": "🥥 Inti kelapa manis\n🍃 Aroma daun pisang\n😋 Lembut & lemak berkrim",
  "Cinnamon rolls": "🍥 Cinnamon wangi\n🧈 Lembut & moist\n😋 Best dimakan suam",
  "Lompat Tikam (16-18 pax)": "🍧 Dessert Pantai Timur\n🥥 Santan lemak berkrim\n🌴 Manis seimbang & menyegarkan",
  "Tepung Pelita": "🥥 Lapisan santan lemak\n🍃 Pandan wangi\n😋 Classic kuih tradisional",
  "Victoria Sandwich Cake 9''": "🍰 Kek lembut berlapis\n🍓 Filling ringan & fresh\n😋 Tak muak, sesuai semua",
  "Moist Chocolate Cake 10''": "🍫 Chocolate pekat\n🍰 Moist & soft\n😋 Chocolate lovers wajib cuba",
  "Kek Sarang Semut": "🍯 Tekstur berlubang unik\n🍰 Manis sederhana\n😋 Old school favourite",
  "Banana Youghurt Cheese 9''": "🍌 Rasa pisang natural\n🧀 Cheese & yoghurt balance\n😋 Tak muak",
  "Mix Fruit Pastry Puff": "🥐 Pastry rangup\n🍓 Mix fruits segar\n😋 Manis & fresh",
  "Pudding Raja Kelantan": "🍮 Dessert premium\n🥥 Kaya santan & susu\n✨ Sesuai untuk event besar",
  "Buko Pandan 10''": "🥥 Pandan & kelapa muda\n🍨 Creamy & sejuk\n😋 Dessert viral favourite",
  "Srimuka Pandan 10''": "🍚 Pulut lembut\n🍃 Pandan wangi\n😋 Lemak manis seimbang",
  "Srimuka Pandan Bakar 10''": "🔥 Dibakar di atas\n🍃 Aroma pandan lebih naik\n😋 Versi lebih padu",
  "Beef Lasagna (1 Foil Box)": "🍝 Beef filling banyak\n🧀 Cheesy & creamy\n😋 Sesuai makan ramai",
  "Fruit Puff (50 pcs)": "🥐 Puff rangup\n🍓 Buah segar atas\n😋 Sesuai doorgift",
  "Sourcream Buttercake 10''": "🧈 Buttercake moist\n🍋 Slight sourcream taste\n😋 Tak muak",
  "Lopes Pandan": "🍃 Pandan wangi\n🥥 Kelapa parut segar\n🍯 Gula melaka cair",
  "Chocolate Chip Muffin": "🍫 Chocolate chip banyak\n🧁 Lembut & moist\n😋 Sesuai breakfast",
  "Carrot Cake": "🥕 Carrot parut halus\n🧀 Cream cheese topping\n😋 Tak muak",
  "Neapolitian Marble Cake 7''": "🍰 3 rasa dalam satu\n🎨 Corak marble cantik\n😋 Kanak-kanak suka",
  "Chiken Pie (25 pcs)": "🥧 Pastry rangup\n🍗 Inti ayam berperisa\n😋 Best makan panas",
  "Cream Horn": "🥐 Pastry rangup\n🍦 Cream filling lembut\n😋 Manis sederhana",
  "Kek Tapak Kuda": "🍰 Kek gulung lembut\n🥜 Inti kacang berkrim\n😋 Classic favourite",
};
