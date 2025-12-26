
import React, { useState, useCallback, useEffect } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { FormInput, FormTextArea } from './ui/Form';
import { ImageDropzone } from './ui/ImageDropzone';
import { processImageFile } from '../imageUtils';
import { storageService } from '../services/storageService';

interface UserProfile {
  id: string;
  name: string;
  role: string;
  bio: string;
  email: string;
  location: string;
  avatarUrl: string;
}

interface ProfileEditModalProps {
  user: UserProfile;
  onClose: () => void;
  onSave: (data: Partial<UserProfile>) => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Cleanup blob URL on unmount to prevent memory leaks
    return () => {
        if (avatarPreview && avatarPreview.startsWith('blob:')) {
            URL.revokeObjectURL(avatarPreview);
        }
    }
  }, [avatarPreview]);


  const handleFileChange = useCallback(async (file: File | null) => {
    // Revoke previous blob URL if it exists to prevent memory leaks
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    if (file) {
      try {
        const processedFile = await processImageFile(file, { maxWidth: 512, maxHeight: 512, format: 'image/png' });
        setAvatarFile(processedFile);
        setAvatarPreview(URL.createObjectURL(processedFile));
      } catch (error) {
        console.error("Error processing avatar image:", error);
        setAvatarFile(null);
        setAvatarPreview(user.avatarUrl); // Revert to original on error
      }
    } else {
      setAvatarFile(null);
      setAvatarPreview(user.avatarUrl); // Revert to original if file is removed
    }
  }, [avatarPreview, user.avatarUrl]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
        let finalAvatarUrl = user.avatarUrl;
        // If a new file was selected, upload it to storage
        if (avatarFile) {
            const fileName = `users/${user.id}/avatar.png`;
            finalAvatarUrl = await storageService.uploadImage(avatarFile, fileName);
        }

        const newData: Partial<UserProfile> = {
          name,
          bio,
          avatarUrl: finalAvatarUrl,
        };
        
        onSave(newData);
        // The parent component (`App.tsx`) handles closing the modal.
        
    } catch (err) {
        console.error("Failed to save profile:", err);
        // In a real app, you would show an error toast here.
        setIsSaving(false); // Make sure loading state is turned off on error
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-main w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Edit Profile</h2>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
            <Icon name="close" className="w-5 h-5" />
          </button>
        </header>
        <main className="p-6 space-y-4 overflow-y-auto">
            <div className="flex flex-col items-center space-y-4">
                <div className="w-40 h-40 rounded-full overflow-hidden">
                    <ImageDropzone
                        id="avatar-upload"
                        previewUrl={avatarPreview}
                        onFileChange={handleFileChange}
                        prompt="Upload Avatar"
                        className="!h-40"
                    />
                </div>
            </div>
            <FormInput 
                label="Full Name"
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
             <FormTextArea 
                label="Bio"
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
            />
        </main>
        <footer className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
          <Button onClick={onClose} variant="secondary">Cancel</Button>
          <Button onClick={handleSaveChanges} isLoading={isSaving}>Save Changes</Button>
        </footer>
      </div>
    </div>
  );
};

export default ProfileEditModal;
