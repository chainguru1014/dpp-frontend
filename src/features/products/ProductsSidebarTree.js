import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { TreeItem, SimpleTreeView } from '@mui/x-tree-view';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import ImageIcon from '@mui/icons-material/Image';
import { getFileUrl } from '../../helper';

// First-image thumbnail for a product row (placeholder when no image).
const Thumb = ({ product }) => {
  const img = Array.isArray(product?.images) && product.images.length > 0 ? product.images[0] : null;
  return (
    <Box
      sx={{
        width: 38,
        height: 38,
        borderRadius: 1,
        mr: 1.5,
        flexShrink: 0,
        overflow: 'hidden',
        bgcolor: '#eef1f6',
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {img ? (
        <Box
          component="img"
          src={getFileUrl(img)}
          alt=""
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <ImageIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
      )}
    </Box>
  );
};

const ProductsSidebarTree = ({
  products,
  onSelectProduct,
  onEditProduct,
  onDeleteProduct,
  onOwnerClick,
  onPrintProduct,
}) => {
  const renderChildren = (parent) => {
    const children = products.filter((product) => product.parent === parent._id);
    if (!children.length) return null;

    return children.map((product) => (
      <TreeItem
        key={product._id}
        itemId={product._id}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Thumb product={product} />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <span>{product.name}</span>
              {product.company_id?.name && (
                <span
                  style={{
                    fontSize: 12,
                    color: '#1b4f72',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent product selection when clicking owner
                    if (onOwnerClick) {
                      onOwnerClick(product);
                    }
                  }}
                >
                  {product.company_id.name}
                </span>
              )}
            </Box>
            <Box sx={{ marginLeft: 'auto' }}>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); handlePrintById(product._id); }}
                title="Generate QR code"
              >
                <PrintIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); handleEditById(product._id); }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); handleDeleteById(product._id); }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        }
      >
        {renderChildren(product)}
      </TreeItem>
    ));
  };

  const handleEditById = (id) => {
    const index = products.findIndex((p) => p._id === id);
    if (index >= 0) {
      onEditProduct(index);
    }
  };

  const handleDeleteById = (id) => {
    const index = products.findIndex((p) => p._id === id);
    if (index >= 0) {
      onDeleteProduct(index);
    }
  };

  const handlePrintById = (id) => {
    if (onPrintProduct) {
      onPrintProduct(id);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">Products</Typography>
      </Box>
      <Box
        sx={{
          bgcolor: '#fff',
          p: 2,
          borderRadius: 1,
          boxShadow: 1,
          maxHeight: '70vh',
          overflow: 'auto',
        }}
      >
        <Typography sx={{ mb: 2 }}>Products:</Typography>
        <SimpleTreeView
          onSelectedItemsChange={(e, ids) => {
            const prod = products.find((product) => ids.includes(product._id));
            if (prod) onSelectProduct(prod);
          }}
        >
          {products
            .filter((product) => !product.parent)
            .map((product) => (
              <TreeItem
                key={product._id}
                itemId={product._id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Thumb product={product} />
                    <span>{product.name}</span>
                    {product.company_id?.name && (
                      <span
                        style={{
                          marginLeft: 12,
                          fontSize: 12,
                          color: '#1b4f72',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                        }}
                        onClick={() => onOwnerClick && onOwnerClick(product)}
                      >
                        {product.company_id.name}
                      </span>
                    )}
                    <Box sx={{ marginLeft: 'auto' }}>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handlePrintById(product._id); }}
                        title="Generate QR code"
                      >
                        <PrintIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleEditById(product._id); }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleDeleteById(product._id); }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                }
              >
                {renderChildren(product)}
              </TreeItem>
            ))}
        </SimpleTreeView>
      </Box>
    </Box>
  );
};

export default ProductsSidebarTree;

