/**
 * Cloudinary configuration helpers.
 * Uses the `next-cloudinary` SDK — cloud name is read from env.
 */

export const CLOUD_NAME =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "your_cloud_name";

/**
 * Build a Cloudinary transformation URL for VFX composition.
 *
 * @param basePublicId - The original video's public_id
 * @param overlayId    - The brand asset public_id to overlay
 * @param distortCoords - 8 corner coordinates [x1,y1,...,x4,y4] for e_distort
 * @param kelvin        - Scene colour temperature for e_colorize tinting
 */
export function buildVfxUrl(
    basePublicId: string,
    overlayId: string,
    distortCoords: number[],
    kelvin?: number
): string {
    const distort = distortCoords.join(":");

    // Build the chained transformation URL per architecture Stage 4
    const transformations = [
        `l_${overlayId.replace(/\//g, ":")}`, // product overlay
        `e_distort:${distort}`,                // 3D perspective warp
        kelvin ? `e_colorize,co_rgb:${kelvinToHex(kelvin)}` : null, // scene tinting
        `e_multiply`,                          // blend grain & shadows
        `fl_layer_apply`,
    ]
        .filter(Boolean)
        .join("/");

    return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${transformations}/${basePublicId}`;
}

/** Rough Kelvin → hex tint (warm/cool bias) */
function kelvinToHex(k: number): string {
    if (k < 4000) return "ffcc88"; // warm tungsten
    if (k < 5500) return "ffeedd"; // neutral daylight
    return "cce0ff";               // cool blue
}
