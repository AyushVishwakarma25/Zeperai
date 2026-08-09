const Razorpay = require('razorpay');
const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
rzp.orders.create({amount: 100, currency: "INR"}).then(console.log).catch(console.error);
