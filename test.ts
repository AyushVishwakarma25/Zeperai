import fs from 'fs';
import { analyzeShopify } from './services/shopifyAnalyst';

const run = async () => {
    const csvContent = "title,price,quantity,sales,order\nTest Product,10.00,1,10.00,1\n";
    const files = [{ originalname: 'products.csv', buffer: Buffer.from(csvContent) }];
    try {
        const result = await analyzeShopify(files as any);
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    }
};

run();
