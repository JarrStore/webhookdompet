const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = 3000;

// Middleware untuk parsing JSON
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Endpoint webhook untuk menerima notifikasi pembayaran
app.post('/webhook/payment', (req, res) => {
  try {
    const payload = req.body;
    
    // Log payload yang diterima
    console.log('Webhook received:');
    console.log('Event Type:', payload.eventType);
    console.log('Payment ID:', payload.paymentId);
    console.log('Data:', JSON.stringify(payload.data, null, 2));
    
    // Validasi payload
    if (!payload.eventType || !payload.paymentId || !payload.data) {
      console.log('Invalid payload structure');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payload structure' 
      });
    }
    
    // Proses berdasarkan event type
    switch(payload.eventType) {
      case 'deposit':
        handleDeposit(payload.data);
        break;
      case 'withdrawal':
        handleWithdrawal(payload.data);
        break;
      default:
        console.log(`Unknown event type: ${payload.eventType}`);
    }
    
    // Selalu return 200 untuk konfirmasi penerimaan
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook received successfully' 
    });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Tetap return 200 untuk menghindari retry jika error terjadi setelah validasi
    return res.status(200).json({ 
      success: false, 
      message: 'Error processing webhook' 
    });
  }
});

// Fungsi untuk handle deposit
function handleDeposit(data) {
  console.log('Processing deposit:');
  console.log(`- ID: ${data.id}`);
  console.log(`- Amount: ${data.amount} ${data.currency}`);
  console.log(`- Status: ${data.status}`);
  console.log(`- Reference: ${data.reference}`);
  
  // TODO: Implementasi logika bisnis Anda di sini
  // Contoh: update database, kirim email, dll
  
  if (data.status === 'paid') {
    console.log('Payment successful, updating database...');
    // updateOrderStatus(data.reference, 'paid');
  }
}

// Fungsi untuk handle withdrawal
function handleWithdrawal(data) {
  console.log('Processing withdrawal:');
  console.log(`- ID: ${data.id}`);
  console.log(`- Amount: ${data.amount} ${data.currency}`);
  console.log(`- Status: ${data.status}`);
  console.log(`- Reference: ${data.reference}`);
  
  // TODO: Implementasi logika bisnis Anda di sini
}

// Endpoint untuk testing (mengirim webhook manual)
app.post('/test/send-webhook', (req, res) => {
  const testPayload = {
    data: {
      id: "c2489739-0fbf-48aa-8255-44b6c5e13ace",
      amount: 500,
      status: "paid",
      currency: "IDR",
      reference: "order-100-2"
    },
    eventType: "deposit",
    paymentId: "c2489739-0fbf-48aa-8255-44b6c5e13ace"
  };
  
  // Simulasi pengiriman webhook
  console.log('Sending test webhook...');
  
  // Dalam implementasi nyata, Anda akan mengirim HTTP request ke endpoint webhook
  // Untuk testing, kita langsung panggil handler webhook
  req.body = testPayload;
  app.handle(req, res, () => {});
});

// Endpoint untuk melihat logs (sederhana)
app.get('/webhook/logs', (req, res) => {
  res.sendFile(__dirname + '/logs.html');
});

// Endpoint untuk status server
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

// Simpan webhook logs dalam memory (untuk demo)
// Dalam production, gunakan database
const webhookLogs = [];

// Middleware untuk menyimpan logs
app.use('/webhook/payment', (req, res, next) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    payload: req.body,
    ip: req.ip
  };
  
  webhookLogs.push(logEntry);
  
  // Simpan hanya 100 logs terakhir
  if (webhookLogs.length > 100) {
    webhookLogs.shift();
  }
  
  next();
});

// Endpoint untuk melihat logs
app.get('/api/webhook-logs', (req, res) => {
  res.json(webhookLogs);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Webhook server running on http://localhost:${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook/payment`);
  console.log(`Test endpoint: http://localhost:${PORT}/test/send-webhook`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Log viewer: http://localhost:${PORT}/webhook/logs`);
});
