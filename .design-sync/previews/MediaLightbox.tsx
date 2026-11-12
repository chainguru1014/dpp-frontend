import React from 'react';
import { MediaLightbox } from '@yometel/dpp-admin';

const FILES = 'https://api.innosynch.com/files/';
const slides = [
  '1793185814052esrzhumvs0j9d1.webp',
  '1793185819554esrzhumvs0jdlu.webp',
  '1793185819554esrzhumvs0jdlv.webp',
].map((f) => ({ type: 'image', src: FILES + f }));

// Full-screen viewer for a product's photos (and videos) with arrows and a
// counter. `slides`: { type: 'image', src } | { type: 'video', video }.
export const Photos = () => <MediaLightbox open slides={slides} index={0} onClose={() => {}} />;

export const SecondPhoto = () => <MediaLightbox open slides={slides} index={1} onClose={() => {}} />;
