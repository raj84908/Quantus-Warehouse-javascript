import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

// FedEx Tracking API Integration
export const POST = withAuth(async (request, { user }) => {
  try {
    const { trackingNumber } = await request.json();

    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'Tracking number is required' },
        { status: 400 }
      );
    }

    // Fetch organization-specific FedEx API credentials
    const shippingCreds = await prisma.shippingCredentials.findUnique({
      where: { organizationId: user.organizationId }
    });

    const clientId = shippingCreds?.fedexClientId;
    const clientSecret = shippingCreds?.fedexClientSecret;

    if (!clientId || !clientSecret) {
      console.warn('FedEx API credentials not configured for organization:', user.organizationId);
      return NextResponse.json(
        {
          error: 'FedEx API not configured',
          fallbackUrl: `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`,
          message: 'Please configure FedEx API credentials in Settings > Integrations'
        },
        { status: 501 }
      );
    }

    // Step 1: Get OAuth token
    const tokenResponse = await fetch('https://apis.fedex.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to authenticate with FedEx API');
    }

    const { access_token } = await tokenResponse.json();

    // Step 2: Track shipment
    const trackingResponse = await fetch('https://apis.fedex.com/track/v1/trackingnumbers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-locale': 'en_US'
      },
      body: JSON.stringify({
        includeDetailedScans: true,
        trackingInfo: [
          {
            trackingNumberInfo: {
              trackingNumber: trackingNumber
            }
          }
        ]
      })
    });

    if (!trackingResponse.ok) {
      const errorData = await trackingResponse.json().catch(() => ({}));
      throw new Error(errorData.errors?.[0]?.message || 'Failed to track shipment');
    }

    const trackingData = await trackingResponse.json();

    // Parse FedEx response
    const completeTrackResults = trackingData.output?.completeTrackResults?.[0];
    if (!completeTrackResults || completeTrackResults.trackResults?.length === 0) {
      return NextResponse.json(
        { error: 'No tracking information found' },
        { status: 404 }
      );
    }

    const trackResult = completeTrackResults.trackResults[0];
    const latestStatus = trackResult.latestStatusDetail;
    const scanEvents = trackResult.scanEvents || [];
    const estimatedDelivery = trackResult.dateAndTimes?.find(dt => dt.type === 'ESTIMATED_DELIVERY');

    // Format response
    const response = {
      carrier: 'FedEx',
      trackingNumber,
      status: latestStatus?.description || 'In Transit',
      statusCode: latestStatus?.code || 'IT',
      estimatedDelivery: estimatedDelivery?.dateTime
        ? new Date(estimatedDelivery.dateTime).toLocaleDateString()
        : null,
      location: latestStatus?.scanLocation?.city && latestStatus?.scanLocation?.stateOrProvinceCode
        ? `${latestStatus.scanLocation.city}, ${latestStatus.scanLocation.stateOrProvinceCode}`
        : null,
      events: scanEvents.map(event => ({
        date: event.date,
        time: event.time,
        status: event.eventDescription || '',
        location: event.scanLocation
          ? `${event.scanLocation.city || ''}, ${event.scanLocation.stateOrProvinceCode || ''}, ${event.scanLocation.countryCode || ''}`.trim()
          : 'N/A',
        description: event.eventDescription || ''
      })),
      trackingUrl: `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`,
      lastUpdate: scanEvents[0]?.date && scanEvents[0]?.time
        ? `${scanEvents[0].date} ${scanEvents[0].time}`
        : new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('FedEx tracking error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to track shipment',
        trackingUrl: `https://www.fedex.com/fedextrack/?tracknumbers=${request.body?.trackingNumber}`
      },
      { status: 500 }
    );
  }
});
