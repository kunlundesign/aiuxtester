import axios from 'axios';

export interface AzureOpenAIOptions {
  apiKey: string;
  endpoint: string;
  deployment: string;
  apiVersion: string;
}

export async function azureOpenAIChat({
  messages,
  images,
  options
}: {
  messages: any[];
  images?: string[];
  options: AzureOpenAIOptions;
}) {
  const url = `${options.endpoint}openai/deployments/${options.deployment}/chat/completions?api-version=${options.apiVersion}`;
  const headers = {
    'api-key': options.apiKey,
    'Content-Type': 'application/json'
  };
  
  // 如果有图片，需要将图片包含在用户消息的content中
  const processedMessages = messages.map((message, index) => {
    if (message.role === 'user' && images && images.length > 0 && index === messages.length - 1) {
      // 对于最后一条用户消息，如果有图片，将内容转换为array格式
      return {
        ...message,
        content: [
          { type: 'text', text: message.content },
          ...images.map(image => ({
            type: 'image_url',
            image_url: { url: image }
          }))
        ]
      };
    }
    return message;
  });
  
  const data = {
    messages: processedMessages,
    max_tokens: 2048,
    temperature: 0.7
  };
  const response = await axios.post(url, data, { headers });
  return response.data;
}
