import * as React from "react"
import axios from 'axios'
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Alert,
    Snackbar,
    CircularProgress
} from '@mui/material'
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    Search as SearchIcon,
    Sort as SortIcon,
    Refresh as RefreshIcon,
    Payment as PaymentIcon
} from '@mui/icons-material'

interface Customer {
    id: string
    email: string
    metadata: {
        service_type: string
        payment_type: string
        address: string
        lot_size: string
        phone: string
        price: string
        charged: string
        charge_date: string
    }
    created: number
    has_payment_method: boolean
    charged: boolean
}

interface EditDialogState {
    open: boolean
    customer: Customer | null
    newServiceType: string
    newPrice: string
}

function AdminDashboard() {
    const [customers, setCustomers] = React.useState<Customer[]>([])
    const [filteredCustomers, setFilteredCustomers] = React.useState<Customer[]>([])
    const [chargingCustomerId, setChargingCustomerId] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [success, setSuccess] = React.useState<string | null>(null)
    const [isAuthenticated, setIsAuthenticated] = React.useState(false)
    const [password, setPassword] = React.useState("")
    const [searchTerm, setSearchTerm] = React.useState("")
    const [sortBy, setSortBy] = React.useState<'date' | 'price' | 'status'>('date')
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
    const [filterPaymentType, setFilterPaymentType] = React.useState<'all' | 'one_time' | 'recurring'>('all')
    const [refreshKey, setRefreshKey] = React.useState(0)
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
    const [customerToDelete, setCustomerToDelete] = React.useState<Customer | null>(null)
    const [deleteAllDialogOpen, setDeleteAllDialogOpen] = React.useState(false)
    const [editDialog, setEditDialog] = React.useState<EditDialogState>({
        open: false,
        customer: null,
        newServiceType: '',
        newPrice: ''
    })
    const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

    // API configuration
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

    // Axios configuration with CORS headers
    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json'
        }
    }

    // Simple authentication
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)
            setError(null)
            const response = await axios.post(`${API_BASE_URL}/admin-login`, { password }, axiosConfig)
            if (response.data.success) {
                setIsAuthenticated(true)
                localStorage.setItem('adminAuth', 'true')
                fetchCustomers() // Fetch customers after successful login
            }
        } catch (err) {
            console.error('Login error:', err)
            setError(err instanceof Error ? err.message : 'Login failed')
            setIsAuthenticated(false)
            localStorage.removeItem('adminAuth')
        } finally {
            setLoading(false)
        }
    }

    // Check for existing auth on mount
    React.useEffect(() => {
        const isAuth = localStorage.getItem('adminAuth') === 'true'
        setIsAuthenticated(isAuth)
        if (isAuth) {
            fetchCustomers()
        } else {
            setLoading(false) // Stop loading if not authenticated
        }
    }, [])

    // Fetch customers
    const fetchCustomers = async () => {
        if (!isAuthenticated) {
            setLoading(false)
            return
        }
        
        try {
            setLoading(true)
            setError(null)
            
            const response = await axios.get(`${API_BASE_URL}/list-customers`, axiosConfig)
            if (response.data.customers) {
                setCustomers(response.data.customers)
                setFilteredCustomers(response.data.customers)
            } else {
                throw new Error('No customer data received')
            }
        } catch (err) {
            console.error('Error fetching customers:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch customers')
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                setIsAuthenticated(false)
                localStorage.removeItem('adminAuth')
            }
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        if (isAuthenticated) {
            fetchCustomers()
        }
    }, [refreshKey, isAuthenticated])

    // Handle charging customer
    const handleChargeCustomer = async (customerId: string, amount: number) => {
        if (!customerId || amount <= 0) {
            setError('Invalid customer ID or amount')
            return
        }
        
        setChargingCustomerId(customerId)
        setError(null)
        try {
            console.log('Charging customer:', customerId, 'amount:', amount)
            const response = await axios.post(`${API_BASE_URL}/charge-customer`, { 
                customer_id: customerId,
                amount: amount
            }, axiosConfig)

            console.log('Charge response:', response.data)

            if (!response.data.success) {
                throw new Error(response.data.error || 'Payment failed')
            }

            // Update the customer's charged status in the local state
            setCustomers(prevCustomers => 
                prevCustomers.map(customer => 
                    customer.id === customerId
                        ? {
                            ...customer,
                            metadata: {
                                ...customer.metadata,
                                charge_date: response.data.charge_date
                            }
                        }
                        : customer
                )
            )
            setSuccess('Customer charged successfully')
            // Refresh customers list to get updated data from backend
            fetchCustomers()
        } catch (err) {
            console.error('Error charging customer:', err)
            let errorMessage = 'Failed to charge customer'
            if (axios.isAxiosError(err)) {
                console.error('Axios error details:', {
                    message: err.message,
                    response: err.response?.data,
                    status: err.response?.status
                })
                errorMessage = err.response?.data?.error || err.message
            } else if (err instanceof Error) {
                errorMessage = err.message
            }
            setError(errorMessage)
        } finally {
            setChargingCustomerId(null)
        }
    }

    // Handle customer deletion
    const handleDeleteCustomer = async () => {
        if (!customerToDelete) return

        try {
            setLoading(true)
            const response = await axios.delete(
                `${API_BASE_URL}/delete-customer/${customerToDelete.id}`,
                axiosConfig
            )
            
            if (response.data.success) {
                setSuccess('Customer deleted successfully')
                setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id))
                setDeleteDialogOpen(false)
                setCustomerToDelete(null)
            }
        } catch (err) {
            setError('Failed to delete customer')
            console.error('Delete error:', err)
        } finally {
            setLoading(false)
        }
    }

    // Handle delete all customers
    const handleDeleteAllCustomers = async () => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/delete-all-customers`, axiosConfig)
            if (response.data.success) {
                setSnackbar({
                    open: true,
                    message: 'All customers deleted successfully',
                    severity: 'success'
                })
                fetchCustomers() // Refresh the list
            }
        } catch (error) {
            console.error('Error deleting all customers:', error)
            setSnackbar({
                open: true,
                message: 'Failed to delete all customers',
                severity: 'error'
            })
        }
        setDeleteAllDialogOpen(false)
    }

    // Handle service update
    const handleUpdateService = async () => {
        if (!editDialog.customer) return

        try {
            setLoading(true)
            const response = await axios.post(
                `${API_BASE_URL}/update-customer-service`,
                {
                    customer_id: editDialog.customer.id,
                    service_type: editDialog.newServiceType,
                    price: parseFloat(editDialog.newPrice)
                },
                axiosConfig
            )
            
            if (response.data.success) {
                setSuccess('Customer service updated successfully')
                setCustomers(prev => prev.map(c => 
                    c.id === editDialog.customer?.id
                        ? {
                            ...c,
                            metadata: {
                                ...c.metadata,
                                service_type: editDialog.newServiceType,
                                price: editDialog.newPrice
                            }
                        }
                        : c
                ))
                setEditDialog({
                    open: false,
                    customer: null,
                    newServiceType: '',
                    newPrice: ''
                })
            }
        } catch (err) {
            setError('Failed to update customer service')
            console.error('Update error:', err)
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        let result = [...customers]
        
        // Apply payment type filter
        if (filterPaymentType !== 'all') {
            result = result.filter(customer => 
                customer.metadata.payment_type === filterPaymentType
            )
        }
        
        // Apply search filter
        if (searchTerm) {
            result = result.filter(customer => 
                customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.metadata.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.metadata.phone.includes(searchTerm)
            )
        }
        
        // Apply sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return sortOrder === 'asc' 
                        ? a.created - b.created 
                        : b.created - a.created
                case 'price':
                    return sortOrder === 'asc'
                        ? parseFloat(a.metadata.price) - parseFloat(b.metadata.price)
                        : parseFloat(b.metadata.price) - parseFloat(a.metadata.price)
                case 'status':
                    return sortOrder === 'asc'
                        ? (a.charged === b.charged ? 0 : a.charged ? 1 : -1)
                        : (a.charged === b.charged ? 0 : a.charged ? -1 : 1)
                default:
                    return 0
            }
        })
        
        setFilteredCustomers(result)
    }, [customers, searchTerm, sortBy, sortOrder, filterPaymentType])

    const formatPrice = (price: string | undefined): string => {
        if (!price) return '$0.00'
        const numericPrice = parseFloat(price)
        return isNaN(numericPrice) ? '$0.00' : `$${numericPrice.toFixed(2)}`
    }

    return (
        <Container maxWidth="xl">
            {!isAuthenticated ? (
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            maxWidth: 400,
                            width: '100%'
                        }}
                    >
                        <Typography component="h1" variant="h5" gutterBottom>
                            Admin Login
                        </Typography>
                        <form onSubmit={handleLogin} style={{ width: '100%' }}>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                type="password"
                                label="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                sx={{ mt: 3, mb: 2 }}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Login'}
                            </Button>
                        </form>
                    </Paper>
                </Box>
            ) : (
                <Box sx={{ mt: 4 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <TextField
                                    placeholder="Search customers..."
                                    variant="outlined"
                                    size="small"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{ flexGrow: 1 }}
                                />
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Payment Type</InputLabel>
                                    <Select
                                        value={filterPaymentType}
                                        label="Payment Type"
                                        onChange={(e) => setFilterPaymentType(e.target.value as any)}
                                    >
                                        <MenuItem value="all">All</MenuItem>
                                        <MenuItem value="one_time">One Time</MenuItem>
                                        <MenuItem value="recurring">Recurring</MenuItem>
                                    </Select>
                                </FormControl>
                                <IconButton onClick={() => setRefreshKey(k => k + 1)}>
                                    <RefreshIcon />
                                </IconButton>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => setDeleteAllDialogOpen(true)}
                                    startIcon={<DeleteIcon />}
                                >
                                    Delete All Customers
                                </Button>
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>
                                                <Button
                                                    startIcon={<SortIcon />}
                                                    onClick={() => {
                                                        if (sortBy === 'date') {
                                                            setSortOrder(order => order === 'asc' ? 'desc' : 'asc')
                                                        } else {
                                                            setSortBy('date')
                                                            setSortOrder('desc')
                                                        }
                                                    }}
                                                >
                                                    Date
                                                </Button>
                                            </TableCell>
                                            <TableCell>Customer Info</TableCell>
                                            <TableCell>Service Details</TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    startIcon={<SortIcon />}
                                                    onClick={() => {
                                                        if (sortBy === 'price') {
                                                            setSortOrder(order => order === 'asc' ? 'desc' : 'asc')
                                                        } else {
                                                            setSortBy('price')
                                                            setSortOrder('desc')
                                                        }
                                                    }}
                                                >
                                                    Price
                                                </Button>
                                            </TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
                                                    <CircularProgress />
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredCustomers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
                                                    No customers found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredCustomers.map((customer) => (
                                                <TableRow key={customer.id}>
                                                    <TableCell>
                                                        {new Date(customer.created * 1000).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {customer.email}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {customer.metadata.phone}
                                                        </Typography>
                                                        <Typography variant="caption" display="block" color="textSecondary">
                                                            {customer.metadata.address}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {customer.metadata.service_type}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            Lot Size: {customer.metadata.lot_size}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2">
                                                            {(parseFloat(customer.metadata.price) / 100).toFixed(2)}
                                                        </Typography>
                                                        {customer.metadata.charge_date && (
                                                            <Typography variant="caption" color="textSecondary">
                                                                Last charged: {customer.metadata.charge_date}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {customer.has_payment_method ? (
                                                            <Stack direction="row" spacing={1}>
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    size="small"
                                                                    startIcon={<PaymentIcon />}
                                                                    onClick={() => handleChargeCustomer(customer.id, parseFloat(customer.metadata.price) / 100)}
                                                                    disabled={chargingCustomerId === customer.id}
                                                                >
                                                                    {chargingCustomerId === customer.id ? (
                                                                        <CircularProgress size={20} color="inherit" />
                                                                    ) : (
                                                                        'Charge'
                                                                    )}
                                                                </Button>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => {
                                                                        setEditDialog({
                                                                            open: true,
                                                                            customer,
                                                                            newServiceType: customer.metadata.service_type,
                                                                            newPrice: (parseFloat(customer.metadata.price) / 100).toString()
                                                                        })
                                                                    }}
                                                                >
                                                                    <EditIcon />
                                                                </IconButton>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => {
                                                                        setCustomerToDelete(customer)
                                                                        setDeleteDialogOpen(true)
                                                                    }}
                                                                >
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </Stack>
                                                        ) : (
                                                            <Typography variant="caption" color="error">
                                                                No payment method
                                                            </Typography>
                                                        )}

                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    </Grid>

                    {/* Delete Confirmation Dialog */}
                    <Dialog
                        open={deleteDialogOpen}
                        onClose={() => setDeleteDialogOpen(false)}
                    >
                        <DialogTitle>Delete Customer</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Are you sure you want to delete this customer? This action cannot be undone.
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleDeleteCustomer} color="error" autoFocus>
                                Delete
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Delete All Confirmation Dialog */}
                    <Dialog
                        open={deleteAllDialogOpen}
                        onClose={() => setDeleteAllDialogOpen(false)}
                    >
                        <DialogTitle>Delete All Customers</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Are you sure you want to delete all customers? This action cannot be undone.
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDeleteAllDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleDeleteAllCustomers} color="error" autoFocus>
                                Delete All
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Edit Service Dialog */}
                    <Dialog
                        open={editDialog.open}
                        onClose={() => setEditDialog(prev => ({ ...prev, open: false }))}
                    >
                        <DialogTitle>Edit Service</DialogTitle>
                        <DialogContent>
                            <Stack spacing={3} sx={{ mt: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Service Type</InputLabel>
                                    <Select
                                        value={editDialog.newServiceType}
                                        label="Service Type"
                                        onChange={(e) => setEditDialog(prev => ({
                                            ...prev,
                                            newServiceType: e.target.value
                                        }))}
                                    >
                                        <MenuItem value="ONE_TIME">One Time</MenuItem>
                                        <MenuItem value="WEEKLY">Weekly</MenuItem>
                                        <MenuItem value="BI_WEEKLY">Bi-Weekly</MenuItem>
                                        <MenuItem value="MONTHLY">Monthly</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Price"
                                    type="number"
                                    value={editDialog.newPrice}
                                    onChange={(e) => setEditDialog(prev => ({
                                        ...prev,
                                        newPrice: e.target.value
                                    }))}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                                    }}
                                />
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setEditDialog(prev => ({ ...prev, open: false }))}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateService} color="primary" autoFocus>
                                Update
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Success/Error Snackbars */}
                    <Snackbar
                        open={!!success}
                        autoHideDuration={6000}
                        onClose={() => setSuccess(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                        <Alert severity="success" onClose={() => setSuccess(null)}>
                            {success}
                        </Alert>
                    </Snackbar>

                    <Snackbar
                        open={!!error}
                        autoHideDuration
                        onClose={() => setError(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    </Snackbar>

                    <Snackbar
                        open={snackbar.open}
                        autoHideDuration={6000}
                        onClose={() => setSnackbar({ open: false, message: '', severity: 'success' })}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ open: false, message: '', severity: 'success' })}>
                            {snackbar.message}
                        </Alert>
                    </Snackbar>
                </Box>
            )}
        </Container>
    )
}

export default AdminDashboard
