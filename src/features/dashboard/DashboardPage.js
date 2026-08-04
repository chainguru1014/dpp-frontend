import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PeopleIcon from '@mui/icons-material/People';
import { getAdminUserData, getProductsByUser, getOwnedProducts, registerCompany } from '../../helper';
import DashboardAnalytics from './DashboardAnalytics';

const DashboardPage = ({ isAdmin, isAppUser, company, onNavigateToNewProduct, onNavigateToUsers, onNavigateToProducts }) => {
  // Non-super accounts see analytics scoped to the products they own.
  const ownerKind = isAppUser ? 'User' : 'Company';
  const ownerId = company?._id || company?.id;
  const [stats, setStats] = useState({
    users: 0,
    companies: 0,
    products: 0,
  });
  const [loading, setLoading] = useState(true);
  const [openCompanyDialog, setOpenCompanyDialog] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    email: '',
    password: '',
    location: '',
  });

  useEffect(() => {
    loadStatistics();
  }, [isAdmin, company]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        // For admin: get all users, companies, and products
        const adminData = await getAdminUserData();
        const allProducts = await getProductsByUser();
        
        // Count normal users (role === 'User', not 'Company' or 'Admin')
        const normalUsers = adminData.users?.filter(
          (user) => user.role === 'User'
        ) || [];
        
        setStats({
          users: normalUsers.length,
          companies: adminData.companies?.length || 0,
          products: allProducts?.length || 0,
        });
      } else {
        // For a logged-in app user or brand company: count the products they OWN.
        const isAppUser = company.role === 'User' || !!company.userType;
        const ownerKind = isAppUser ? 'User' : 'Company';
        const owned = await getOwnedProducts(ownerKind, company._id);
        setStats({
          users: 0,
          companies: 0,
          products: Array.isArray(owned) ? owned.length : 0,
        });
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!companyFormData.name || !companyFormData.email || !companyFormData.password) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const result = await registerCompany(companyFormData);
      if (result) {
        setOpenCompanyDialog(false);
        setCompanyFormData({ name: '', email: '', password: '', location: '' });
        // Reload statistics
        await loadStatistics();
      }
    } catch (error) {
      console.error('Error creating company:', error);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: { xs: 2, md: 1 } }}>
        Dashboard
      </Typography>

      {/* Usage Statistics — admin only; normal users get a Products KPI inside Analytics. */}
      {isAdmin && (
      <Box>
        <Typography variant="subtitle1" sx={{ mb: { xs: 1.5, md: 0.75 }, color: 'text.secondary', fontWeight: 400 }}>
          Usage Statistics
        </Typography>
        <Grid container spacing={{ xs: 1, md: 1.25 }}>
          {isAdmin ? (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => {
                    console.log('Users card clicked');
                    if (onNavigateToUsers) {
                      onNavigateToUsers();
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: { xs: 1.75, md: 0.9 } }}>
                    <PeopleIcon sx={{ fontSize: { xs: 31, md: 22 }, color: 'primary.main', mb: { xs: 1, md: 0.35 } }} />
                    <Typography variant="h6" sx={{ mb: 0.35, fontSize: { xs: '0.95rem', md: '0.85rem' } }}>
                      Users
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 400, fontSize: { xs: '1.7rem', md: '1.5rem' } }}>
                      {loading ? <CircularProgress size={16} thickness={5} /> : stats.users}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => {
                    console.log('Companies card clicked');
                    if (onNavigateToUsers) {
                      onNavigateToUsers();
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: { xs: 1.75, md: 0.9 } }}>
                    <BusinessIcon sx={{ fontSize: { xs: 31, md: 22 }, color: 'primary.main', mb: { xs: 1, md: 0.35 } }} />
                    <Typography variant="h6" sx={{ mb: 0.35, fontSize: { xs: '0.95rem', md: '0.85rem' } }}>
                      Companies
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 400, fontSize: { xs: '1.7rem', md: '1.5rem' } }}>
                      {loading ? <CircularProgress size={16} thickness={5} /> : stats.companies}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => {
                    console.log('Products card clicked');
                    if (onNavigateToProducts) {
                      onNavigateToProducts();
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: { xs: 1.75, md: 0.9 } }}>
                    <Inventory2Icon sx={{ fontSize: { xs: 31, md: 22 }, color: 'primary.main', mb: { xs: 1, md: 0.35 } }} />
                    <Typography variant="h6" sx={{ mb: 0.35, fontSize: { xs: '0.95rem', md: '0.85rem' } }}>
                      Products
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 400, fontSize: { xs: '1.7rem', md: '1.5rem' } }}>
                      {loading ? <CircularProgress size={16} thickness={5} /> : formatNumber(stats.products)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          ) : (
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={onNavigateToProducts}
              >
                <CardContent sx={{ textAlign: 'center', py: { xs: 1.75, md: 0.9 } }}>
                  <Inventory2Icon sx={{ fontSize: { xs: 31, md: 22 }, color: 'primary.main', mb: { xs: 1, md: 0.35 } }} />
                  <Typography variant="h6" sx={{ mb: 0.35, fontSize: { xs: '0.95rem', md: '0.85rem' } }}>
                    Products
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 400, fontSize: { xs: '1.7rem', md: '1.5rem' } }}>
                    {loading ? <CircularProgress size={16} thickness={5} /> : stats.products}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
      )}

      <DashboardAnalytics
        ownerKind={isAdmin ? null : ownerKind}
        ownerId={isAdmin ? null : ownerId}
        productsCount={isAdmin ? null : stats.products}
        onProductsClick={onNavigateToProducts}
      />

      {/* Create Company Dialog */}
      <Dialog
        open={openCompanyDialog}
        onClose={() => setOpenCompanyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create a New Company</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Company Name"
              variant="outlined"
              fullWidth
              required
              value={companyFormData.name}
              onChange={(e) =>
                setCompanyFormData({ ...companyFormData, name: e.target.value })
              }
            />
            <TextField
              label="Email"
              variant="outlined"
              type="email"
              fullWidth
              required
              value={companyFormData.email}
              onChange={(e) =>
                setCompanyFormData({ ...companyFormData, email: e.target.value })
              }
            />
            <TextField
              label="Password"
              variant="outlined"
              type="password"
              fullWidth
              required
              value={companyFormData.password}
              onChange={(e) =>
                setCompanyFormData({ ...companyFormData, password: e.target.value })
              }
            />
            <TextField
              label="Location (Optional)"
              variant="outlined"
              fullWidth
              value={companyFormData.location}
              onChange={(e) =>
                setCompanyFormData({ ...companyFormData, location: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCompanyDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateCompany} variant="contained">
            Create Company
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardPage;
