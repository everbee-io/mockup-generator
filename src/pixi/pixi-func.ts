import { nanoid } from 'nanoid';
import * as PIXI from 'pixi.js';

export const convertB64toBlob = (
  b64Data: string,
  contentType: string = 'image/png',
  sliceSize: number = 512,
) => {
    const byteCharacters = atob(b64Data.split('base64,')[1]);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
  const blob = new Blob(byteArrays, { type: contentType });
  return blob
};

export const getAlphaUrl = (angle: string, colorName: string, data: any) => {
  if (colorName.toLowerCase().includes('heather')) {
    return data.productAlphaImages[angle].heather;
  } else {
    return data.productAlphaImages[angle].normal;
  }
}

async function setupPixi(
  productImageURL: string,
  colorTypeBasedAlphaUrlForHeatherNonHeather: string,
  designUrl: string | null,
  normalAlphaUrl: string,
  boundaryWidth: any,
  boundaryHeight: any,
  boundaryX: any,
  boundaryY: any,
  id: number | string,
  curves_difficulty: string,
  colorCode: string,
  sideOfMockup: 'front' | 'back',
  resolve: any,
  app?: PIXI.Application<PIXI.ICanvas>,
  orgWidth?: any,
  orgHeight?: any,
  loaderPixi?: any,
  reqWidth?: any,
  reqHeight?: any,
): Promise<HTMLImageElement> {
  let image: any;
  const uniqueId = nanoid(5);
  const loader = loaderPixi;
  const Sprite = PIXI.Sprite;

  if (loader.resources[`tshirt_${id}`] === undefined) {
    loader.add(`tshirt_${id}`, productImageURL);
  }

  if (loader.resources[`tempAlpha_${id}`] === undefined) {
    loader.add(
      `tempAlpha_${id}`,
      colorTypeBasedAlphaUrlForHeatherNonHeather,
    );
  }

  if (
    loader.resources[`design-${sideOfMockup ?? uniqueId}`] === undefined &&
    !loader.loading
  ) {
    if (designUrl) loader.add(`design-${sideOfMockup ?? uniqueId}`, designUrl);
  }

  if (loader.resources[`alpha_${id}`] === undefined) {
    loader.add(`alpha_${id}`, normalAlphaUrl);
  }

  const promise: Promise<HTMLImageElement> = new Promise((reslove, resject) => {
    loader.load(async (_: any, res: any) => {
      image = await setup(res, app);
      reslove(image);
    });
  });

  async function setup(resources: any, app: any) {
    let designImg: PIXI.Sprite | null = null;

    const tshirtImg = new Sprite(resources[`tshirt_${id}`].texture as any);
    const tempAlpha = new Sprite(resources[`tempAlpha_${id}`].texture as any);
    const colorAlpha = new Sprite(resources[`tempAlpha_${id}`].texture as any);
    const alphaImg = new Sprite(resources[`alpha_${id}`].texture as any);
    app.renderer.resize(
      reqWidth === 'full' ? orgWidth : reqWidth,
      reqHeight === 'full' ? orgHeight : reqHeight,
    );
    if (designUrl) {
      designImg = new Sprite(
        resources[`design-${sideOfMockup ?? uniqueId}`].texture as any,
      );
    }

    const scaleX = app.view.width / (orgWidth ?? 4000);
    const scaleY = app.view.height / (orgHeight ?? 4000);
    const scale = Math.min(scaleX, scaleY);

    designImg?.scale.set(scale);
    const displacementFilter = new PIXI.DisplacementFilter(alphaImg);
    if (curves_difficulty === 'low') {
      displacementFilter.scale.x = -35;
      displacementFilter.scale.y = -15;
    }
    if (curves_difficulty === 'mid') {
      displacementFilter.scale.x = -35;
      displacementFilter.scale.y = -15;
    }
    if (curves_difficulty === 'high') {
      displacementFilter.scale.x = -35;
      displacementFilter.scale.y = -15;
    }

    if (designImg) {
      designImg.width = boundaryWidth * scaleX;
      designImg.height = boundaryHeight * scaleY;

      designImg.x = boundaryX * scaleX;
      designImg.y = boundaryY * scaleY;
      designImg.blendMode = PIXI.BLEND_MODES.NORMAL;
      designImg.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
      designImg.mask = alphaImg;
      designImg.zIndex = 9999;
    }
    app.stage.addChild(tshirtImg);

    alphaImg.tint = 'FFFFFF';
    tempAlpha.tint = 'FFFFFF';
    tempAlpha.alpha = 0.1;
    colorAlpha.tint = colorCode ?? '0xFFFFFF';
    colorAlpha.alpha = 0.8;
    app.stage.addChild(colorAlpha);
    app.stage.addChild(tempAlpha);
    // app.stage.addChild(alphaImg);
    if (designImg) app.stage.addChild(designImg);

    await app.renderer.extract
      .image(app.stage, 'image/jpg', 1)
      .then((res: any) => {
        image = res;
      });

    await app.stage.removeChildren();
    resolve(image);
  }

  return promise.then((value) => value);
}

export default setupPixi;
