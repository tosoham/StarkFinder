use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReviewsCursor {
    pub created_at: DateTime<Utc>,
    pub id: i64,
}

pub fn encode_cursor(cursor: &ReviewsCursor) -> String {
    let json = serde_json::to_vec(cursor).expect("cursor json");
    URL_SAFE_NO_PAD.encode(json)
}

pub fn decode_cursor(s: &str) -> Option<ReviewsCursor> {
    let bytes = URL_SAFE_NO_PAD.decode(s).ok()?;
    serde_json::from_slice(&bytes).ok()
}



