# Customer Management System - Pricing Summary

## Quick Cost Overview

| Usage Scenario | Monthly Requests | Estimated Monthly Cost | With Free Tier (Year 1) |
|----------------|------------------|------------------------|--------------------------|
| **Low Usage**  | 10,000          | $0.06                  | $0.00                    |
| **Medium Usage** | 100,000       | $0.57                  | $0.00                    |
| **High Usage** | 1,000,000       | $5.64                  | $4.45                    |

## Service Breakdown

### AWS Lambda
- **Pricing**: $0.20 per 1M requests + $0.0000166667 per GB-second
- **Free Tier**: 1M requests + 400K GB-seconds/month (12 months)
- **Configuration**: 512MB memory, 200ms avg execution time

### Amazon DynamoDB  
- **Pricing**: $0.125 per 1M reads, $0.625 per 1M writes, $0.25 per GB storage
- **Free Tier**: 25GB storage + 25 read/write units (always free)
- **Usage Pattern**: 70% reads, 30% writes, 2KB average record size

### Amazon API Gateway
- **Pricing**: $3.50 per 1M requests (first 333M)
- **Free Tier**: 1M requests/month (12 months)
- **Type**: REST API endpoints

## Key Recommendations

1. **Start Small**: Leverage free tier for initial 12 months
2. **Monitor Usage**: Set up cost alerts at $10, $50, $100 thresholds  
3. **Optimize Early**: Use ARM processors for 20% Lambda savings
4. **Scale Smart**: Consider provisioned capacity when usage stabilizes

## Cost Drivers

1. **API Gateway** (60-70% of costs at scale)
2. **Lambda Compute** (25-30% of costs)
3. **DynamoDB Operations** (5-10% of costs)
4. **Storage** (minimal due to free tier)

## Next Steps

1. Deploy with on-demand billing
2. Monitor actual usage patterns for 30 days
3. Optimize based on real metrics
4. Plan scaling strategy based on growth projections

---
*Analysis based on AWS pricing as of November 4, 2025, US East (N. Virginia) region*
