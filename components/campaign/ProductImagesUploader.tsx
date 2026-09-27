import React, { useRef, useState } from 'react';
import type { CampaignProductImage } from '../../src/campaignStudio/types.js';
import { MAX_PRODUCT_IMAGES_PER_RUN } from '../../src/campaignStudio/types.js';
import { campaignApi } from '../../src/campaignStudio/client/defaultApi.js';
import { storageService } from '../../services/storageService.js';
import { Button } from '../ui/Button.js';
import { Icon } from '../ui/Icon.js';
import { Spinner } from '../ui/Spinner.js';
import { Notice } from './shared.js';

interface Props {
  runId: string;
  images: CampaignProductImage[];
  onImagesChanged: () => void | Promise<void>;
  onContinue: () => void;
  isGenerating?: boolean;
  readOnly?: boolean;
}

export const ProductImagesUploader: React.FC<Props> = ({
  runId,
  images,
  onImagesChanged,
  onContinue,
  isGenerating = false,
  readOnly = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | File[]) => {
    if (readOnly || uploading) return;
    setError(null);

    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    if (images.length + fileList.length > MAX_PRODUCT_IMAGES_PER_RUN) {
      setError(`You can upload at most ${MAX_PRODUCT_IMAGES_PER_RUN} product photos (${MAX_PRODUCT_IMAGES_PER_RUN - images.length} remaining).`);
      return;
    }

    setUploading(true);
    try {
      for (const file of fileList) {
        if (!file.type.match(/^image\/(png|jpeg|webp)$/i)) {
          throw new Error(`"${file.name}" is not a supported image format. Use PNG, JPEG, or WebP.`);
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`"${file.name}" is too large (max 10MB).`);
        }

        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `campaign-products/${runId}/${Date.now()}-${cleanName}`;
        const publicUrl = await storageService.uploadImage(file, storagePath, file.type || 'image/png');

        const baseLabel = file.name.replace(/\.[^/.]+$/, '').slice(0, 50);
        await campaignApi.addProductImage(runId, {
          storagePath,
          imageUrl: publicUrl,
          label: baseLabel,
        });
      }
      await onImagesChanged();
    } catch (err: any) {
      setError(err?.message || 'Could not upload product photo. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (imageId: string) => {
    if (readOnly || deletingId) return;
    setDeletingId(imageId);
    setError(null);
    try {
      await campaignApi.deleteProductImage(runId, imageId);
      await onImagesChanged();
    } catch (err: any) {
      setError(err?.message || 'Could not delete product photo.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Icon name="image" className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">Product reference photos</h3>
            <p className="text-xs text-text-secondary">
              Upload real product photos so creatives feature the actual product, not an AI approximation. (Optional)
            </p>
          </div>
        </div>
      </div>

      {error && <Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice>}

      {/* Grid of uploaded images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative rounded-xl border border-border-light bg-slate-50 overflow-hidden aspect-square flex flex-col justify-end"
            >
              <img
                src={img.image_url}
                alt={img.label || 'Product reference'}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 transition-opacity" />
              <div className="relative p-2 flex items-center justify-between z-10">
                <span className="text-xs font-medium text-white truncate max-w-[80%]" title={img.label || undefined}>
                  {img.label || 'Photo'}
                </span>
                {!readOnly && (
                  <button
                    type="button"
                    aria-label={`Delete ${img.label || 'photo'}`}
                    disabled={deletingId === img.id}
                    onClick={() => handleDelete(img.id)}
                    className="p-1 rounded-lg bg-black/40 text-white/80 hover:text-rose-400 hover:bg-black/60 transition-colors"
                  >
                    {deletingId === img.id ? <Spinner className="w-3.5 h-3.5 text-white" /> : <Icon name="trash" className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload dropzone */}
      {!readOnly && images.length < MAX_PRODUCT_IMAGES_PER_RUN && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border-light hover:border-primary/50 bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <Spinner className="w-6 h-6 text-primary" />
              <p className="text-xs font-semibold text-text-primary">Uploading reference photos…</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="mx-auto w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Icon name="upload" className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-text-primary">
                Click or drag &amp; drop product photos
              </p>
              <p className="text-[11px] text-text-secondary">
                PNG, JPEG, or WebP up to 10MB ({images.length}/{MAX_PRODUCT_IMAGES_PER_RUN} uploaded)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action footer */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-light">
          <button
            type="button"
            onClick={onContinue}
            disabled={isGenerating || uploading}
            className="text-xs font-semibold text-slate-500 hover:text-text-primary transition-colors"
          >
            {images.length > 0 ? 'Skip adding more' : 'Continue without photos'}
          </button>
          <Button
            onClick={onContinue}
            disabled={uploading}
            isLoading={isGenerating}
            className="ml-auto"
          >
            <Icon name="sparkles" className="w-4 h-4 mr-1.5" />
            {images.length > 0
              ? `Generate master prompts (${images.length} photo${images.length === 1 ? '' : 's'})`
              : 'Generate master prompts'}
          </Button>
        </div>
      )}
    </div>
  );
};
