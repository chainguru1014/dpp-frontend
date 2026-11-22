// Options for QR images that go into printed label sheets (PDF).
//
// Same content, same error correction (M, the library default) and the
// standard 4-module quiet zone as before, only drawn at 10 px per module
// instead of the default 4. The PDF scales the image to the label size; a
// low-resolution bitmap scaled up by a printer or PDF viewer gets soft,
// smeared module edges, which slows phone cameras down (they have to resolve
// the edges) and fails first on small labels. At 10 px per module, a product
// code (version 4, 33x33 modules) becomes a 410 px image instead of 164 px,
// crisp at any printed size. Checked: it decodes to the identical URL.
export const QR_PRINT_OPTIONS = { errorCorrectionLevel: 'M', margin: 4, scale: 10 };
