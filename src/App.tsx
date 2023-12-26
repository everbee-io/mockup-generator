import React, { useCallback, useEffect, useState } from "react";
import './App.css';
import * as PIXI from 'pixi.js';
import { Loader } from "@pixi/loaders";
import setupPixi, { convertB64toBlob, getAlphaUrl } from "./pixi/pixi-func";

function App() {
  const [mockupLoader, setLoading] = useState(false);
  const [productData, setProductData] = useState<any>();
  const searchParams = new URLSearchParams(window.location.search);
  const orderId = searchParams.get('orderId');
  const catalogSKUId = searchParams.get('catalogSKUId');
  const productId = searchParams.get('productId');
  const apiBaseURL = process.env.REACT_APP_BACKEND_URL;

  const getProductData = useCallback(async () => {
    if (!productData) {
      const response = await fetch(`${apiBaseURL}/orders/data-for-preview-mockup?catalogSKUId=${catalogSKUId}&productId=${productId}`);
      const data = await response.json();
      setProductData(data.result);
    }
  }, [productData, apiBaseURL, catalogSKUId, productId]);

  const processAngles = useCallback(async () => {
    const data = productData;
    const images: any = {};
    if (data !== undefined) {
      const angles = productData.frontDesignFile && productData.backDesign ? ['front', 'back'] : 
    productData.frontDesignFile && !productData.backDesign ? ['front'] : ['back'];
      await Promise.all(
        angles.map(async (angle: any) => {
          const app = new PIXI.Application({
            width: data.originalWidth,
            height: data.originalHeight,
            backgroundColor: 0xffffff,
          });
          const loader = new Loader();
          setLoading(true);
          const image: any = await new Promise(async (resolve) => {
            await setupPixi(
              data.colorName.toLowerCase().includes('heather') ? data.productMainImages[angle].heather : data.productMainImages[angle].normal,
              getAlphaUrl(angle, data.colorName, data),
              angle === 'front' ? data.frontDesignFile : data.backDesign,
              data.productAlphaImages[angle].normal,
              data.boundaryWidth[angle],
              data.boundaryHeight[angle],
              data.boundaryX[angle],
              data.boundaryY[angle],
              data.colorName + angle,
              data.curvesDifficulty,
              `${data.colorCode}`,
              angle,
              resolve,
              app,
              data.originalWidth,
              data.originalHeight,
              loader,
              'full',
              'full',
            )
          });
          const imageBlob = convertB64toBlob(image.src);
          const formData = new FormData();
          formData.set('images', imageBlob, `${angle}previewFile-${productId}.png`);
          const request = await fetch(`${apiBaseURL}/users/temp-gallery`, {
            body: formData,
            method: 'POST'
          });
          const { src } = await request.json();
          images[angle] = src;
          setLoading(false);
        })
      );
      console.log('images', images);
      return images;
    }
  }, [apiBaseURL, productId, productData]);


  useEffect(() => {
    processAngles();
  }, [processAngles]);

  useEffect(() => {
    getProductData();
  }, [getProductData]);
  

  return (
    <>
      {mockupLoader && <p>Loading.....</p>}
    </>
  );
}

export default App;
