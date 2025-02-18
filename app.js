// Import dependencies
const sharp = require("sharp");
const fs = require("fs");

(async function () {

    try {
        const imageScale = 1; // 0.41;
        const width = 720; // 1250;
        const height = 720; // 834;
        const imageOffsetX = 379; // -104;
        const imageOffsetY = -17;// -168;
        const rotation = 0;

        // // Create a transparent background
        // const background = sharp({
        //     create: {
        //         width,
        //         height,
        //         channels: 4, // RGBA for transparency
        //         background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent
        //     },
        // });

        // const backgroundMetadata = await background.metadata();
        // console.log('✅', {
        //     backgroundMetadata
        // })

        // // Create Overlay
        // const overlay = await sharp("images/custom-bmw-k75-cafe-racer.jpg")


        // const overlayMetadata = await overlay.metadata();
        // console.log('📊', {
        //     overlayMetadata
        // })

        // const { width: imgWidth, height: imgHeight }  = overlayMetadata;

        // if (!imgWidth || !imgHeight) throw new Error("Invalid image metadata");
            
        //     // Apply scale
        // const scaledWidth = Math.round(imgWidth * imageScale);
        // const scaledHeight = Math.round(imgHeight * imageScale);
    
        // const resizedOverlay = await overlay
        //     .resize(scaledWidth, scaledHeight) // Scale image
        //     .rotate(rotation) // Rotate
        //     .toBuffer(); // Convert to buffer for compositing

        // // const overlay = await sharp("images/custom-bmw-k75-cafe-racer.jpg")
        // //     .metadata()
        // //     .then(({ width: imgWidth, height: imgHeight }) => {
        // //         if (!imgWidth || !imgHeight) throw new Error("Invalid image metadata");
            
        // //         // Apply scale
        // //         scaledWidth = Math.round(imgWidth * imageScale);
        // //         scaledHeight = Math.round(imgHeight * imageScale);
            
        // //         return sharp("images/custom-bmw-k75-cafe-racer.jpg")
        // //             .resize(scaledWidth, scaledHeight) // Scale image
        // //             .rotate(rotation) // Rotate
        // //             .toBuffer(); // Convert to buffer for compositing
        // //     });

        // // Composite the image on the transparent background

        // console.log('👻', {
        //     width,
        //     height,
        //     imgWidth,
        //     imgHeight,
        //     scaledWidth,
        //     scaledHeight,
        //     top: Math.floor(scaledHeight / 2), // Positioning
        //     left: Math.floor(scaledWidth / 2),
        // });


        // await background
        //     .composite([
        //         {
        //             input: resizedOverlay,
        //             top: Math.floor(scaledHeight / 2) - imageOffsetY , // Positioning
        //             left: Math.floor(scaledWidth / 2) + imageOffsetX,
        //         },
        //     ])
        //     .toFormat('png')
        //     .toFile("output/edited-custom-bmw-k75-cafe-racer.png");


    // Transfer

        // Create a transparent background
        const background = sharp({
            create: {
                width,
                height,
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
        const resizedOverlay = await overlay
            .resize(scaledWidth, scaledHeight) // Scale image
            .rotate(rotation) // Rotate
            .toBuffer(); // Convert to buffer for compositing

        await background
            .composite([
                {
                    input: resizedOverlay,
                    top: Math.floor(scaledHeight / 2) - imageOffsetY , // Positioning
                    left: Math.floor(scaledWidth / 2) + imageOffsetX,
                },
            ])
            .toFormat('png')
            .toFile("output/edited-custom-bmw-k75-cafe-racer.png");
    } catch (error) {
        console.log(error);
    }
})();