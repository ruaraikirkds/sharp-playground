// Import dependencies
const sharp = require("sharp");
const fs = require("fs");

async function processImage(input, output, imageOptions) {
    try {
        console.time('total');
        // Get the original image
        console.time('imageObject')
        const imageObject = await sharp(input, { limitInputPixels: false })
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

        // Create a transparent background with large working area, using Pythagoras to determine dimensions
        const maxBackgroundDimension = Math.round(Math.sqrt(Math.pow(scaledWidth, 2) + Math.pow(scaledHeight, 2)));

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
            .toFile(output);
        console.timeEnd('final')
        console.timeEnd('total');
    } catch (error) {
        console.log('💥', {
            error
        })
    }
};

const imageOptions = {
    height: 600,
    imageOffsetX: 0, // Positive right, negative left
    imageOffsetY: 0, // Positive up, negative down
    imageRotation: 0,
    imageScale: 0.5, // Max 2
    width: 600,
  }

const input = "images/custom-bmw-k75-cafe-racer.jpg"
const output = "output/edited-custom-bmw-k75-cafe-racer.jpg"

// Usage
processImage(
    input,
    output,
    imageOptions
)