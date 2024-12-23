import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Button, Container } from '@mui/material';

export default function SuccessPage() {
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
                    Payment Method Added Successfully!
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Thank you for choosing Lawn Peak! Your payment method has been successfully added and you will be charged according to your selected service schedule.
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
