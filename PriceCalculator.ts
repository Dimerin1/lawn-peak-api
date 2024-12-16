// Service configuration
export const SERVICES = {
    ONE_TIME: { name: "One-time mowing", discount: 0 },
    WEEKLY: { name: "Weekly mowing", discount: 0.25 },
    BI_WEEKLY: { name: "Bi-Weekly mowing", discount: 0.15 },
    MONTHLY: { name: "Monthly mowing", discount: 0 }
}

export const lotSizeRanges = {
    'SMALL': 'Small (up to 5,000 sq ft)',
    'MEDIUM': 'Medium (5,000 - 10,000 sq ft)',
    'LARGE': 'Large (10,000 - 15,000 sq ft)',
    'XLARGE': 'Extra Large (over 15,000 sq ft)'
};

export function calculatePrice(lotSize: string, service: string): number {
    if (!lotSize) {
        throw new Error("Invalid lot size")
    }
    
    // Base pricing tiers based on lot size
    let basePrice = 40; // Minimum price
    
    if (lotSize === 'SMALL') {
        basePrice += 5000 * 0.008;
    } else if (lotSize === 'MEDIUM') {
        basePrice += (5000 * 0.008) + (4000 * 0.006);
    } else if (lotSize === 'LARGE') {
        basePrice += (5000 * 0.008) + (4000 * 0.006) + (2000 * 0.004);
    } else {
        basePrice += (5000 * 0.008) + (4000 * 0.006) + (2000 * 0.004) + (10000 * 0.002);
    }
    
    // Apply discount if applicable
    const serviceConfig = SERVICES[service as keyof typeof SERVICES]
    if (!serviceConfig) {
        throw new Error("Invalid service selected")
    }
    
    const price = Math.round(basePrice)
    
    if (serviceConfig.discount > 0) {
        return Math.round(price * (1 - serviceConfig.discount))
    }
    
    return price
}
