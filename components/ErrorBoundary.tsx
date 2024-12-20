import React from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '50vh',
                        p: 3,
                        gap: 2
                    }}
                >
                    <Typography variant="h5" component="h1" gutterBottom>
                        Something went wrong
                    </Typography>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </Alert>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this.handleRetry}
                    >
                        Retry
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
