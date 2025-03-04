// Import dependencies
const sharp = require("sharp");
const fs = require("fs");

async function processImage(input, output, imageOptions) {
    try {
        console.time('total');
        // Get the original image
        console.time('imageObject')
        const imageObject = sharp(input, { limitInputPixels: false }).png()
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

        const imageObjectBuffer = await imageObject.resize(scaledWidth, scaledHeight).toBuffer();

        const transformedImage = sharp(imageObjectBuffer).png();

        const radians = (Math.PI / 180) * imageOptions.imageRotation;
        const rotatedWidth = Math.abs(scaledWidth * Math.cos(radians)) + Math.abs(scaledHeight * Math.sin(radians));
        const rotatedHeight = Math.abs(scaledHeight * Math.cos(radians)) + Math.abs(scaledWidth * Math.sin(radians));

        const centerX = Math.round(rotatedWidth / 2 - imageOptions.imageOffsetX);
        const centerY = Math.round(rotatedHeight / 2 + imageOptions.imageOffsetY);

        const transformedImageBuffer = await transformedImage
            .rotate(imageOptions.imageRotation, { background: { alpha: 0, b: 0, g: 0, r: 0 } })
            .extend({
                background: { alpha: 0, b: 0, g: 0, r: 0 },
                bottom: Math.max(0, Math.round(centerY + imageOptions.height / 2) - Math.round(rotatedHeight)),
                left: Math.max(0, Math.round(imageOptions.width / 2) - centerX),
                right: Math.max(0, Math.round(centerX + imageOptions.width / 2) - Math.round(rotatedWidth)),
                top: Math.max(0, Math.round(imageOptions.height / 2) - centerY),
            })
            .toBuffer();

        await sharp(transformedImageBuffer)
            .extract({
                height: imageOptions.height,
                left: Math.max(0, centerX - Math.round(imageOptions.width / 2)),
                top: Math.max(0, centerY - Math.round(imageOptions.height / 2)),
                width: imageOptions.width,
            })
            .png()
            .toFile(output);

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