use crate::libs::{db::AppState, error::ApiError};
use axum::Json;
use axum::extract::State;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct HealthResponse {
    status: String,
}

pub async fn health(State(AppState { .. }): State<AppState>) -> Result<Json<HealthResponse>, ApiError> {
    Ok(Json(HealthResponse { status: "ok".to_string() }))
}