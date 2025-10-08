import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  try {
    const tenant_id = process.env.AZURE_TENANT_ID!;
    const client_id = process.env.AZURE_CLIENT_ID!;
    const client_secret = process.env.AZURE_CLIENT_SECRET!;
    const scope = 'https://service.flow.microsoft.com//.default';

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', client_id);
    params.append('client_secret', client_secret);
    params.append('scope', scope);

    const tokenUrl = `https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`;

    const tokenResp = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!tokenResp.ok) {
      const errText = await tokenResp.text();
      return NextResponse.json({ error: errText }, { status: tokenResp.status });
    }

    const tokenData = await tokenResp.json();
    return NextResponse.json({ access_token: tokenData.access_token });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
