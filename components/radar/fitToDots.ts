export interface DataPoint {
    cx: number;
    cy: number;
    [key: string]: any;
}

export function fitToDots(
    points: DataPoint[],
    containerWidth: number,
    containerHeight: number,
    paddingPct: number = 0.1
) {
    if (!points || points.length === 0 || containerWidth === 0 || containerHeight === 0) {
        return { transform: "translate(0px, 0px) scale(1)", transformOrigin: "50% 50%" };
    }

    // 1. Find bounds of actual data (in 0-100 space)
    const bounds = points.reduce(
        (acc, p) => ({
            minX: Math.min(acc.minX, p.cx),
            maxX: Math.max(acc.maxX, p.cx),
            minY: Math.min(acc.minY, p.cy),
            maxY: Math.max(acc.maxY, p.cy),
        }),
        { minX: 100, maxX: 0, minY: 100, maxY: 0 }
    );

    // If there's only one dot or they are all exactly the same, add some padding
    if (bounds.maxX - bounds.minX < 1) {
        bounds.minX = Math.max(0, bounds.minX - 5);
        bounds.maxX = Math.min(100, bounds.maxX + 5);
    }
    if (bounds.maxY - bounds.minY < 1) {
        bounds.minY = Math.max(0, bounds.minY - 5);
        bounds.maxY = Math.min(100, bounds.maxY + 5);
    }

    // Width/height of the bounding box in percentage terms
    const boxPctW = bounds.maxX - bounds.minX;
    const boxPctH = bounds.maxY - bounds.minY;

    // Convert percentages to actual container pixels
    const boxPixelsW = (boxPctW / 100) * containerWidth;
    const boxPixelsH = (boxPctH / 100) * containerHeight;

    // 2. Calculate scale to fit box into container with padding
    const paddingPixels = Math.min(containerWidth, containerHeight) * paddingPct;
    const targetW = containerWidth - paddingPixels * 2;
    const targetH = containerHeight - paddingPixels * 2;

    const scaleX = targetW / boxPixelsW;
    const scaleY = targetH / boxPixelsH;

    // Use the smaller scale so it doesn't clip, cap at 3.5 to prevent extreme zoom
    const scale = Math.min(Math.min(scaleX, scaleY), 3.5);

    // 3. Center of data in pixels
    const dataCenterXPx = ((bounds.minX + bounds.maxX) / 2 / 100) * containerWidth;
    const dataCenterYPx = ((bounds.minY + bounds.maxY) / 2 / 100) * containerHeight;

    const containerCenterX = containerWidth / 2;
    const containerCenterY = containerHeight / 2;

    const tx = containerCenterX - dataCenterXPx;
    const ty = containerCenterY - dataCenterYPx;

    return {
        transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
        transformOrigin: `${dataCenterXPx}px ${dataCenterYPx}px`,
        scale,
        tx,
        ty,
        originX: dataCenterXPx,
        originY: dataCenterYPx,
    };
}
