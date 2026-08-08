import fs from 'fs';
let server = fs.readFileSync('server.ts', 'utf-8');

const replacement = `  app.post(['/api/background-remover-pro'], requireAuth, aiLimiter, upload.single('image'), asyncHandler(async (req: any, res: any) => {
    const PRO_SERVICE_URL = process.env.BG_REMOVER_URL || "https://zeperai-bg-remover-pro-rrttxscxyq-as.a.run.app";
    const INTERNAL_API_KEY = process.env.BG_REMOVER_API_KEY;
    
    if (!PRO_SERVICE_URL || !INTERNAL_API_KEY) {
      throw new AppError('Background removal service is not configured.', 500, 'Background removal service is not configured.');
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }
    
    const validMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];
    if (!validMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({ success: false, error: 'Please upload a PNG, JPG, JPEG, or WebP image up to 15 MB.' });
    }

    if (file.size > 15 * 1024 * 1024) {
      return res.status(413).json({ success: false, error: 'Image is too large. Please upload an image under 15 MB.' });
    }

    const FormData = (await import('form-data')).default;
    const axios = (await import('axios')).default;
    
    const formData = new FormData();
    formData.append('file', file.buffer, { filename: file.originalname || 'image.png', contentType: file.mimetype });

    try {
        const response = await axios.post(\`\${PRO_SERVICE_URL}/remove-background\`, formData, {
            headers: { 
                ...formData.getHeaders(),
                'X-Internal-Key': INTERNAL_API_KEY
            },
            responseType: 'arraybuffer',
            timeout: 60000,
        });
        
        res.set('Content-Type', 'image/png');
        res.set('Cache-Control', 'no-store');
        res.send(Buffer.from(response.data, 'binary'));
    } catch (error: any) {
        console.error("Pro bg-remover upstream error:", error.response?.status, error.message);
        
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
             throw new AppError("Image processing took too long. Please try again.", 504, error.message);
        }
        
        const status = error.response?.status;
        if (status === 401) {
            throw new AppError("Unable to authenticate with the image processing service.", 401, error.message);
        } else if (status === 400) {
            throw new AppError("Please upload a PNG, JPG, JPEG, or WebP image up to 15 MB.", 400, error.message);
        } else if (status === 413) {
            throw new AppError("Image is too large. Please upload an image under 15 MB.", 413, error.message);
        }
        
        throw new AppError("Something went wrong while processing your image. Please try again.", 500, error.message);
    }
  }));`;

server = server.replace(/  app\.post\(\['\/api\/background-remover-pro'\], requireAuth, aiLimiter, upload\.single\('image'\), asyncHandler\(async \(req: any, res: any\) => \{[\s\S]*?\}  \}\)\);/, replacement);
fs.writeFileSync('server.ts', server);
