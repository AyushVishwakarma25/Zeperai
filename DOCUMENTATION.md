# KrackXai Studio Documentation

## 1. Introduction

KrackXai Studio is an interactive AI-powered application designed to transform product images into studio-quality advertising graphics. It allows users to generate creatives with customizable models, outfits, poses, backgrounds, and ad copy, leveraging the power of Google's Gemini API.

## 2. Project Structure

The project follows a standard React + TypeScript structure.

```
/
|-- components/
|   |-- ui/                 # Reusable, generic UI components (Button, Card, Icon, etc.)
|   |-- AdCopywriterPanel.tsx # Standalone panel for generating ad copy.
|   |-- App.tsx             # Main application component, state management.
|   |-- CreativeModal.tsx   # The primary modal for configuring and initiating image generation.
|   |-- Dashboard.tsx       # The main view, showing either the tool selection or generated images.
|   |-- DetailPanel.tsx     # Side panel for viewing image details and generating captions.
|   |-- EditModal.tsx       # Modal for advanced image editing (inpainting, cropping).
|   |-- MainContent.tsx     # Displays the grid of generated images.
|   |-- MyDesigns.tsx       # View for displaying user-saved designs (poster board).
|   |-- ... (other components)
|-- services/
|   |-- geminiService.ts    # All interactions with the Google Gemini API.
|   |-- adCopyService.ts    # Service for generating ad copy text.
|   |-- ... (other services)
|-- types.ts                # All TypeScript type definitions and enums.
|-- constants.ts            # Application-wide constants (options for dropdowns, etc.).
|-- imageUtils.ts           # Helper functions for client-side image processing.
|-- index.html              # The main HTML entry point.
|-- index.tsx               # The React application entry point.
|-- DOCUMENTATION.md        # This file.
```

## 3. Core Logic (`App.tsx`)

This is the root component of the application, responsible for managing the global state and orchestrating the user flow.

### State Management

-   `params`: Holds the current configuration for image generation (`GenerateImageParams`).
-   `generatedImages`: An array of `GeneratedImage` objects from the latest generation task.
-   `posterBoard`: An array of user-saved `GeneratedImage` objects.
-   `isLoading`, `isEditing`, `upscalingImageId`: State flags for managing loading overlays and UI states.
-   `currentView`: Controls which main view is displayed (`Dashboard`, `MyDesigns`, `Profile`, etc.).
-   `activeMode`: Determines which creative mode's modal is open (`Influencer`, `Product`, etc.).
-   Modal States: Manages the visibility of various modals (`editingImage`, `zoomedImage`, `isDeployModalOpen`, etc.).

### Key Functions

-   `handleGenerate`: The core function that triggers the image generation process by calling `geminiService.generateImages`. It handles loading states, errors, and updates the `generatedImages` state.
-   `handleUpscale`: Calls `geminiService.upscaleImage` to enhance an image's resolution.
-   `handleApplyEdit`: Calls `geminiService.editImage` with parameters from the `EditModal`.
-   `handleGenerateCaption`: Calls `geminiService.generateCaption` for a specific image.
-   `addToPosterBoard`/`removeFromPosterBoard`: Manages the collection of saved designs.
-   `handleFileChange`: A centralized handler for processing and setting uploaded image files (product images, logos, etc.) into the state. It uses `imageUtils.processImageFile`.

## 4. Services

### `services/geminiService.ts`

This file is the single point of contact with the Google Gemini API for all image and text-generation tasks. All asynchronous API calls are memoized for caching to prevent redundant requests with the same parameters.

-   **`generateImages(params)`**: The most complex function. It dynamically builds a detailed text and image prompt based on the `GenerateImageParams`.
    -   It handles different logic for each `AppMode` (e.g., `Product` mode generates multiple angles in parallel, `Storyboard` mode generates scenes sequentially).
    -   It uses a helper, `generateSingleImage`, which makes the actual `ai.models.generateContent` call.
    -   It handles potential API errors, including safety filter responses.
