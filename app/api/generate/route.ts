import { NextRequest } from 'next/server';

// 使用环境变量中的 API 密钥
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

const MODEL_NAME = 'gemini-2.5-flash-image-preview';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

// 定义请求体类型
interface GenerateRequest {
  prompt: string;
  images: string[];
}

// 将 Base64 字符串转换为 API payload 所需的 inlineData 结构
function base64ToInlineData(base64String: string) {
  const parts = base64String.split(';base64,');
  if (parts.length !== 2) {
    console.error('Invalid base64 string format.');
    return null;
  }
  const mimeType = parts[0].replace('data:', '');
  const data = parts[1];
  return {
    inlineData: {
      mimeType: mimeType,
      data: data
    }
  };
}

// 带重试机制的 API 调用函数
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          if (i === retries - 1) {
            throw new Error(`Server error (${response.status})`);
          }
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
          continue;
        }
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
      }
      return response;
    } catch (error) {
      if (i === retries - 1) {
        console.error('API call failed after all retries:', error);
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Should not reach here');
}

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return Response.json({ error: 'API key is not configured' }, { status: 500 });
  }

  try {
    const { prompt, images }: GenerateRequest = await request.json();

    // 构建包含图片和文本的 parts 数组
    const contentsParts = [
      // 首先是文字提示
      { text: prompt }, 
      // 接着是所有上传的图片
      ...images.map(base64ToInlineData)
    ].filter(part => part !== null); // 过滤掉无效数据

    const payload = {
      contents: [{
        parts: contentsParts
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE']
      },
    };

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    };

    const response = await fetchWithRetry(API_URL, options);
    const result = await response.json();
    
    // 解析 gemini-2.5-flash-image-preview 的响应结构
    const base64Data = result?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
    
    if (!base64Data) {
      console.error('Image generation failed:', result);
      return Response.json({ error: 'Failed to get image data from API' }, { status: 500 });
    }
    
    return Response.json({ generatedImage: `data:image/png;base64,${base64Data}` });
  } catch (error: any) {
    console.error('Error generating image:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}