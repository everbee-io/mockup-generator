import { useCallback, useEffect, useState } from "react";
import * as PIXI from 'pixi.js';
import { Loader } from "@pixi/loaders";
import setupPixi, { getAlphaUrl, getBase64ImageFromUrl } from "./pixi-func";

const GenerateMockup = () => {
  const [mockupLoader, setLoader] = useState(false);
  const [url, setUrl] = useState('');
  const angle = 'front';
  const searchParams = new URLSearchParams(window.location.search);
  const orderId = searchParams.get('orderId');
  const catalogSKUId = searchParams.get('catalogSKUId');
  const productId = searchParams.get('productId');
  console.log(orderId, catalogSKUId, productId);
  const getProductData = useCallback(async () => {
    setLoader(true);
    (await fetch(`http://localhost:8080/v1/orders/data-for-preview-mockup?catalogSKUId=${catalogSKUId}&productId=${productId}`)).json().then(async (res) => {
      const data = res.result;
      const app = new PIXI.Application({
        width: 200,
        height: 250,
        backgroundColor: 0xffffff,
      });
      const loader = new Loader();
      const base64OfDesignFile: any = await getBase64ImageFromUrl(angle === 'front' ? data.frontDesignFile : data.backDesignFile).then((result) => { return result });
      const image = await setupPixi(
        data.colorName.toLowerCase().includes('heather') ? data.productMainImages[angle].heather : data.productMainImages[angle].normal,
        getAlphaUrl(angle, data.colorName, data),
        base64OfDesignFile,
        data.productAlphaImages.front.normal,
        data.boundaryWidth[angle],
        data.boundaryHeight[angle],
        data.boundaryX[angle],
        data.boundaryY[angle],
        data.colorName+angle,
        data.curvesDifficulty,
        `${data.colorCode}`,
        app,
        data.originalWidth,
        data.originalHeight,
        loader,
        'full',
        'full',
        angle
      );
      setUrl(image.src);
      setLoader(false);
    });
  }, [catalogSKUId, productId])

  useEffect(() => {
    getProductData();
  }, [getProductData]);
  

  return (<>
  {mockupLoader && <p>Loading.....</p>}  
  <img src={url} alt='loaded' />
  </>)
}

export default GenerateMockup;