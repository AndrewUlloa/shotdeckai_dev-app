import type { Env } from './types'

interface UploadResponse {
  result: {
    id: string
    variants: string[]
  }
  success: boolean
  errors: unknown[]
}

export async function uploadToCloudflareImages(imageUrl: string, env: Env): Promise<string> {
  console.log('Uploading image to Cloudflare Images:', imageUrl)
  
  try {
    // Fetch the image from FAL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from FAL: ${imageResponse.status}`)
    }
    
    const imageBlob = await imageResponse.blob()
    
    // Create form data for Cloudflare Images upload
    const formData = new FormData()
    formData.append('file', imageBlob)

    // Upload to Cloudflare Images
    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`, 
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`
        },
        body: formData
      }
    )

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('Cloudflare Images upload failed:', uploadResponse.status, errorText)
      throw new Error(`Failed to upload to Cloudflare Images: ${uploadResponse.status}`)
    }

    const result = (await uploadResponse.json()) as UploadResponse
    
    if (!result.success) {
      console.error('Cloudflare Images upload unsuccessful:', result.errors)
      throw new Error('Failed to upload image: ' + JSON.stringify(result.errors))
    }

    console.log('Successfully uploaded to Cloudflare Images:', result.result.id)
    return result.result.id
  } catch (error) {
    console.error('Error in uploadToCloudflareImages:', error)
    throw error
  }
} 