document.addEventListener('DOMContentLoaded', () => {
    // === PASTE YOUR GOOGLE SCRIPT WEB APP URL HERE ===
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-AOtgaQdVQomCOE-RGWkF2vxXTIztcwiUWK1cJJ_udQ8hL7qZxc2-DUMYiQMSX1NQ/exec';

    // Elements - Inputs
    const invoiceNoInput = document.getElementById('invoiceNo');
    const invoiceDateInput = document.getElementById('invoiceDate');
    const patientNameInput = document.getElementById('patientName');
    const itemSelect = document.getElementById('itemName');
    const itemQtyInput = document.getElementById('itemQty');
    const itemRateInput = document.getElementById('itemRate');
    const stockLabel = document.getElementById('stockLabel');
    
    // Elements - Preview
    const displayInvoiceNo = document.getElementById('displayInvoiceNo');
    const displayDate = document.getElementById('displayDate');
    const displayPatientName = document.getElementById('displayPatientName');
    const invoiceItemsTable = document.getElementById('invoiceItems');
    
    // Elements - Totals
    const subtotalDisplay = document.getElementById('subtotalAmount');
    const taxDisplay = document.getElementById('taxAmount');
    const totalDisplay = document.getElementById('totalAmount');

    // Elements - Buttons
    const addItemBtn = document.getElementById('addItemBtn');
    const printBtn = document.getElementById('printBtn');
    const newBillBtn = document.getElementById('newBillBtn');
    const resetBtn = document.getElementById('resetBtn');

    let billItems = [];
    let inventoryDB = []; 
    const TAX_PERCENT = 0.05;

    // Load Inventory
    async function loadInventory() {
        try {
            const response = await fetch(GOOGLE_SCRIPT_URL);
            inventoryDB = await response.json();
            
            if (itemSelect) {
                itemSelect.innerHTML = '<option value="">-- Select Item --</option>';
                inventoryDB.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.name;
                    option.textContent = `${item.name} (Stock: ${item.stock})`;
                    itemSelect.appendChild(option);
                });
            }
            console.log("Inventory synced successfully.");
        } catch (error) {
            console.error("Sync Error:", error);
        }
    }

    // Initialize
    function init(forceNew = false) {
        if (!invoiceNoInput.value || forceNew) {
            const id = 'INV-' + Math.floor(100000 + Math.random() * 900000);
            invoiceNoInput.value = id;
            if (displayInvoiceNo) displayInvoiceNo.textContent = '#' + id;
        }
        const today = new Date().toISOString().split('T')[0];
        invoiceDateInput.value = today;
        updateDateDisplay(today);
        billItems = [];
        renderItems();
        loadInventory();
    }

    // Sync Handlers
    patientNameInput.addEventListener('input', (e) => {
        if (displayPatientName) displayPatientName.textContent = e.target.value || '[Patient Name]';
    });

    invoiceDateInput.addEventListener('input', (e) => updateDateDisplay(e.target.value));

    function updateDateDisplay(val) {
        if (!displayDate || !val) return;
        const [y, m, d] = val.split('-');
        displayDate.textContent = `Date: ${d}/${m}/${y}`;
    }

    itemSelect.addEventListener('change', (e) => {
        const item = inventoryDB.find(i => i.name === e.target.value);
        if (item) {
            itemRateInput.value = item.price;
            if (stockLabel) stockLabel.textContent = `(Avail: ${item.stock})`;
        }
    });

    // ADD ITEM BUTTON LOGIC
    addItemBtn.addEventListener('click', () => {
        const selected = itemSelect.value;
        const qty = parseFloat(itemQtyInput.value);
        
        if (!selected || isNaN(qty) || qty <= 0) return alert("Select item and quantity.");

        const dbItem = inventoryDB.find(i => i.name === selected);
        if (dbItem.stock < qty) return alert("Not enough stock!");

        // Update local stock & dropdown text
        dbItem.stock -= qty;
        for (let opt of itemSelect.options) {
            if (opt.value === dbItem.name) {
                opt.textContent = `${dbItem.name} (Stock: ${dbItem.stock})`;
            }
        }

        billItems.push({
            id: Date.now(),
            name: dbItem.name,
            qty: qty,
            rate: dbItem.price,
            total: qty * dbItem.price
        });

        renderItems();
        itemSelect.value = '';
        itemRateInput.value = '';
    });

    function renderItems() {
        if (!invoiceItemsTable) return;
        invoiceItemsTable.innerHTML = '';
        let subtotal = 0;

        billItems.forEach((item, idx) => {
            subtotal += item.total;
            const row = `<tr>
                <td>${idx + 1}. ${item.name}</td>
                <td class="text-center">${item.qty}</td>
                <td class="text-right">₹${item.rate.toLocaleString('en-IN')}</td>
                <td class="text-right">₹${item.total.toLocaleString('en-IN')}</td>
                <td class="text-center hide-on-print"><button class="btn-remove" onclick="window.removeItem(${item.id})">×</button></td>
            </tr>`;
            invoiceItemsTable.innerHTML += row;
        });

        const tax = subtotal * TAX_PERCENT;
        subtotalDisplay.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
        taxDisplay.textContent = `₹${tax.toLocaleString('en-IN')}`;
        totalDisplay.textContent = `₹${(subtotal + tax).toLocaleString('en-IN')}`;
    }

    // Global helper for row removal
    window.removeItem = (id) => {
        const item = billItems.find(i => i.id === id);
        const dbItem = inventoryDB.find(i => i.name === item.name);
        dbItem.stock += item.qty;
        billItems = billItems.filter(i => i.id !== id);
        renderItems();
    };

    // PRINT & UPDATE
    printBtn.addEventListener('click', async () => {
        if (billItems.length === 0) return;
        
        // POST to Google Sheets
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ rawItems: billItems })
        });

        window.print();
        setTimeout(loadInventory, 1000);
    });

    newBillBtn.addEventListener('click', () => init(true));
    resetBtn.addEventListener('click', () => init(false));

    init();
});