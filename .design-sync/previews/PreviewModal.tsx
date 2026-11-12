import React from 'react';
import { PreviewModal } from '@yometel/dpp-admin';

const FILES = 'https://api.innosynch.com/files/';
const product = {
  _id: '6a959caccac488c74bcdb336',
  name: 'Shirt Jacket',
  model: 'Sigmon Zip Shirt Jacket',
  skuStyleNumber: 'OTH-2544-65',
  price: 229,
  currency: 'EUR',
  color: 'Black',
  size: 'M',
  images: [
    '1793185814052esrzhumvs0j9d1.webp',
    '1793185819554esrzhumvs0jdlu.webp',
    '1793185819554esrzhumvs0jdlv.webp',
    '1793185819555esrzhumvs0jdlw.webp',
  ].map((f) => FILES + f),
  brandInfo: { name: 'A', detail: 'Shop online for shoes, clothing and more from top brands.' },
  aboutProduct: 'Functionality gets a fashion upgrade with this sleek shirt-jacket cut from smooth cotton and bordered by snug ribbed trim.\n\nFront zip closure\nSpread collar\nRibbed cuffs and hem',
  detailFacts: { material: 'Blue wool', fit: 'Navy, olive, khaki and gray trousers', wash: 'Medium Blue, Vintage Fade', durability: 'Reinforced seams, long lasting', traceableIdentity: 'Traceable' },
  maintenance: { iconIds: ['wash_30', 'dry_clean_P', 'bleach_no', 'iron_low'], description: '', tips: [] },
  materialSize: { size: 'Large', materials: [{ material: 'Wool', percent: 90 }, { material: 'Polyester', percent: 10 }] },
};

// The "Preview" dialog on the product pages: the passport in a phone frame,
// as shoppers will see it. `theme` is the brand's DPP look (else the
// company's saved look is loaded, else the standard blue).
export const Preview = () => <PreviewModal open setOpen={() => {}} productInfo={product} theme={null} />;
