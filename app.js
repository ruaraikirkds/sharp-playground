// Import dependencies
const sharp = require("sharp");
const fs = require("fs");

(async function () {

    try {
        const imageScale = 1; // 0.41;
        const width = 600; // 1250;
        const height = 600; // 834;
        const imageOffsetX = 0; // -104;
        const imageOffsetY = 0;// -168;
        const rotation = 89;

        const backgroundWidth = 2000; // 1250;
        const backgroundHeight = 2000; // 834;

        // Create a transparent background
        const background = sharp({
            create: {
                width: backgroundWidth,
                height: backgroundHeight,
                channels: 4, // RGBA for transparency
                background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent
            },
        });
        // Create Overlay
        const overlay = await sharp("images/custom-bmw-k75-cafe-racer.jpg")
        const overlayMetadata = await overlay.metadata();
        const { width: originalImageWidth, height: originalImageHeight }  = overlayMetadata;
        if (!originalImageWidth || !originalImageHeight) throw new Error("Invalid image metadata");
            
        // Apply scale
        const scaledWidth = Math.round(originalImageWidth * imageScale);
        const scaledHeight = Math.round(originalImageHeight * imageScale);
    
        // Apply scale and rotate to overlay image
        // let resizedOverlay = overlay
            // .resize(scaledWidth, scaledHeight) // Scale image
            // .rotate(rotation, {background: { r: 0, g: 0, b: 0, alpha: 0 }}) // Rotate and ensure background is transparent
            // .toFormat('png')
            // .toBuffer(); // Convert to buffer for compositing
        
        if (rotation === 90 || rotation === 270) {
            overlay
                .rotate(rotation, {background: { r: 0, g: 0, b: 0, alpha: 0 }}) // Rotate and ensure background is transparent
                .resize(scaledHeight, scaledWidth) // Scale image
        } else {
            overlay
                .resize(scaledWidth, scaledHeight) // Scale image
                .rotate(rotation, {background: { r: 0, g: 0, b: 0, alpha: 0 }}) // Rotate and ensure background is transparent
        }

        const resizedOverlay = await overlay
            .toFormat('png')
            .toBuffer(); // Convert to buffer for compositing

        const resizedOverlayMetadata = await await sharp(resizedOverlay).metadata();
        const { width: resizedOverlayWidth, height: resizedOverlayHeight }  = resizedOverlayMetadata;
        if (!resizedOverlayWidth || !resizedOverlayHeight) throw new Error("Invalid resized image metadata");

        // await background
        //     .composite([
        //         {
        //             input: resizedOverlay,
        //             top: Math.floor(backgroundHeight / 2) - Math.floor(resizedOverlayHeight / 2) - imageOffsetY , // Positioning
        //             left: Math.floor(backgroundWidth / 2) - Math.floor(resizedOverlayWidth / 2) + imageOffsetX,
        //         },
        //     ])
        //     .raw()
        //     .extract({
        //         height,
        //         top: Math.floor(backgroundHeight / 2) - Math.floor(height / 2), // Positioning
        //         left: Math.floor(backgroundWidth / 2) - Math.floor(width / 2),
        //         // left: Math.round(backgroundWidth / 2 - width / 2),
        //         // top: Math.round(backgroundHeight / 2 - height / 2),
        //         width,
        //     })
        //     .toFormat('png')
        //     .toFile("output/edited-custom-bmw-k75-cafe-racer.png");

        const preFinalSize = await background
            .composite([
                {
                    input: resizedOverlay,
                    top: Math.floor(backgroundHeight / 2) - Math.floor(resizedOverlayHeight / 2) - imageOffsetY , // Positioning
                    left: Math.floor(backgroundWidth / 2) - Math.floor(resizedOverlayWidth / 2) + imageOffsetX,
                },
            ])
            .toFormat('png')
            .toBuffer()

        await sharp(preFinalSize)
            .extract({
                height,
                top: Math.floor(backgroundHeight / 2) - Math.floor(height / 2),
                left: Math.floor(backgroundWidth / 2) - Math.floor(width / 2),
                width,
            })
            .toFile("output/edited-custom-bmw-k75-cafe-racer.png");
    } catch (error) {
        console.log(error);
    }
})();