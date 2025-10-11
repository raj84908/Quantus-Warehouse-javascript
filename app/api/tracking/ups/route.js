import { NextResponse } from 'next/server';

// UPS Tracking API Integration
export async function POST(request) {
  try {
    const { trackingNumber } = await request.json();

    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'Tracking number is required' },
        { status: 400 }
      );
    }

    // Check for UPS API credentials
    const clientId = process.env.UPS_CLIENT_ID;
    const clientSecret = process.env.UPS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.warn('UPS API credentials not configured');
      return NextResponse.json(
        {
          error: 'UPS API not configured',
          fallbackUrl: `https://www.ups.com/track?tracknum=${trackingNumber}`,
          message: 'Please add UPS_CLIENT_ID and UPS_CLIENT_SECRET to your .env file'
        },
        { status: 501 }
      );
    }

    // Step 1: Get OAuth token
    const tokenResponse = await fetch('https://onlinetools.ups.com/security/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to authenticate with UPS API');
    }

    const { access_token } = await tokenResponse.json();

    // Step 2: Track shipment
    const trackingResponse = await fetch(
      `https://onlinetools.ups.com/api/track/v1/details/${trackingNumber}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'transId': `track-${Date.now()}`,
          'transactionSrc': 'Quantus'
        }
      }
    );

    if (!trackingResponse.ok) {
      const errorData = await trackingResponse.json().catch(() => ({}));
      throw new Error(errorData.response?.errors?.[0]?.message || 'Failed to track shipment');
    }

    const trackingData = await trackingResponse.json();

    // Parse UPS response
    const shipment = trackingData.trackResponse?.shipment?.[0];
    if (!shipment) {
      return NextResponse.json(
        { error: 'No tracking information found' },
        { status: 404 }
      );
    }

    const package_ = shipment.package?.[0];
    const activity = package_.activity || [];
    const currentStatus = package_.currentStatus;
    const deliveryDate = package_.deliveryDate?.[0];

    // Format response
    const response = {
      carrier: 'UPS',
      trackingNumber,
      status: currentStatus?.description || 'In Transit',
      statusCode: currentStatus?.code || 'IT',
      estimatedDelivery: deliveryDate?.date
        ? new Date(deliveryDate.date).toLocaleDateString()
        : null,
      location: activity[0]?.location?.address
        ? `${activity[0].location.address.city}, ${activity[0].location.address.stateProvince}`
        : null,
      events: activity.map(event => ({
        date: event.date,
        time: event.time,
        status: event.status?.description || '',
        location: event.location?.address
          ? `${event.location.address.city}, ${event.location.address.stateProvince}, ${event.location.address.country}`
          : 'N/A',
        description: event.status?.description || ''
      })),
      trackingUrl: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      lastUpdate: activity[0]?.date && activity[0]?.time
        ? `${activity[0].date} ${activity[0].time}`
        : new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('UPS tracking error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to track shipment',
        trackingUrl: `https://www.ups.com/track?tracknum=${request.body?.trackingNumber}`
      },
      { status: 500 }
    );
  }
}
