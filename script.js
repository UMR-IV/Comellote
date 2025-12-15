document.addEventListener('DOMContentLoaded', () => {
  const productCards = document.querySelectorAll('.product-card');

  // Insert product descriptions dynamically
  productCards.forEach(card => {
    const name = card.querySelector('h3').innerText;
    const desc = productDescriptions[name] || "Short description of the item.";
    
    const p = document.createElement('p');
    p.innerText = desc;
    p.style.whiteSpace = "pre-line"; // allows newlines
    card.insertBefore(p, card.querySelector('.price'));
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

        updateCartUserInfo(); // 👈 ADD THIS
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

  const requestInput = document.getElementById('customerRequest');  //saved in requestInput.value

  // ---------------- DELETE CONFIRMATION MODAL ----------------
  const deleteConfirmModal = document.getElementById('deleteConfirmModal');
  const deleteConfirmYes = document.getElementById('deleteConfirmYes');
  const deleteConfirmNo = document.getElementById('deleteConfirmNo');
  let pendingDeleteIndex = -1;

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

  // ---------------- VARIATION MODAL ----------------
  const variationModal = document.getElementById('variationModal');
  const flavourOptionsDiv = document.getElementById('flavourOptions');
  const quantityOptionsDiv = document.getElementById('quantityOptions');
  const variationProductName = document.getElementById('variationProductName');
  const variationAddToCart = document.getElementById('variationAddToCart');
  const variationCancel = document.getElementById('variationCancel');
  const variationPriceDiv = document.getElementById('variationPrice');

  let selectedFlavourIndex = -1;       // single selection
  let selectedFlavourIndices = [];     // multiple selection for 25pcs
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

      // Reset selections
      selectedFlavourIndex = -1;
      selectedFlavourIndices = [];
      selectedQuantityIndex = -1;
      flavourOptionsDiv.innerHTML = '';
      quantityOptionsDiv.innerHTML = '';

      variationProductName.innerText = productName;

      // Flavour buttons
      variations.flavours.forEach((f, i) => {
        const btnF = document.createElement('button');
        btnF.innerText = f.name;

        btnF.addEventListener('click', () => {
          const quantity = variations.quantities[selectedQuantityIndex];

          if (quantity === "25 pcs") {
            // allow max 2 flavours
            if (selectedFlavourIndices.includes(i)) {
              selectedFlavourIndices = selectedFlavourIndices.filter(idx => idx !== i);
            } else {
              if (selectedFlavourIndices.length < 2) selectedFlavourIndices.push(i);
            }
            highlightMultipleSelection(flavourOptionsDiv, selectedFlavourIndices);
            selectedFlavourIndex = -1; // reset single selection
          } else {
            // single flavour selection
            selectedFlavourIndex = i;
            highlightSelection(flavourOptionsDiv, i);
            selectedFlavourIndices = [];
          }

          updateVariationPrice();
        });

        flavourOptionsDiv.appendChild(btnF);
      });

      // Quantity buttons
      variations.quantities.forEach((q, i) => {
        const btnQ = document.createElement('button');
        btnQ.innerText = q;
        btnQ.addEventListener('click', () => {
          selectedQuantityIndex = i;

          // Reset flavour selection on quantity change
          selectedFlavourIndex = -1;
          selectedFlavourIndices = [];
          highlightSelection(flavourOptionsDiv, -1);

          highlightSelection(quantityOptionsDiv, i);
          updateVariationPrice();
        });
        quantityOptionsDiv.appendChild(btnQ);
      });

      // Default price
      variationPriceDiv.innerText = "Price: RM 0.00";

      // Add to cart
      variationAddToCart.onclick = () => {
        if (selectedQuantityIndex === -1) {
            alert('Please select a quantity!');
            return;
        }

        let flavoursSelected = [];
        const quantity = variations.quantities[selectedQuantityIndex];

        if (quantity === "25 pcs") {
            if (selectedFlavourIndices.length === 0) {
            alert('Please select at least 1 flavour!');
            return;
            }
            flavoursSelected = selectedFlavourIndices.map(idx => variations.flavours[idx].name);
        } else {
            if (selectedFlavourIndex === -1) {
            alert('Please select a flavour!');
            return;
            }
            flavoursSelected = [variations.flavours[selectedFlavourIndex].name];
        }

        // compute price
        let price = 0;
        if (quantity === "25 pcs") {
            const prices = selectedFlavourIndices.map(idx => variations.flavours[idx].prices[selectedQuantityIndex]);
            price = prices.reduce((sum, p) => sum + p, 0) / prices.length; // average
        } else {
            price = variations.flavours[selectedFlavourIndex].prices[selectedQuantityIndex];
        }

        const flavourText = flavoursSelected.join(" & ");
        addToCart(`${variationProductName.innerText} (${flavourText} - ${quantity})`, price);
        variationModal.style.display = 'none';
    };

      variationModal.style.display = 'flex';
    });
  });

  // ---------------- HELPER FUNCTIONS ----------------
  function highlightSelection(container, index) {
    Array.from(container.children).forEach((btn, i) => {
      btn.classList.toggle('selected', i === index);
    });
  }

  function highlightMultipleSelection(container, indices) {
    Array.from(container.children).forEach((btn, i) => {
      btn.classList.toggle('selected', indices.includes(i));
    });
  }

  function updateVariationPrice() {
  if (!variations || selectedQuantityIndex === -1) {
    variationPriceDiv.innerText = "Price: RM 0.00";
    return;
  }

  const quantity = variations.quantities[selectedQuantityIndex];
  let price = 0;

  if (quantity === "25 pcs" && selectedFlavourIndices.length > 0) {
    // calculate average of selected flavours
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

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
    } else {
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        // ----- TABLE HEADER -----
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

        // ----- TABLE ROWS -----
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

        // ----- ADD EVENT LISTENERS TO QTY BUTTONS -----
        const qtyButtons = cartItemsDiv.querySelectorAll('button[data-action]');
        qtyButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            const action = btn.getAttribute('data-action');

            if (action === 'increase') {
              cart[index].quantity += 1;
            } else if (action === 'decrease' && cart[index].quantity > 0) {
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

});

// Product descriptions
const productDescriptions = {
  "Sardine Puff (25pcs)": "🥐 Hand laminated pastry\n🌶️ Pedas rate (6/10)\n🌟 Crunchy bila makan panas panas\n😋 10/10 insyallah",
  "Japanese Cream Puff (40pcs)": "🧊 Crunchy di atas bila sejuk\n🌟 Ice creamy like\n🧒 Children will love this!\n😋 10/10 insyallah",
  "Eclairs (30pcs)": "🍫 Dark chocolate berkualiti\n🧒 Children mesti suka sangat!\n🌟 Yang penting rasa tak manis sangat\n😋 10/10 insyallah",
  "Congo Bars/Blondies 9\"": "🍰 Definetely ramai yang suka\n🍫 Dark Chocolate\n😋 10/10 insyallah",
  "Pandan Gula Melaka Cake": "🧁 Available in cuppies of 12(RM60 @25 RM125)\n🌟 Paling favourite mak mak\n😋 10/10 insyallah",
  "Brownies (Hazelnut Topping) 9''": "🍫 Dark chocolate Hazelnut Spread untuk topping\n🍰 Fudggy\n✅ Wordings boleh\n➕ Toppping extra with additional charges",
  "Pannacotta": "🕰️ 3-4 days prior to date booking\n💵 Price per piece (Lychee/Peach/Mango RM4.5 @ Berries RM6)\n⭐ Can choose up to 2 flavours if order 25pcs",
  "Cheestarts (49pcs)": "🕰️ 3-4 days prior to date booking\n💎 2  pilihan toppings (assorted @ fruits)\n🍫 Toppings custom boleh tulis dalam customer request dalam cart XXXXXXXXXXXXXXXXXXXXX_RECONFIRM_XXXXXXXXXXXXXXXXXXXXXXXXXXXXx\n✅ Toppings subject to availability",
  "Creme Brulee": "25 pcs mini pack",
  "Seasalt Choc Chip Cookies (~220gm)": "🍬 Available untuk doorgifts(>RM5/pack)\n🍫 Dark Chocolate berkualiti\n😋 Ketagih rate 9/10\n🍡 Manis sedang sedang + seasalt flakes sikit dekat atas cookies",
  "Soft Cookies": "🍫 Dark Chocolate\n🍬 Not too sweet\n🤏 Too sedap to resist",
  "Koleh Kacang 12''": " ",
  "Pulut Sekaya 10''": " ",
  "Kaswi Pandan 10''": "81 pcs",
};
