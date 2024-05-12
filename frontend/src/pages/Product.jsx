import React, { useContext } from 'react'
import { createRoutesFromChildren, useParams } from 'react-router'
import { ShopContext } from '../context/ShopContext'
import Breadcrum from '../components/Breadcrums/Breadcrum';
import ProductDisplay from '../components/ProductDisplay/ProductDisplay';
import DiscriptionBox from '../components/DiscriptionBox/DiscriptionBox';
import RelatedProducts from '../components/RelatedProducts/RelatedProducts';

const Product = () => {
  const {all_product}= useContext(ShopContext);
  const{ productId }= useParams();
  const product = all_product.find((e)=>e.id ===Number(productId))

  return (
    <div>
      <Breadcrum product={product}/>
      <ProductDisplay product={product}/>
      <DiscriptionBox/>
      <RelatedProducts/>
    </div>
  )
}

export default Product
