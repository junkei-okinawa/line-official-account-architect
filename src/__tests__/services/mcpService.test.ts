import { describe, it, expect } from 'vitest';
import { McpService } from '../../../services/mcpService';

describe('McpService', () => {
  describe('connection state checks without mocking', () => {
    let mcpService: McpService;

    beforeEach(() => {
      mcpService = new McpService();
    });

    it('should create service instance', () => {
      expect(mcpService).toBeDefined();
    });

    describe('isConnected', () => {
      it('should return false when not connected', () => {
        expect(mcpService.isConnected()).toBe(false);
      });
    });

    describe('richMenuOperation', () => {
      it('should return error when not connected', async () => {
        const result = await mcpService.richMenuOperation('generate');

        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
      });
    });

    describe('getRichMenuList', () => {
      it('should return empty array when not connected', async () => {
        const result = await mcpService.getRichMenuList();

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      });
    });

    describe('testMessageSend', () => {
      it('should return error when not connected', async () => {
        const result = await mcpService.testMessageSend('user123', 'text', { text: 'Hello' });

        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
      });
    });
  });
});
