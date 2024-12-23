import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Button, Container } from '@mui/material';

export default function CancelPage() {
    const router = useRouter();

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '80vh',
                    textAlign: 'center',
                    gap: 3
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom>
                    Payment Cancelled
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Your payment has been cancelled. No charges have been made to your account.
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => router.push('/')}
                >
                    Return to Home
                </Button>
            </Box>
        </Container>
    );
}
