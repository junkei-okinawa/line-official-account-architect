import { describe, it, expect, vi } from 'vitest';
import { GeminiError, chatWithGemini } from './geminiService';
import { Message, LineOASettings } from '../types';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    constructor() {}
    getGenerativeModel() {
      return {
        generateContent: mockGenerateContent
      };
    }
  }
}));

describe('GeminiError', () => {
  it('should create GeminiError with message only', () => {
    const error = new GeminiError('Test error');
    expect(error.name).toBe('GeminiError');
    expect(error.message).toBe('Test error');
    expect(error.code).toBeUndefined();
  });

  it('should create GeminiError with code and original error', () => {
    const originalError = new Error('Original');
    const error = new GeminiError('Test error', 'TEST_CODE', originalError);
    expect(error.name).toBe('GeminiError');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.originalError).toBe(originalError);
  });
});

describe('chatWithGemini', () => {
  const mockMessages: Message[] = [
    { id: '1', role: 'user', content: 'Hello', timestamp: new Date() }
  ];
  
  const mockSettings: LineOASettings = {
    accountName: '',
    description: '',
    channelId: '',
    channelSecret: '',
    channelAccessToken: '',
    greetingMessage: '',
    richMenuJson: ''
  };

  beforeEach(() => {
    mockGenerateContent.mockClear();
  });

  it('should throw MISSING_API_KEY error when apiKey is empty', async () => {
    await expect(chatWithGemini(mockMessages, mockSettings, '')).rejects.toThrow(GeminiError);
    await expect(chatWithGemini(mockMessages, mockSettings, '')).rejects.toHaveProperty('code', 'MISSING_API_KEY');
  });

  it('should throw INVALID_API_KEY error when API returns 401', async () => {
    mockGenerateContent.mockRejectedValue({ code: '401' });

    await expect(chatWithGemini(mockMessages, mockSettings, 'invalid-key')).rejects.toThrow(GeminiError);
    await expect(chatWithGemini(mockMessages, mockSettings, 'invalid-key')).rejects.toHaveProperty('code', 'INVALID_API_KEY');
  });

  it('should throw RATE_LIMITED error when API returns 429', async () => {
    mockGenerateContent.mockRejectedValue({ code: '429' });

    await expect(chatWithGemini(mockMessages, mockSettings, 'valid-key')).rejects.toThrow(GeminiError);
    await expect(chatWithGemini(mockMessages, mockSettings, 'valid-key')).rejects.toHaveProperty('code', 'RATE_LIMITED');
  });

  it('should throw SERVER_ERROR error when API returns 500', async () => {
    mockGenerateContent.mockRejectedValue({ code: '500' });

    await expect(chatWithGemini(mockMessages, mockSettings, 'valid-key')).rejects.toThrow(GeminiError);
    await expect(chatWithGemini(mockMessages, mockSettings, 'valid-key')).rejects.toHaveProperty('code', 'SERVER_ERROR');
  });

  it('should throw EMPTY_RESPONSE error when response is empty', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: vi.fn().mockReturnValue('') }
    });

    await expect(chatWithGemini(mockMessages, mockSettings, 'valid-key')).rejects.toThrow(GeminiError);
    await expect(chatWithGemini(mockMessages, mockSettings, 'valid-key')).rejects.toHaveProperty('code', 'EMPTY_RESPONSE');
  });

  it('should return response text when API call succeeds', async () => {
    const expectedResponse = 'This is a test response';
    
    mockGenerateContent.mockResolvedValue({
      response: { text: vi.fn().mockReturnValue(expectedResponse) }
    });

    const result = await chatWithGemini(mockMessages, mockSettings, 'valid-key');
    expect(result).toBe(expectedResponse);
  });
});
