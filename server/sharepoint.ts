import { Client } from '@microsoft/microsoft-graph-client';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sharepoint',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('SharePoint not connected');
  }
  return accessToken;
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
    
    console.log('Processing Loop URL...');
    
    const contentStorageMatch = fullyDecodedUrl.match(/CSP_([a-f0-9-]+)/i);
    const loopFileMatch = fullyDecodedUrl.match(/([^\/]+\.loop)/i);
    
    if (contentStorageMatch && loopFileMatch) {
      const siteId = contentStorageMatch[1];
      const fileName = loopFileMatch[1];
      
      console.log(`Found CSP site ID: ${siteId}, file: ${fileName}`);
      
      try {
        const sharepointDomain = fullyDecodedUrl.match(/https?:\/\/([^\/]+\.sharepoint\.com)/)?.[1];
        if (sharepointDomain) {
          const siteResponse = await client.api(`/sites/${sharepointDomain}:/contentstorage/CSP_${siteId}`).get();
          console.log('Site found:', siteResponse.id);
          
          const drivesResponse = await client.api(`/sites/${siteResponse.id}/drives`).get();
          if (drivesResponse.value?.length > 0) {
            for (const drive of drivesResponse.value) {
              try {
                const searchResults = await client.api(`/drives/${drive.id}/root/search(q='${fileName.replace('.loop', '')}')`).get();
                
                if (searchResults.value?.length > 0) {
                  const item = searchResults.value[0];
                  console.log('Found item:', item.name);
                  
                  const content = await client.api(`/drives/${drive.id}/items/${item.id}/content`).get();
                  
                  if (typeof content === 'string') {
                    return stripHtmlTags(content);
                  }
                  if (content && typeof content === 'object') {
                    return JSON.stringify(content, null, 2);
                  }
                }
              } catch (searchErr: any) {
                console.log(`Search in drive ${drive.id} failed:`, searchErr.message);
              }
            }
          }
        }
      } catch (siteErr: any) {
        console.log('Site access error:', siteErr.message);
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
        if (content && typeof content === 'object') {
          return JSON.stringify(content, null, 2);
        }
      } catch (shareErr: any) {
        console.log('Sharing URL access error:', shareErr.message);
      }
    }
    
    return "Could not fetch Loop content. The SharePoint connector may not have access to Loop's content storage. Please ensure the Loop document is shared with your organization.";
  } catch (error: any) {
    console.error('Error fetching Loop content:', error);
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
