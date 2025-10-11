import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Load shipping credentials
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, check if credentials exist in database
    let settings = await prisma.systemSettings.findFirst({
      where: { key: 'shipping_credentials' }
    });

    if (settings && settings.value) {
      const credentials = JSON.parse(settings.value);
      return NextResponse.json({
        upsClientId: credentials.upsClientId || "",
        upsClientSecret: credentials.upsClientSecret || "",
        fedexClientId: credentials.fedexClientId || "",
        fedexClientSecret: credentials.fedexClientSecret || ""
      });
    }

    // If not in database, check environment variables
    return NextResponse.json({
      upsClientId: process.env.UPS_CLIENT_ID || "",
      upsClientSecret: process.env.UPS_CLIENT_SECRET || "",
      fedexClientId: process.env.FEDEX_CLIENT_ID || "",
      fedexClientSecret: process.env.FEDEX_CLIENT_SECRET || ""
    });
  } catch (error) {
    console.error('Error loading shipping credentials:', error);
    return NextResponse.json(
      { error: 'Failed to load credentials' },
      { status: 500 }
    );
  }
}

// POST - Save shipping credentials
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credentials = await request.json();

    // Validate input
    if (!credentials.upsClientId && !credentials.upsClientSecret &&
        !credentials.fedexClientId && !credentials.fedexClientSecret) {
      return NextResponse.json(
        { error: 'At least one credential is required' },
        { status: 400 }
      );
    }

    // Save to database
    await prisma.systemSettings.upsert({
      where: { key: 'shipping_credentials' },
      update: {
        value: JSON.stringify({
          upsClientId: credentials.upsClientId || "",
          upsClientSecret: credentials.upsClientSecret || "",
          fedexClientId: credentials.fedexClientId || "",
          fedexClientSecret: credentials.fedexClientSecret || ""
        }),
        updatedAt: new Date()
      },
      create: {
        key: 'shipping_credentials',
        value: JSON.stringify({
          upsClientId: credentials.upsClientId || "",
          upsClientSecret: credentials.upsClientSecret || "",
          fedexClientId: credentials.fedexClientId || "",
          fedexClientSecret: credentials.fedexClientSecret || ""
        })
      }
    });

    // Update environment variables dynamically
    if (credentials.upsClientId) {
      process.env.UPS_CLIENT_ID = credentials.upsClientId;
    }
    if (credentials.upsClientSecret) {
      process.env.UPS_CLIENT_SECRET = credentials.upsClientSecret;
    }
    if (credentials.fedexClientId) {
      process.env.FEDEX_CLIENT_ID = credentials.fedexClientId;
    }
    if (credentials.fedexClientSecret) {
      process.env.FEDEX_CLIENT_SECRET = credentials.fedexClientSecret;
    }

    return NextResponse.json({
      success: true,
      message: 'Shipping credentials saved successfully'
    });
  } catch (error) {
    console.error('Error saving shipping credentials:', error);
    return NextResponse.json(
      { error: 'Failed to save credentials' },
      { status: 500 }
    );
  }
}
