//! Type definitions for LINE Official Account Architect (Leptos port)
//!
//! These types mirror the original TypeScript definitions from `types.ts`
//! and are designed to work with Leptos's reactive system.

use chrono::{DateTime, Utc};

/// Message in a chat conversation
#[derive(Debug, Clone)]
pub struct Message {
    pub id: String,
    pub role: Role,
    pub content: String,
    #[allow(dead_code)]
    pub r#type: Option<MessageType>,
    pub timestamp: DateTime<Utc>,
}

/// Message sender role
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Role {
    User,
    Assistant,
}

impl From<&str> for Role {
    fn from(s: &str) -> Self {
        match s {
            "user" => Role::User,
            _ => Role::Assistant,
        }
    }
}

/// Message type (text, flex message, rich menu)
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MessageType {
    Text,
    Flex,
    RichMenu,
}

impl From<&str> for MessageType {
    fn from(s: &str) -> Self {
        match s {
            "text" => MessageType::Text,
            "flex" => MessageType::Flex,
            _ => MessageType::RichMenu,
        }
    }
}

/// LINE Official Account settings
#[derive(Debug, Clone)]
pub struct LineOASettings {
    pub account_name: String,
    pub description: String,
    pub channel_id: String,
    pub channel_secret: String,
    pub channel_access_token: String,
    pub greeting_message: String,
    #[allow(dead_code)]
    pub rich_menu_json: Option<String>,
}

/// MCP Server configuration
#[derive(Debug, Clone)]
pub struct McpServerConfig {
    /// MCP server URL (e.g., ws://localhost:3000)
    pub server_url: String,
    /// LINE Channel Token
    pub channel_token: String,
    /// MCP server connection enabled flag
    pub enabled: bool,
}

/// Rich menu operation result
#[derive(Debug, Clone)]
pub struct RichMenuOperationResult {
    pub success: bool,
    #[allow(dead_code)]
    pub rich_menu_id: Option<String>,
    #[allow(dead_code)]
    pub message: Option<String>,
    #[allow(dead_code)]
    pub error: Option<String>,
}

/// Message send test result
#[derive(Debug, Clone)]
pub struct MessageSendTestResult {
    pub success: bool,
    #[allow(dead_code)]
    pub message_id: Option<String>,
    #[allow(dead_code)]
    pub error: Option<String>,
    pub timestamp: DateTime<Utc>,
}

/// Application step/phase enum
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Step {
    Strategy,
    Config,
    RichMenu,
    Messaging,
    Preview,
    McpIntegration,
}

impl Step {
    /// Get the string representation of this step
    pub fn as_str(&self) -> &'static str {
        match self {
            Step::Strategy => "STRATEGY",
            Step::Config => "CONFIG",
            Step::RichMenu => "RICH_MENU",
            Step::Messaging => "MESSAGING",
            Step::Preview => "PREVIEW",
            Step::McpIntegration => "MCP_INTEGRATION",
        }
    }
}

impl From<&str> for Step {
    fn from(s: &str) -> Self {
        match s {
            "STRATEGY" | "strategy" => Step::Strategy,
            "CONFIG" | "config" => Step::Config,
            "RICH_MENU" | "rich_menu" => Step::RichMenu,
            "MESSAGING" | "messaging" => Step::Messaging,
            "PREVIEW" | "preview" => Step::Preview,
            "MCP_INTEGRATION" | "mcp_integration" => Step::McpIntegration,
            _ => Step::Strategy,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_role_from_str() {
        assert_eq!(Role::from("user"), Role::User);
        assert_eq!(Role::from("assistant"), Role::Assistant);
    }

    #[test]
    fn test_message_type_from_str() {
        assert_eq!(MessageType::from("text"), MessageType::Text);
        assert_eq!(MessageType::from("flex"), MessageType::Flex);
        assert_eq!(MessageType::from("richmenu"), MessageType::RichMenu);
    }

    #[test]
    fn test_step_as_str() {
        let step = Step::Config;
        assert_eq!(step.as_str(), "CONFIG");
    }

    #[test]
    fn test_step_from_str() {
        assert_eq!(Step::from("STRATEGY"), Step::Strategy);
        assert_eq!(Step::from("config"), Step::Config);
        assert_eq!(Step::from("mcp_integration"), Step::McpIntegration);
    }

    #[test]
    fn test_message_creation() {
        let message = Message {
            id: "1".to_string(),
            role: Role::User,
            content: "Hello!".to_string(),
            r#type: Some(MessageType::Text),
            timestamp: Utc::now(),
        };

        assert_eq!(message.id, "1");
        assert_eq!(message.role, Role::User);
        assert_eq!(message.content, "Hello!");
    }

    #[test]
    fn test_line_oa_settings_creation() {
        let settings = LineOASettings {
            account_name: "Test OA".to_string(),
            description: "A test LINE Official Account".to_string(),
            channel_id: "1234567890".to_string(),
            channel_secret: "secret_key".to_string(),
            channel_access_token: "access_token".to_string(),
            greeting_message: "Hello!".to_string(),
            rich_menu_json: None,
        };

        assert_eq!(settings.account_name, "Test OA");
    }

    #[test]
    fn test_mcp_server_config_creation() {
        let config = McpServerConfig {
            server_url: "ws://localhost:3000".to_string(),
            channel_token: "channel_token_123".to_string(),
            enabled: true,
        };

        assert_eq!(config.server_url, "ws://localhost:3000");
        assert!(!config.enabled); // Should be false initially
    }
}
