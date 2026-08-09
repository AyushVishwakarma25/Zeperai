const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
  /const order = await rzp\.orders\.create\(options\);/g,
  `let order;
    try {
      order = await rzp.orders.create(options);
    } catch (rzpErr: any) {
      console.error("Razorpay create order error:", JSON.stringify(rzpErr));
      if (rzpErr.statusCode === 401) {
        throw new AppError("Invalid Razorpay API keys.", 500, "Payment processing is currently unavailable due to invalid gateway configuration (API keys are invalid). Please check your Razorpay keys.");
      }
      throw new AppError(rzpErr.error?.description || "Payment order creation failed", 500, "Payment processing failed. Please try again.");
    }`
);
fs.writeFileSync(file, code);
