import { Client } from '@microsoft/microsoft-graph-client';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Azure credentials not configured. Please set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET.');
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('grant_type', 'client_credentials');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token fetch error:', error);
    throw new Error('Failed to get Azure access token');
  }

  const data = await response.json();
  
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

export async function getSharePointClient() {
  const accessToken = await getAccessToken();

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
}

export async function fetchLoopContent(loopUrl: string): Promise<string> {
  try {
    const client = await getSharePointClient();
    
    let fullyDecodedUrl = loopUrl;
    try {
      while (fullyDecodedUrl.includes('%')) {
        const decoded = decodeURIComponent(fullyDecodedUrl);
        if (decoded === fullyDecodedUrl) break;
        fullyDecodedUrl = decoded;
      }
    } catch (e) {
    }
    
    console.log('Processing Loop URL with custom Azure credentials...');
    
    const contentStorageMatch = fullyDecodedUrl.match(/CSP_([a-f0-9-]+)/i);
    const loopFileMatch = fullyDecodedUrl.match(/([^\/]+\.loop)/i);
    const sharepointDomain = fullyDecodedUrl.match(/https?:\/\/([^\/]+\.sharepoint\.com)/)?.[1];
    
    if (contentStorageMatch && sharepointDomain) {
      const cspId = contentStorageMatch[1];
      console.log(`Found CSP ID: ${cspId}, Domain: ${sharepointDomain}`);
      
      try {
        const sitePath = `/contentstorage/CSP_${cspId}`;
        const siteResponse = await client.api(`/sites/${sharepointDomain}:${sitePath}`).get();
        console.log('Site found:', siteResponse.displayName || siteResponse.id);
        
        const drivesResponse = await client.api(`/sites/${siteResponse.id}/drives`).get();
        
        if (drivesResponse.value?.length > 0) {
          for (const drive of drivesResponse.value) {
            try {
              const items = await client.api(`/drives/${drive.id}/root/children`).get();
              
              for (const item of items.value || []) {
                if (item.name?.endsWith('.loop')) {
                  console.log('Found Loop file:', item.name);
                  
                  try {
                    const content = await client.api(`/drives/${drive.id}/items/${item.id}/content?format=html`).get();
                    if (typeof content === 'string') {
                      return stripHtmlTags(content);
                    }
                  } catch (contentErr: any) {
                    console.log('HTML format not available, trying raw content');
                    const rawContent = await client.api(`/drives/${drive.id}/items/${item.id}/content`).get();
                    if (typeof rawContent === 'string') {
                      return stripHtmlTags(rawContent);
                    }
                    if (rawContent && typeof rawContent === 'object') {
                      return JSON.stringify(rawContent, null, 2);
                    }
                  }
                }
              }
              
              if (loopFileMatch) {
                const searchQuery = loopFileMatch[1].replace('.loop', '');
                const searchResults = await client.api(`/drives/${drive.id}/root/search(q='${searchQuery}')`).get();
                
                if (searchResults.value?.length > 0) {
                  const item = searchResults.value[0];
                  console.log('Found via search:', item.name);
                  
                  const content = await client.api(`/drives/${drive.id}/items/${item.id}/content`).get();
                  if (typeof content === 'string') {
                    return stripHtmlTags(content);
                  }
                }
              }
            } catch (driveErr: any) {
              console.log(`Drive ${drive.id} error:`, driveErr.message);
            }
          }
        }
      } catch (siteErr: any) {
        console.log('Site access error:', siteErr.message);
        if (siteErr.message?.includes('Access denied') || siteErr.statusCode === 403) {
          return "Access denied. Please ensure you clicked 'Grant admin consent' for Sites.Read.All and Files.Read.All permissions in your Azure app.";
        }
      }
    }
    
    const shareableUrlMatch = fullyDecodedUrl.match(/https:\/\/[^\/]+\.sharepoint\.com\/:fl:\/[^?]+/);
    if (shareableUrlMatch) {
      try {
        const encodedUrl = Buffer.from(shareableUrlMatch[0]).toString('base64')
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        
        const sharedItem = await client.api(`/shares/u!${encodedUrl}/driveItem`).get();
        console.log('Found shared item:', sharedItem.name);
        
        const content = await client.api(`/drives/${sharedItem.parentReference.driveId}/items/${sharedItem.id}/content`).get();
        
        if (typeof content === 'string') {
          return stripHtmlTags(content);
        }
      } catch (shareErr: any) {
        console.log('Sharing URL access error:', shareErr.message);
      }
    }
    
    return "Could not fetch Loop content. Please verify: 1) Admin consent was granted for the Azure app permissions, 2) The Loop URL is correct and accessible.";
  } catch (error: any) {
    console.error('Error fetching Loop content:', error);
    if (error.message?.includes('credentials not configured')) {
      return error.message;
    }
    throw new Error(`Failed to fetch Loop content: ${error.message}`);
  }
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}
