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
    
    const decodedUrl = decodeURIComponent(loopUrl);
    
    let siteId: string | null = null;
    let driveItemPath: string | null = null;
    
    const sharepointMatch = decodedUrl.match(/https:\/\/([^\/]+)\.sharepoint\.com/);
    if (sharepointMatch) {
      const domain = sharepointMatch[1];
      
      const pathMatch = decodedUrl.match(/contentstorage\/([^\/]+)\/.*?\/([^?]+\.loop)/);
      if (pathMatch) {
        const contentStorageId = pathMatch[1];
        const fileName = pathMatch[2];
        
        try {
          const site = await client.api(`/sites/${domain}.sharepoint.com:/contentStorage/${contentStorageId}`).get();
          siteId = site.id;
          
          const drives = await client.api(`/sites/${siteId}/drives`).get();
          if (drives.value && drives.value.length > 0) {
            const drive = drives.value[0];
            
            const searchResults = await client.api(`/drives/${drive.id}/root/search(q='${fileName}')`).get();
            
            if (searchResults.value && searchResults.value.length > 0) {
              const item = searchResults.value[0];
              
              const content = await client.api(`/drives/${drive.id}/items/${item.id}/content`).get();
              
              if (typeof content === 'string') {
                return stripHtmlTags(content);
              }
              return JSON.stringify(content, null, 2);
            }
          }
        } catch (graphError: any) {
          console.log('Graph API error:', graphError.message);
        }
      }
    }
    
    return "Could not fetch Loop content. Please ensure the Loop document is accessible and try again.";
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
