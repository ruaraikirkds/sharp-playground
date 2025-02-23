// Import dependencies
const sharp = require("sharp");
const fs = require("fs");

async function processImage(input, output, imageOptions) {
  try {
    console.time("total");
    // Get the original image
    console.time("imageObject");
    const imageObject = await sharp(input, { limitInputPixels: false });
    console.timeEnd("imageObject");
    // Get original image metadata
    console.time("imageObjectMetadata");
    const imageObjectMetadata = await imageObject.metadata();
    console.timeEnd("imageObjectMetadata");
    const { height: originalImageHeight, width: originalImageWidth } =
      imageObjectMetadata;
    if (!originalImageWidth || !originalImageHeight) {
      throw new Error("Invalid image metadata");
    }

    // Apply scale and rotate to image
    const scaledWidth = Math.round(
      originalImageWidth * imageOptions.imageScale
    );
    const scaledHeight = Math.round(
      originalImageHeight * imageOptions.imageScale
    );

    console.log("✅", {
      imageObjectMetadata,
      scaledHeight,
      scaledWidth,
    });

    if (
      imageOptions.imageRotation === 90 ||
      imageOptions.imageRotation === 270
    ) {
      imageObject
        .rotate(
          // Rotate and ensure background is transparent
          imageOptions.imageRotation,
          {
            background: { alpha: 0, b: 0, g: 0, r: 0 },
          }
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
          }
        );
    }

    // Create "overlay" image which will be placed on the working background
    console.time("overlay");
    const overlay = await imageObject.toFormat("png").toBuffer(); // Convert to buffer for compositing
    console.timeEnd("overlay");
    console.time("overlayMetadata");
    const overlayMetadata = await await sharp(overlay, {
      limitInputPixels: false,
    }).metadata();
    console.timeEnd("overlayMetadata");
    const { height: resizedOverlayHeight, width: resizedOverlayWidth } =
      overlayMetadata;
    if (!resizedOverlayWidth || !resizedOverlayHeight) {
      throw new Error("Invalid resized image metadata");
    }

    // Create a transparent background with large working area, using Pythagoras to determine dimensions
    const maxBackgroundDimension = Math.round(
      Math.sqrt(Math.pow(scaledWidth, 2) + Math.pow(scaledHeight, 2))
    );

    console.log("✅", {
      overlayMetadata,
      maxBackgroundDimension,
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
    console.time("preFinalSize");
    const preFinalSize = await background
      .composite([
        {
          input: overlay,
          /*
                        Defines the position of the overlay image from the left of the background.
                        It is set so that if imageOffsetX is set to 0, the centre of the overlay is
                        horizontally aligned, with the centre of the background image.
                    */
          left: Math.round(
            Math.floor(backgroundWidth / 2) -
              Math.floor(resizedOverlayWidth / 2) +
              imageOptions.imageOffsetX
          ),
          /*
                        Defines the position of the overlay image from the top of the background.
                        It is set so that if imageOffsetY is set to 0, the centre of the overlay is
                        vertically aligned, with the centre of the background image.
                    */
          top: Math.round(
            Math.floor(backgroundHeight / 2) -
              Math.floor(resizedOverlayHeight / 2) -
              imageOptions.imageOffsetY
          ),
        },
      ])
      .toFormat("png") // All transformed images will be png for transparent background, maybe dynamic in future
      .toBuffer();
    console.timeEnd("preFinalSize");

    // Save result
    console.time("final");
    await sharp(preFinalSize, { limitInputPixels: false })
      .extract({
        height: Math.round(imageOptions.height),
        left: Math.round(
          Math.floor(backgroundWidth / 2) - Math.floor(imageOptions.width / 2)
        ),
        top: Math.round(
          Math.floor(backgroundHeight / 2) - Math.floor(imageOptions.height / 2)
        ),
        width: Math.round(imageOptions.width),
      })
      .toFormat("png")
      .toFile(output);
    console.timeEnd("final");
    console.timeEnd("total");
  } catch (error) {
    console.log("💥", {
      error,
    });
  }
}

async function processImage2(input, output, imageOptions) {
  const {
    width,
    height,
    imageOffsetX,
    imageOffsetY,
    imageRotation,
    imageScale,
  } = imageOptions;

  try {
    console.time("total");
    const image = sharp(input).png();

    const metadata = await image.metadata();

    const scaledWidth = Math.round(metadata.width * imageScale);
    const scaledHeight = Math.round(metadata.height * imageScale);

    const buffer = await image.resize(scaledWidth, scaledHeight).toBuffer();

    const transformedImage = sharp(buffer).png();

    const radians = (Math.PI / 180) * imageRotation;
    const rotatedWidth =
      Math.abs(scaledWidth * Math.cos(radians)) +
      Math.abs(scaledHeight * Math.sin(radians));
    const rotatedHeight =
      Math.abs(scaledHeight * Math.cos(radians)) +
      Math.abs(scaledWidth * Math.sin(radians));

    const centerX = Math.round(rotatedWidth / 2 - imageOffsetX);
    const centerY = Math.round(rotatedHeight / 2 + imageOffsetY);

    const extendedImage = await transformedImage
      .rotate(imageRotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: Math.max(0, Math.round(height / 2) - centerY),
        bottom: Math.max(
          0,
          Math.round(centerY + height / 2) - Math.round(rotatedHeight)
        ),
        left: Math.max(0, Math.round(width / 2) - centerX),
        right: Math.max(
          0,
          Math.round(centerX + width / 2) - Math.round(rotatedWidth)
        ),
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    await sharp(extendedImage)
      .extract({
        left: Math.max(0, centerX - Math.round(width / 2)),
        top: Math.max(0, centerY - Math.round(height / 2)),
        width: width,
        height: height,
      })
      .png()
      .toFile(output);

    console.timeEnd("total");
  } catch (error) {
    console.log("💥", {
      error,
    });
  }
}

const imageOptions = {
  height: 600,
  imageOffsetX: -200, // Positive right, negative left
  imageOffsetY: 0, // Positive up, negative down
  imageRotation: -20,
  imageScale: 0.5, // Max 2
  width: 600,
};

const input = "images/custom-bmw-k75-cafe-racer.jpg";
const output = "output/edited-custom-bmw-k75-cafe-racer.png";

// Usage
// processImage(
//     input,
//     output,
//     imageOptions
// )

processImage2(input, output, imageOptions);
