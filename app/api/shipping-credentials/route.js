import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

// GET - Load shipping credentials (organization-specific)
export const GET = withAuth(async (request, { user }) => {
  try {
    // Fetch organization-specific shipping credentials
    const credentials = await prisma.shippingCredentials.findUnique({
      where: { organizationId: user.organizationId }
    });

    if (credentials) {
      return NextResponse.json({
        upsClientId: credentials.upsClientId || "",
        upsClientSecret: credentials.upsClientSecret || "",
        fedexClientId: credentials.fedexClientId || "",
        fedexClientSecret: credentials.fedexClientSecret || ""
      });
    }

    // Return empty credentials if not configured
    return NextResponse.json({
      upsClientId: "",
      upsClientSecret: "",
      fedexClientId: "",
      fedexClientSecret: ""
    });
  } catch (error) {
    console.error('Error loading shipping credentials:', error);
    return NextResponse.json(
      { error: 'Failed to load credentials' },
      { status: 500 }
    );
  }
});

// POST - Save shipping credentials (organization-specific)
export const POST = withAuth(async (request, { user }) => {
  try {
    const data = await request.json();

    // Validate input
    if (!data.upsClientId && !data.upsClientSecret &&
        !data.fedexClientId && !data.fedexClientSecret) {
      return NextResponse.json(
        { error: 'At least one credential is required' },
        { status: 400 }
      );
    }

    // Check if credentials already exist for this organization
    const existing = await prisma.shippingCredentials.findUnique({
      where: { organizationId: user.organizationId }
    });

    let credentials;
    if (existing) {
      // Update existing credentials
      credentials = await prisma.shippingCredentials.update({
        where: { organizationId: user.organizationId },
        data: {
          upsClientId: data.upsClientId || existing.upsClientId,
          upsClientSecret: data.upsClientSecret || existing.upsClientSecret,
          fedexClientId: data.fedexClientId || existing.fedexClientId,
          fedexClientSecret: data.fedexClientSecret || existing.fedexClientSecret
        }
      });
    } else {
      // Create new credentials for this organization
      credentials = await prisma.shippingCredentials.create({
        data: {
          upsClientId: data.upsClientId || "",
          upsClientSecret: data.upsClientSecret || "",
          fedexClientId: data.fedexClientId || "",
          fedexClientSecret: data.fedexClientSecret || "",
          organizationId: user.organizationId
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Shipping credentials saved successfully',
      credentials
    });
  } catch (error) {
    console.error('Error saving shipping credentials:', error);
    return NextResponse.json(
      { error: 'Failed to save credentials' },
      { status: 500 }
    );
  }
});
