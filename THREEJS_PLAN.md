# Three.js & 3D Rendering Implementation Plan

## 1. Objective
Integrate Three.js into ZeperAi Studio to allow users to upload 3D models (GLTF/GLB), position them in a 3D scene, adjust lighting and camera angles, and render them into 2D images. These 2D renders can then be fed into the existing Gemini AI generative pipeline to create high-quality product photography and marketing assets.

## 2. Architecture & Tech Stack
- **Library:** `three` and `@react-three/fiber` (R3F) for declarative 3D scenes in React.
- **Helpers:** `@react-three/drei` for pre-built abstractions (OrbitControls, Environment, GLTFLoader, ContactShadows).
- **State Management:** React state to manage model position, rotation, scale, camera position, and lighting parameters.
- **Output:** WebGL canvas rendering to a 2D Data URL (Base64) or Blob.

## 3. Core Features & Workflow

### Phase 1: 3D Scene Setup & Model Loading
1. **Upload Component:** Allow users to upload `.glb` or `.gltf` files.
2. **Canvas Initialization:** Create a `<Canvas>` component from R3F.
3. **Model Loader:** Use `useGLTF` from `@react-three/drei` to load the uploaded model into the scene.
4. **Controls:** Implement `OrbitControls` to allow users to rotate, pan, and zoom the camera around the product.

### Phase 2: Environment & Lighting
1. **HDRI Environments:** Provide preset lighting environments (e.g., Studio, Outdoor, Softbox) using the `<Environment>` component from `drei`.
2. **Custom Lights:** Add UI controls for users to tweak Directional Lights (intensity, color, position) and Ambient Lights.
3. **Shadows:** Enable shadows on the renderer and add a `<ContactShadows>` plane beneath the model to ground it realistically.

### Phase 3: Rendering & AI Integration
1. **Snapshot Mechanism:** Implement a function to capture the current state of the WebGL canvas.
   - Use `gl.domElement.toDataURL('image/png')` to get a 2D image of the 3D scene.
2. **Pipeline Integration:** 
   - The captured 2D image is passed to the `geminiService.ts` as the `frontProductImage` or `activeImages`.
   - The user provides a text prompt (e.g., "Place this product on a marble podium with dramatic lighting").
   - Gemini processes the 2D render of the 3D model and generates the final photorealistic asset.

## 4. UI/UX Design (The "3D Studio" Mode)
- **New App Mode:** Add a new mode called `AppMode.ThreeDStudio`.
- **Layout:**
  - **Left Panel:** 3D Canvas taking up the majority of the screen.
  - **Right Panel:** Controls for:
    - Model Transform (Scale, Rotation X/Y/Z)
    - Lighting Presets
    - Material Tweaks (Optional: adjusting roughness/metalness if the model supports it)
    - "Capture & Generate" button.
- **Interaction:** Users interact directly with the 3D canvas to find the perfect angle, then click "Generate" to pass the snapshot to the AI.

## 5. Performance Considerations
- **Model Size:** Limit uploaded GLB/GLTF file sizes (e.g., max 20MB) to prevent browser crashes.
- **Optimization:** Use `drei`'s `<Suspense>` to show loading spinners while models load.
- **Canvas Size:** Render the WebGL canvas at a high resolution (e.g., 1024x1024) before capturing the snapshot to ensure the AI gets a crisp input image.

## 6. Future Enhancements
- **AI Texture Generation:** Use Gemini to generate seamless textures based on text prompts, then apply them to the 3D model's materials dynamically.
- **3D Backgrounds:** Allow users to place their 3D product inside a pre-built 3D room or environment before rendering.
- **Animation:** Support animated GLTF models and capture specific frames.