-   **`upscaleImage(imageUrl)`**: Takes an image URL, sends it to the Gemini API with a prompt to enhance it to 4K, and returns the new image URL.
-   **`editImage(params)`**: Implements inpainting. It takes the original image, a mask, a text prompt, and an optional replacement image, sending them all to the API for editing.
-   **`generateCaption(params)`**: Sends an image and user-defined parameters (tone, length, platform) to generate a creative caption and hashtags.
-   **`detectProductCategory(base64Image, mimeType, description)`**: Analyzes a product image and description to automatically classify it into a `ProductCategory`, which then tailors the available options to the user.
-   **`getABTestSuggestions(image)`**: Generates marketing A/B test ideas for a given creative.
-   **`generateVariantSuggestions(description, field)`**: Provides quick suggestions for specific fields like 'Model Persona' or 'Pose Suggestion' to aid creativity.

### `services/adCopyService.ts`

-   **`generateAdCopy(params)`**: Generates multiple ad copy variations (headline, body, CTA) based on a product description and creative direction.

## 5. Key UI Components

### `components/CreativeModal.tsx`

This is the primary user interface for configuring an image generation task.

-   **Props**: Receives the current `params`, callbacks for changing them, and the `onGenerate` function.
-   **Behavior**: It dynamically renders different sections and form fields based on the active `AppMode`. For example, the 'Influencer' mode shows options for model gender and persona, while the 'Product' mode shows options for camera angles and visual style presets. It manages complex state for custom inputs and storyboard scene creation.

### `components/Dashboard.tsx`

The main screen of the application.

-   **Behavior**:
    1.  If no images have been generated (`generatedImages` is empty), it displays a welcome screen with `ToolCard`s, allowing the user to select a creative mode.
    2.  If images have been generated, it renders the `MainContent` component to display them.
-   It also contains the `FloatingActionBar` for quick generation access from the home screen.

### `components/MainContent.tsx`

Responsible for displaying the results of an image generation.

-   **Behavior**: Renders a grid of `Card` components for each generated image. If the result is a storyboard, it renders them in a horizontal, scrollable view. Each card has action buttons (Upscale, Edit, Save, etc.).

### `components/EditModal.tsx`

A powerful modal for post-generation image editing.

-   **Behavior**:
    -   **Inpaint Mode**: Provides a canvas overlay on the image. The user can paint a mask over an area and provide a text prompt to modify that specific area. It manages brush size and drawing state.
    -   **Crop Mode**: Provides a cropping interface with movable and resizable handles. Supports freeform and fixed aspect ratio cropping.
-   It uses `onApplyEdit` (for inpainting) and `onImageUpdate` (for cropping) to send the changes back to the `App` component.

## 6. Types & Utilities

### `types.ts`

This file is the single source of truth for data structures in the app.

-   **Enums**: Defines all possible options for various settings (e.g., `AppMode`, `AspectRatio`, `ProductCategory`, `CaptionTone`). This ensures type safety and consistency.
-   **Interfaces**:
    -   `GenerateImageParams`: A comprehensive interface that holds all possible parameters for a generation task across all modes.
    -   `GeneratedImage`: The structure for a successfully generated image, including its URL, metadata, and the `params` used to create it.
    -   `EditImageParams`: The structure for an inpainting request.

### `imageUtils.ts`

Contains client-side helper functions for handling images before they are used in API calls or displayed.

-   **`processImageFile(file, options)`**: A crucial utility that takes a raw `File` object, resizes it to maximum dimensions (to save bandwidth and processing time), and converts it to a specified format (e.g., ensuring uploaded images are PNG for transparency support).
-   **`convertDataURLToFormat(dataUrl, format)`**: Converts an image from one format to another (e.g., from PNG to JPEG).
-   **`cropImageToAspectRatio(dataUrl, targetAspectRatio)`**: Performs a center-crop on an image to force it into a specific aspect ratio. This is used because the image generation model does not always perfectly respect the requested ratio.

---
*This documentation was automatically generated by your AI Engineering Partner.*
