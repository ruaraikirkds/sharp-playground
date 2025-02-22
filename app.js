// Import dependencies
const sharp = require("sharp");
const fs = require("fs");

(async function () {
    try {
        const imageOptions = {
          height: 600,
          imageOffsetX: 0,
          imageOffsetY: 0,
          imageRotation: 0,
          imageScale: 0.5,
          width: 600,
        }
        // Get the original image
        console.time('imageObject')
        const imageObject = await sharp("images/custom-bmw-k75-cafe-racer.jpg", { limitInputPixels: false })
        console.timeEnd('imageObject')
        // Get original image metadata
        console.time('imageObjectMetadata')
        const imageObjectMetadata = await imageObject.metadata();
        console.timeEnd('imageObjectMetadata')
        const { height: originalImageHeight, width: originalImageWidth } = imageObjectMetadata;
        if (!originalImageWidth || !originalImageHeight) {
            throw new Error('Invalid image metadata');
        }

        // Apply scale and rotate to image
        const scaledWidth = Math.round(originalImageWidth * imageOptions.imageScale);
        const scaledHeight = Math.round(originalImageHeight * imageOptions.imageScale);

        console.log('✅', {
            imageObjectMetadata,
            scaledHeight,
            scaledWidth
        });

        if (imageOptions.imageRotation === 90 || imageOptions.imageRotation === 270) {
            imageObject
                .rotate(
                    // Rotate and ensure background is transparent
                    imageOptions.imageRotation,
                    {
                        background: { alpha: 0, b: 0, g: 0, r: 0 },
                    },
                )
                .resize(scaledHeight, scaledWidth); // Scale image
        } else {
            imageObject
                .resize(scaledWidth, scaledHeight) // Scale image
                .rotate(
                    // Rotate and ensure background is transparent
                    imageOptions.imageRotation,
                    {
                        background: { alpha: 0, b: 0, g: 0, r: 0 },
                    },
                );
        }

        // Create "overlay" image which will be placed on the working background
        console.time('overlay')
        const overlay = await imageObject.toFormat('png').toBuffer(); // Convert to buffer for compositing
        console.timeEnd('overlay')
        console.time('overlayMetadata')
        const overlayMetadata = await await sharp(overlay, { limitInputPixels: false }).metadata();
        console.timeEnd('overlayMetadata')
        const { height: resizedOverlayHeight, width: resizedOverlayWidth } = overlayMetadata;
        if (!resizedOverlayWidth || !resizedOverlayHeight) {
            throw new Error('Invalid resized image metadata');
        }

        // Create a transparent background with large working area
        const maxBackgroundDimension = Math.round(Math.sqrt(Math.pow(scaledWidth, 2) + Math.pow(scaledHeight, 2)));
        // const maxBackgroundDimension = Math.round(Math.max(scaledWidth, scaledHeight, imageOptions.width, imageOptions.height) * 1.5);

        console.log('✅', {
            overlayMetadata,
            maxBackgroundDimension
        });

        const backgroundWidth = maxBackgroundDimension;
        const backgroundHeight = maxBackgroundDimension;
        const background = sharp({
            create: {
                background: {
                    alpha: 0,
                    b: 0,
                    g: 0,
                    r: 0,
                }, // Transparent
                channels: 4, // RGBA for transparency
                height: backgroundHeight,
                width: backgroundWidth,
            },
            limitInputPixels: false,
        });

        // Buffer the image before final extraction, as overlay image may limit the extraction dimenations
        console.time('preFinalSize')
        const preFinalSize = await background
            .composite([
                {
                    input: overlay,
                    /*
                        Defines the position of the overlay image from the left of the background.
                        It is set so that if imageOffsetX is set to 0, the centre of the overlay is
                        horizontally aligned, with the centre of the background image.
                    */
                    left:
                        Math.round(Math.floor(backgroundWidth / 2) -
                        Math.floor(resizedOverlayWidth / 2) +
                        imageOptions.imageOffsetX),
                    /*
                        Defines the position of the overlay image from the top of the background.
                        It is set so that if imageOffsetY is set to 0, the centre of the overlay is
                        vertically aligned, with the centre of the background image.
                    */
                    top:
                        Math.round(Math.floor(backgroundHeight / 2) -
                        Math.floor(resizedOverlayHeight / 2) -
                        imageOptions.imageOffsetY),
                },
            ])
            .toFormat('png') // All transformed images will be png for transparent background, maybe dynamic in future
            .toBuffer();
        console.timeEnd('preFinalSize')

        // Save result
        console.time('final')
        await sharp(preFinalSize, { limitInputPixels: false })
            .extract({
                height: Math.round(imageOptions.height),
                left: Math.round(Math.floor(backgroundWidth / 2) - Math.floor(imageOptions.width / 2)),
                top: Math.round(Math.floor(backgroundHeight / 2) - Math.floor(imageOptions.height / 2)),
                width: Math.round(imageOptions.width),
            })
            .toFormat('png') 
            .toFile("output/edited-custom-bmw-k75-cafe-racer.jpg");
        console.timeEnd('final')
    } catch (error) {
        console.log('💥', {
            error
        })
    }
    // try {
    //     const imageScale = 1; // 0.41;
    //     const width = 600; // 1250;
    //     const height = 600; // 834;
    //     const imageOffsetX = 0; // -104;
    //     const imageOffsetY = 0;// -168;
    //     const rotation = 89;

    //     const backgroundWidth = 2000; // 1250;
    //     const backgroundHeight = 2000; // 834;

    //     // Create a transparent background
    //     const background = sharp({
    //         create: {
    //             width: backgroundWidth,
    //             height: backgroundHeight,
    //             channels: 4, // RGBA for transparency
    //             background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent
    //         },
    //     });
    //     // Create Overlay
    //     const overlay = await sharp("images/custom-bmw-k75-cafe-racer.jpg")
    //     const overlayMetadata = await overlay.metadata();
    //     const { width: originalImageWidth, height: originalImageHeight }  = overlayMetadata;
    //     if (!originalImageWidth || !originalImageHeight) throw new Error("Invalid image metadata");
            
    //     // Apply scale
    //     const scaledWidth = Math.round(originalImageWidth * imageScale);
    //     const scaledHeight = Math.round(originalImageHeight * imageScale);
    
    //     // Apply scale and rotate to overlay image
    //     // let resizedOverlay = overlay
    //         // .resize(scaledWidth, scaledHeight) // Scale image
    //         // .rotate(rotation, {background: { r: 0, g: 0, b: 0, alpha: 0 }}) // Rotate and ensure background is transparent
    //         // .toFormat('png')
    //         // .toBuffer(); // Convert to buffer for compositing
        
    //     if (rotation === 90 || rotation === 270) {
    //         overlay
    //             .rotate(rotation, {background: { r: 0, g: 0, b: 0, alpha: 0 }}) // Rotate and ensure background is transparent
    //             .resize(scaledHeight, scaledWidth) // Scale image
    //     } else {
    //         overlay
    //             .resize(scaledWidth, scaledHeight) // Scale image
    //             .rotate(rotation, {background: { r: 0, g: 0, b: 0, alpha: 0 }}) // Rotate and ensure background is transparent
    //     }

    //     const resizedOverlay = await overlay
    //         .toFormat('png')
    //         .toBuffer(); // Convert to buffer for compositing

    //     const resizedOverlayMetadata = await await sharp(resizedOverlay).metadata();
    //     const { width: resizedOverlayWidth, height: resizedOverlayHeight }  = resizedOverlayMetadata;
    //     if (!resizedOverlayWidth || !resizedOverlayHeight) throw new Error("Invalid resized image metadata");

    //     // await background
    //     //     .composite([
    //     //         {
    //     //             input: resizedOverlay,
    //     //             top: Math.floor(backgroundHeight / 2) - Math.floor(resizedOverlayHeight / 2) - imageOffsetY , // Positioning
    //     //             left: Math.floor(backgroundWidth / 2) - Math.floor(resizedOverlayWidth / 2) + imageOffsetX,
    //     //         },
    //     //     ])
    //     //     .raw()
    //     //     .extract({
    //     //         height,
    //     //         top: Math.floor(backgroundHeight / 2) - Math.floor(height / 2), // Positioning
    //     //         left: Math.floor(backgroundWidth / 2) - Math.floor(width / 2),
    //     //         // left: Math.round(backgroundWidth / 2 - width / 2),
    //     //         // top: Math.round(backgroundHeight / 2 - height / 2),
    //     //         width,
    //     //     })
    //     //     .toFormat('png')
    //     //     .toFile("output/edited-custom-bmw-k75-cafe-racer.png");

    //     const preFinalSize = await background
    //         .composite([
    //             {
    //                 input: resizedOverlay,
    //                 top: Math.floor(backgroundHeight / 2) - Math.floor(resizedOverlayHeight / 2) - imageOffsetY , // Positioning
    //                 left: Math.floor(backgroundWidth / 2) - Math.floor(resizedOverlayWidth / 2) + imageOffsetX,
    //             },
    //         ])
    //         .toFormat('png')
    //         .toBuffer()

    //     await sharp(preFinalSize)
    //         .extract({
    //             height,
    //             top: Math.floor(backgroundHeight / 2) - Math.floor(height / 2),
    //             left: Math.floor(backgroundWidth / 2) - Math.floor(width / 2),
    //             width,
    //         })
    //         .toFile("output/edited-custom-bmw-k75-cafe-racer.png");
    // } catch (error) {
    //     console.log(error);
    // }
})();