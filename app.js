// Import dependencies
const sharp = require('sharp');
const fs = require('fs');

// const INPUT_IMAGE = 'images/real-club-pilates.jpg';
const INPUT_IMAGE = 'images/test.jpg';
const OUTPUT_IMAGE = 'output/test.png';
const OVERLAY_IMAGE = './output/overlay.jpg';

// Zoom in
// const IMAGE_OPTIONS = {
//   // finalImageHeight: 10500,
//   // finalImageWidth: 10500,
//   //522
//   height: 400,
//   imageOffsetX: 195,
//   imageOffsetY: 130,
//   imageRotation: 0,
//   imageScale: 2,
//   //782
//   width: 600,
// };

// Zoom out
const IMAGE_OPTIONS = {
    // finalImageHeight: 10500,
    // finalImageWidth: 10500,
    //522
    height: 400,
    imageOffsetX: 195,
    imageOffsetY: 130,
    imageRotation: 0,
    imageScale: 0.5,
    //782
    width: 600,
  };
  

(async function a() {
  try {
    const isSmallerScale = IMAGE_OPTIONS.imageScale < 1;

    // Get the original image
    console.time('imageObject');
    const imageObject = await sharp(INPUT_IMAGE, { limitInputPixels: false });
    console.timeEnd('imageObject');
    // Get original image metadata
    console.time('imageObjectMetadata');
    const imageObjectMetadata = await imageObject.metadata();
    console.timeEnd('imageObjectMetadata');
    const { height: originalImageHeight, width: originalImageWidth } = imageObjectMetadata;
    if (!originalImageWidth || !originalImageHeight) {
      throw new Error('Invalid image metadata');
    }

    imageObject.rotate(
      // Rotate and ensure background is transparent
      IMAGE_OPTIONS.imageRotation,
      {
        background: { alpha: 0, b: 0, g: 0, r: 0 },
      }
    );

    console.log({
      width: Math.round(((IMAGE_OPTIONS.width / originalImageWidth) * IMAGE_OPTIONS.width) / IMAGE_OPTIONS.imageScale),
      height: Math.round(((IMAGE_OPTIONS.height / originalImageHeight) * IMAGE_OPTIONS.height) / IMAGE_OPTIONS.imageScale),
      top: IMAGE_OPTIONS.imageOffsetY,
      left: IMAGE_OPTIONS.imageOffsetX,
    });

    if (!isSmallerScale) {
      imageObject.extract({
        width: Math.round(((IMAGE_OPTIONS.width / originalImageWidth) * IMAGE_OPTIONS.width) / IMAGE_OPTIONS.imageScale),
        height: Math.round(((IMAGE_OPTIONS.height / originalImageHeight) * IMAGE_OPTIONS.height) / IMAGE_OPTIONS.imageScale),
          top: IMAGE_OPTIONS.imageOffsetY,
        left: IMAGE_OPTIONS.imageOffsetX,
      });
      imageObject.resize({
        width: IMAGE_OPTIONS.width,
        height: IMAGE_OPTIONS.height,
      });
    }

    // Create "overlay" image which will be placed on the working background
    console.time('overlay');
    await imageObject.toFile(OVERLAY_IMAGE);

    console.timeEnd('overlay');
    console.time('overlayMetadata');
    const overlayMetadata = await sharp(OVERLAY_IMAGE, { limitInputPixels: false }).metadata();
    console.timeEnd('overlayMetadata');
    const { height: resizedOverlayHeight, width: resizedOverlayWidth } = overlayMetadata;
    if (!resizedOverlayWidth || !resizedOverlayHeight) {
      throw new Error('Invalid resized image metadata');
    }

    const background = sharp({
      create: {
        background: {
          alpha: 0,
          b: 0,
          g: 0,
          r: 0,
        }, // Transparent
        channels: 4, // RGBA for transparency
        height: isSmallerScale
          ? IMAGE_OPTIONS.height / IMAGE_OPTIONS.imageScale
          : IMAGE_OPTIONS.height,
        width: isSmallerScale
          ? IMAGE_OPTIONS.width / IMAGE_OPTIONS.imageScale
          : IMAGE_OPTIONS.width,
      },
      limitInputPixels: false,
    });

    // Buffer the image before final extraction, as overlay image may limit the extraction dimenations
    console.time('preFinalSize');
    const preFinalSize = await background
      .composite([
        {
          input: OVERLAY_IMAGE,
          /*
                        Defines the position of the overlay image from the left of the background.
                        It is set so that if imageOffsetX is set to 0, the centre of the overlay is
                        horizontally aligned, with the centre of the background image.
                    */
          left: isSmallerScale ? IMAGE_OPTIONS.imageOffsetX : 0,
          /*
                        Defines the position of the overlay image from the top of the background.
                        It is set so that if imageOffsetY is set to 0, the centre of the overlay is
                        vertically aligned, with the centre of the background image.
                    */
          top: isSmallerScale ? IMAGE_OPTIONS.imageOffsetY : 0,
        },
      ])
      .toFormat('png') // All transformed images will be png for transparent background, maybe dynamic in future
      .toBuffer();
    console.timeEnd('preFinalSize');
    console.log('agasdgfsa');

    // Save result
    console.time('final');
    await sharp(preFinalSize, { limitInputPixels: false })
      .resize({
        width: 600,
      })
      // .extract({
      //     height: IMAGE_OPTIONS.finalImageHeight,
      //     // left: Math.floor(backgroundWidth / 2) - Math.floor(IMAGE_OPTIONS.width / 2),
      //     // top: Math.floor(backgroundHeight / 2) - Math.floor(IMAGE_OPTIONS.height / 2),
      //     width: IMAGE_OPTIONS.finalImageWidth,
      // })
      .toFile(OUTPUT_IMAGE);
    console.timeEnd('final');
  } catch (error) {
    console.log('💥', {
      error,
    });
  }
})();
