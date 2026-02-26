
# HERE Routing API Integration

Haul Command uses the **HERE Routing API v8** to calculate canonical road miles for load posting. This ensures ranking accuracy and "Fair Rate" feedback.

## Setup Instructions

1.  **Create a HERE Developer Account**:
    -   Go to [developer.here.com](https://developer.here.com/) and sign up for the **Freemium** tier.
2.  **Generate an API Key**:
    -   Navigate to your Projects -> Click on your project -> **REST** -> **API Keys**.
    -   Click **Generate API Key**.
3.  **Add to Environment**:
    -   Open your `.env.local` file.
    -   Paste your key into the `HERE_API_KEY` field.
    ```env
    HERE_API_KEY="your_actual_key_here"
    ```

## Testing the Integration

Once the key is added, Haul Command will automatically switch from **Manual** miles required to **API-calculated** miles when creating new loads.

-   **Helper Location**: `lib/here/routeMiles.ts`
-   **Fallback**: If the API key is missing or the request fails, the system gracefully falls back to requiring manual miles entry.

## Why HERE?
-   **Truck Routing**: Support for height-restricted routing (scaffolded).
-   **Density**: High-precision road segments for heavy-haul accuracy.
-   **Free Tier**: Generous transaction limits for the LAUNCH phase.
